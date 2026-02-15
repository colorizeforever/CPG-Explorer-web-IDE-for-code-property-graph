// Package db provides SQLite database access for the CPG explorer.
package db

import (
	"database/sql"
	"fmt"
	"log/slog"

	_ "github.com/mattn/go-sqlite3"
)

// DB wraps a read-only SQLite connection pool configured for optimal CPG query performance.
type DB struct {
	conn *sql.DB
}

// Open creates a new DB from the SQLite file at path.
// It configures the connection for read-only, high-throughput queries.
func Open(path string) (*DB, error) {
	dsn := fmt.Sprintf("file:%s?mode=ro&cache=shared&_journal_mode=WAL", path)
	conn, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// Allow multiple concurrent readers.
	conn.SetMaxOpenConns(8)
	conn.SetMaxIdleConns(4)

	// Verify connectivity and apply performance pragmas.
	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	for _, pragma := range []string{
		"PRAGMA mmap_size = 536870912",  // 512 MiB memory-mapped I/O
		"PRAGMA cache_size = -128000",   // 128 MB page cache
		"PRAGMA temp_store = MEMORY",    // temp tables in memory
		"PRAGMA query_only = ON",        // enforce read-only
	} {
		if _, err := conn.Exec(pragma); err != nil {
			slog.Warn("pragma failed", "sql", pragma, "error", err)
		}
	}

	slog.Info("database opened", "path", path)
	return &DB{conn: conn}, nil
}

// Close releases the database connection pool.
func (db *DB) Close() error {
	return db.conn.Close()
}

// Query executes a read query and returns rows.
func (db *DB) Query(query string, args ...any) (*sql.Rows, error) {
	return db.conn.Query(query, args...)
}

// QueryRow executes a query expected to return at most one row.
func (db *DB) QueryRow(query string, args ...any) *sql.Row {
	return db.conn.QueryRow(query, args...)
}

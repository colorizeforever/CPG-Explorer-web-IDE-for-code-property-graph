package handler

import (
	"database/sql"
	"net/http"

	"cpg-explorer/internal/model"
)

// Source returns the source code for a file path.
func (h *Handler) Source(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Query().Get("file")
	if file == "" {
		writeError(w, "file path is required", http.StatusBadRequest)
		return
	}

	var src model.SourceFile
	err := h.db.QueryRow(
		"SELECT file, content, COALESCE(package, '') FROM sources WHERE file = ?", file,
	).Scan(&src.File, &src.Content, &src.Package)
	if err == sql.ErrNoRows {
		writeError(w, "file not found", http.StatusNotFound)
		return
	}
	if err != nil {
		writeError(w, "failed to read source", http.StatusInternalServerError)
		return
	}

	writeJSON(w, src)
}

// FileOutline returns the symbol outline of a file for sidebar navigation.
func (h *Handler) FileOutline(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Query().Get("file")
	if file == "" {
		writeError(w, "file path is required", http.StatusBadRequest)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, name, kind, COALESCE(line, 0), COALESCE(end_line, 0)
		FROM file_outline
		WHERE file = ?
		ORDER BY line`, file)
	if err != nil {
		writeError(w, "failed to query file outline", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var outline []model.FileOutline
	for rows.Next() {
		var o model.FileOutline
		rows.Scan(&o.ID, &o.Name, &o.Kind, &o.Line, &o.EndLine)
		outline = append(outline, o)
	}

	if outline == nil {
		outline = []model.FileOutline{}
	}

	writeJSON(w, outline)
}

// Schema returns the self-documenting schema_docs table.
func (h *Handler) Schema(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")

	var (
		rows *sql.Rows
		err  error
	)

	if category != "" {
		rows, err = h.db.Query(
			"SELECT category, name, description, COALESCE(example, '') FROM schema_docs WHERE category = ? ORDER BY name", category)
	} else {
		rows, err = h.db.Query(
			"SELECT category, name, description, COALESCE(example, '') FROM schema_docs ORDER BY category, name")
	}

	if err != nil {
		writeError(w, "failed to query schema", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var docs []model.SchemaDoc
	for rows.Next() {
		var d model.SchemaDoc
		rows.Scan(&d.Category, &d.Name, &d.Description, &d.Example)
		docs = append(docs, d)
	}

	writeJSON(w, docs)
}

// Queries returns the built-in query catalog from the queries table.
func (h *Handler) Queries(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT name, description, sql FROM queries ORDER BY name")
	if err != nil {
		writeError(w, "failed to query catalog", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var queries []model.Query
	for rows.Next() {
		var q model.Query
		rows.Scan(&q.Name, &q.Description, &q.SQL)
		queries = append(queries, q)
	}

	writeJSON(w, queries)
}

// Hotspots returns the top hotspot functions by combined risk score.
func (h *Handler) Hotspots(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 30)

	rows, err := h.db.Query(`
		SELECT function_id, name, COALESCE(package, ''), COALESCE(file, ''),
		       complexity, loc, fan_in, fan_out, finding_count, hotspot_score
		FROM dashboard_hotspots
		ORDER BY hotspot_score DESC
		LIMIT ?`, limit)
	if err != nil {
		writeError(w, "failed to query hotspots", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var spots []model.Hotspot
	for rows.Next() {
		var s model.Hotspot
		rows.Scan(&s.FunctionID, &s.Name, &s.Package, &s.File,
			&s.Complexity, &s.LOC, &s.FanIn, &s.FanOut,
			&s.FindingCount, &s.HotspotScore)
		spots = append(spots, s)
	}

	if spots == nil {
		spots = []model.Hotspot{}
	}

	writeJSON(w, spots)
}

// GlobalSearch searches across functions, types, and packages using the symbol_index table.
func (h *Handler) GlobalSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, []model.SearchResult{})
		return
	}

	limit := queryInt(r, "limit", 30)

	rows, err := h.db.Query(`
		SELECT id, name, kind, COALESCE(package, ''), COALESCE(file, ''), COALESCE(line, 0)
		FROM symbol_index
		WHERE name LIKE ?
		ORDER BY
			CASE WHEN name = ? THEN 0
			     WHEN name LIKE ? THEN 1
			     ELSE 2 END,
			name
		LIMIT ?`, "%"+q+"%", q, q+"%", limit)
	if err != nil {
		writeError(w, "search failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []model.SearchResult
	for rows.Next() {
		var s model.SearchResult
		rows.Scan(&s.ID, &s.Name, &s.Kind, &s.Package, &s.File, &s.Line)
		results = append(results, s)
	}

	if results == nil {
		results = []model.SearchResult{}
	}

	writeJSON(w, results)
}

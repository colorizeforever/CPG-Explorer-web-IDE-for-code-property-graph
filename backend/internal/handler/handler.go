// Package handler implements HTTP endpoints for the CPG explorer API.
package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"cpg-explorer/internal/db"
)

// Handler holds shared dependencies for all HTTP endpoints.
type Handler struct {
	db *db.DB
}

// New creates a Handler backed by the given database.
func New(database *db.DB) *Handler {
	return &Handler{db: database}
}

// Register mounts all API routes on the given mux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/overview", h.Overview)
	mux.HandleFunc("GET /api/distributions", h.Distributions)
	mux.HandleFunc("GET /api/packages", h.ListPackages)
	mux.HandleFunc("GET /api/packages/graph", h.PackageGraph)
	mux.HandleFunc("GET /api/packages/{name}/functions", h.PackageFunctions)
	mux.HandleFunc("GET /api/functions", h.SearchFunctions)
	mux.HandleFunc("GET /api/functions/detail", h.FunctionDetail)
	mux.HandleFunc("GET /api/callgraph", h.CallGraph)
	mux.HandleFunc("GET /api/dataflow", h.DataFlow)
	mux.HandleFunc("GET /api/source", h.Source)
	mux.HandleFunc("GET /api/source/outline", h.FileOutline)
	mux.HandleFunc("GET /api/schema", h.Schema)
	mux.HandleFunc("GET /api/queries", h.Queries)
	mux.HandleFunc("GET /api/hotspots", h.Hotspots)
	mux.HandleFunc("GET /api/search", h.GlobalSearch)
}

// --- helpers ---

// writeJSON encodes v as JSON and writes it to the response.
func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("json encode failed", "error", err)
	}
}

// writeError sends a JSON error response.
func writeError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// queryInt reads an integer query parameter with a default value.
func queryInt(r *http.Request, key string, defaultVal int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return v
}

package handler

import (
	"net/http"

	"cpg-explorer/internal/model"
)

// Overview returns high-level CPG statistics from the pre-computed dashboard_overview table.
func (h *Handler) Overview(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT key, value FROM dashboard_overview")
	if err != nil {
		writeError(w, "failed to query overview", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	kv := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			continue
		}
		kv[k] = v
	}

	ov := model.Overview{
		TotalPackages:   kv["total_packages"],
		TotalFiles:      kv["total_files"],
		TotalFunctions:  kv["total_functions"],
		TotalTypes:      kv["total_types"],
		TotalNodes:      kv["total_nodes"],
		TotalEdges:      kv["total_edges"],
		TotalLOC:        kv["total_loc"],
		AvgComplexity:   kv["avg_complexity"],
		MaxComplexity:   kv["max_complexity"],
		TotalCallEdges:  kv["total_call_edges"],
		TotalDFGEdges:   kv["total_dfg_edges"],
		TotalCFGEdges:   kv["total_cfg_edges"],
		TotalGoroutines: kv["total_goroutine_launches"],
		TotalDefers:     kv["total_defers"],
		TotalFindings:   kv["total_findings"],
		TotalInterfaces: kv["total_interfaces"],
	}

	writeJSON(w, ov)
}

// Distributions returns chart-ready data for the dashboard.
func (h *Handler) Distributions(w http.ResponseWriter, r *http.Request) {
	result := make(map[string]any)

	// Node kind distribution
	nodeRows, err := h.db.Query("SELECT node_kind, count, percentage FROM dashboard_node_distribution ORDER BY count DESC")
	if err == nil {
		defer nodeRows.Close()
		var nodes []model.Distribution
		for nodeRows.Next() {
			var d model.Distribution
			nodeRows.Scan(&d.Label, &d.Count, &d.Pct)
			nodes = append(nodes, d)
		}
		result["node_kinds"] = nodes
	}

	// Edge kind distribution
	edgeRows, err := h.db.Query("SELECT edge_kind, count, percentage FROM dashboard_edge_distribution ORDER BY count DESC")
	if err == nil {
		defer edgeRows.Close()
		var edges []model.Distribution
		for edgeRows.Next() {
			var d model.Distribution
			edgeRows.Scan(&d.Label, &d.Count, &d.Pct)
			edges = append(edges, d)
		}
		result["edge_kinds"] = edges
	}

	// Complexity distribution
	compRows, err := h.db.Query("SELECT bucket, function_count FROM dashboard_complexity_distribution ORDER BY bucket_min")
	if err == nil {
		defer compRows.Close()
		var comp []model.Distribution
		for compRows.Next() {
			var d model.Distribution
			compRows.Scan(&d.Label, &d.Count)
			comp = append(comp, d)
		}
		result["complexity"] = comp
	}

	writeJSON(w, result)
}

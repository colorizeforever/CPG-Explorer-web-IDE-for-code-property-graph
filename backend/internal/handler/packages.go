package handler

import (
	"database/sql"
	"net/http"

	"cpg-explorer/internal/model"
)

// ListPackages returns all packages with their metrics from the treemap table.
func (h *Handler) ListPackages(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 200)
	offset := queryInt(r, "offset", 0)
	sort := r.URL.Query().Get("sort")
	if sort == "" {
		sort = "total_complexity"
	}

	// Validate sort column against an allowlist to prevent injection.
	allowed := map[string]bool{
		"package": true, "function_count": true, "total_loc": true,
		"total_complexity": true, "avg_complexity": true, "max_complexity": true,
		"file_count": true, "type_count": true, "interface_count": true,
	}
	if !allowed[sort] {
		sort = "total_complexity"
	}

	query := `SELECT package, file_count, function_count, total_loc,
	          total_complexity, avg_complexity, max_complexity,
	          type_count, interface_count
	          FROM dashboard_package_treemap
	          ORDER BY ` + sort + ` DESC LIMIT ? OFFSET ?`

	rows, err := h.db.Query(query, limit, offset)
	if err != nil {
		writeError(w, "failed to query packages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pkgs []model.Package
	for rows.Next() {
		var p model.Package
		if err := rows.Scan(&p.Name, &p.FileCount, &p.FunctionCount, &p.TotalLOC,
			&p.TotalComplexity, &p.AvgComplexity, &p.MaxComplexity,
			&p.TypeCount, &p.InterfaceCount); err != nil {
			continue
		}
		pkgs = append(pkgs, p)
	}

	writeJSON(w, pkgs)
}

// PackageGraph returns the package dependency graph for force-directed visualization.
func (h *Handler) PackageGraph(w http.ResponseWriter, r *http.Request) {
	// Edges from pre-computed table
	edgeRows, err := h.db.Query("SELECT source, target, weight FROM dashboard_package_graph ORDER BY weight DESC")
	if err != nil {
		writeError(w, "failed to query package graph", http.StatusInternalServerError)
		return
	}
	defer edgeRows.Close()

	nodeSet := make(map[string]bool)
	var edges []model.PackageGraphEdge
	for edgeRows.Next() {
		var e model.PackageGraphEdge
		if err := edgeRows.Scan(&e.Source, &e.Target, &e.Weight); err != nil {
			continue
		}
		edges = append(edges, e)
		nodeSet[e.Source] = true
		nodeSet[e.Target] = true
	}

	// Enrich nodes with metrics from treemap
	var nodes []model.PackageGraphNode
	for pkg := range nodeSet {
		node := model.PackageGraphNode{ID: pkg, Label: pkg}

		row := h.db.QueryRow(
			`SELECT function_count, total_loc, total_complexity, avg_complexity
			 FROM dashboard_package_treemap WHERE package = ?`, pkg)
		var fc, loc, tc int
		var ac float64
		if err := row.Scan(&fc, &loc, &tc, &ac); err == nil {
			node.FunctionCount = fc
			node.TotalLOC = loc
			node.TotalComplexity = tc
			node.AvgComplexity = ac
		}

		nodes = append(nodes, node)
	}

	writeJSON(w, model.PackageGraph{Nodes: nodes, Edges: edges})
}

// PackageFunctions returns all functions in a specific package.
func (h *Handler) PackageFunctions(w http.ResponseWriter, r *http.Request) {
	pkg := r.PathValue("name")
	if pkg == "" {
		writeError(w, "package name is required", http.StatusBadRequest)
		return
	}

	limit := queryInt(r, "limit", 100)

	rows, err := h.db.Query(`
		SELECT n.id, n.name, n.package, COALESCE(n.file, ''), COALESCE(n.line, 0),
		       COALESCE(n.end_line, 0),
		       COALESCE(m.cyclomatic_complexity, 0),
		       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0),
		       COALESCE(m.loc, 0), COALESCE(m.num_params, 0)
		FROM nodes n
		LEFT JOIN metrics m ON m.function_id = n.id
		WHERE n.kind = 'function' AND n.package = ?
		ORDER BY COALESCE(m.cyclomatic_complexity, 0) DESC
		LIMIT ?`, pkg, limit)
	if err != nil {
		writeError(w, "failed to query functions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var funcs []model.Function
	for rows.Next() {
		var f model.Function
		var file sql.NullString
		rows.Scan(&f.ID, &f.Name, &f.Package, &file, &f.Line, &f.EndLine,
			&f.Complexity, &f.FanIn, &f.FanOut, &f.LOC, &f.NumParams)
		if file.Valid {
			f.File = file.String
		}
		funcs = append(funcs, f)
	}

	writeJSON(w, funcs)
}

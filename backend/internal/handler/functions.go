package handler

import (
	"database/sql"
	"net/http"

	"cpg-explorer/internal/model"
)

// SearchFunctions returns functions matching a search query with optional package filter.
func (h *Handler) SearchFunctions(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	pkg := r.URL.Query().Get("package")
	limit := queryInt(r, "limit", 50)
	offset := queryInt(r, "offset", 0)

	var (
		rows *sql.Rows
		err  error
	)

	switch {
	case search != "" && pkg != "":
		rows, err = h.db.Query(`
			SELECT n.id, n.name, n.package, COALESCE(n.file, ''),
			       COALESCE(n.line, 0), COALESCE(n.end_line, 0),
			       COALESCE(m.cyclomatic_complexity, 0),
			       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0),
			       COALESCE(m.loc, 0), COALESCE(m.num_params, 0)
			FROM nodes n
			LEFT JOIN metrics m ON m.function_id = n.id
			WHERE n.kind = 'function' AND n.name LIKE ? AND n.package = ?
			ORDER BY COALESCE(m.cyclomatic_complexity, 0) DESC
			LIMIT ? OFFSET ?`, "%"+search+"%", pkg, limit, offset)

	case search != "":
		rows, err = h.db.Query(`
			SELECT n.id, n.name, n.package, COALESCE(n.file, ''),
			       COALESCE(n.line, 0), COALESCE(n.end_line, 0),
			       COALESCE(m.cyclomatic_complexity, 0),
			       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0),
			       COALESCE(m.loc, 0), COALESCE(m.num_params, 0)
			FROM nodes n
			LEFT JOIN metrics m ON m.function_id = n.id
			WHERE n.kind = 'function' AND n.name LIKE ?
			ORDER BY COALESCE(m.cyclomatic_complexity, 0) DESC
			LIMIT ? OFFSET ?`, "%"+search+"%", limit, offset)

	case pkg != "":
		rows, err = h.db.Query(`
			SELECT n.id, n.name, n.package, COALESCE(n.file, ''),
			       COALESCE(n.line, 0), COALESCE(n.end_line, 0),
			       COALESCE(m.cyclomatic_complexity, 0),
			       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0),
			       COALESCE(m.loc, 0), COALESCE(m.num_params, 0)
			FROM nodes n
			LEFT JOIN metrics m ON m.function_id = n.id
			WHERE n.kind = 'function' AND n.package = ?
			ORDER BY COALESCE(m.cyclomatic_complexity, 0) DESC
			LIMIT ? OFFSET ?`, pkg, limit, offset)

	default:
		rows, err = h.db.Query(`
			SELECT n.id, n.name, n.package, COALESCE(n.file, ''),
			       COALESCE(n.line, 0), COALESCE(n.end_line, 0),
			       COALESCE(m.cyclomatic_complexity, 0),
			       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0),
			       COALESCE(m.loc, 0), COALESCE(m.num_params, 0)
			FROM nodes n
			LEFT JOIN metrics m ON m.function_id = n.id
			WHERE n.kind = 'function'
			ORDER BY COALESCE(m.cyclomatic_complexity, 0) DESC
			LIMIT ? OFFSET ?`, limit, offset)
	}

	if err != nil {
		writeError(w, "failed to search functions", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var funcs []model.Function
	for rows.Next() {
		var f model.Function
		rows.Scan(&f.ID, &f.Name, &f.Package, &f.File, &f.Line, &f.EndLine,
			&f.Complexity, &f.FanIn, &f.FanOut, &f.LOC, &f.NumParams)
		funcs = append(funcs, f)
	}

	if funcs == nil {
		funcs = []model.Function{}
	}

	writeJSON(w, funcs)
}

// FunctionDetail returns detailed information about a specific function.
func (h *Handler) FunctionDetail(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, "function id is required", http.StatusBadRequest)
		return
	}

	var f model.FunctionDetail
	var callers, callees sql.NullString

	err := h.db.QueryRow(`
		SELECT function_id, name, COALESCE(package, ''), COALESCE(file, ''),
		       COALESCE(line, 0), COALESCE(end_line, 0), COALESCE(signature, ''),
		       complexity, loc, fan_in, fan_out, num_params,
		       num_locals, num_calls, num_branches, num_returns,
		       finding_count, callers, callees
		FROM dashboard_function_detail
		WHERE function_id = ?`, id).Scan(
		&f.ID, &f.Name, &f.Package, &f.File,
		&f.Line, &f.EndLine, &f.Signature,
		&f.Complexity, &f.LOC, &f.FanIn, &f.FanOut, &f.NumParams,
		&f.NumLocals, &f.NumCalls, &f.NumBranches, &f.NumReturns,
		&f.FindingCount, &callers, &callees,
	)
	if err == sql.ErrNoRows {
		writeError(w, "function not found", http.StatusNotFound)
		return
	}
	if err != nil {
		writeError(w, "failed to query function detail", http.StatusInternalServerError)
		return
	}

	if callers.Valid {
		f.Callers = callers.String
	}
	if callees.Valid {
		f.Callees = callees.String
	}

	writeJSON(w, f)
}

package handler

import (
	"net/http"

	"cpg-explorer/internal/model"
)

// CallGraph performs a BFS over call edges from a given function,
// returning a subgraph suitable for interactive visualization.
func (h *Handler) CallGraph(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, "function id is required", http.StatusBadRequest)
		return
	}

	depth := queryInt(r, "depth", 2)
	if depth < 1 {
		depth = 1
	}
	if depth > 5 {
		depth = 5
	}

	direction := r.URL.Query().Get("direction")
	if direction == "" {
		direction = "both"
	}

	nodeMap := make(map[string]*model.CallGraphNode)
	var edges []model.CallGraphEdge

	// Seed with the root node.
	rootNode := h.fetchCallGraphNode(id, 0, true)
	if rootNode == nil {
		writeError(w, "function not found", http.StatusNotFound)
		return
	}
	nodeMap[id] = rootNode

	// BFS outward (callees).
	if direction == "callees" || direction == "both" {
		h.bfsCallees(id, depth, nodeMap, &edges)
	}

	// BFS inward (callers).
	if direction == "callers" || direction == "both" {
		h.bfsCallers(id, depth, nodeMap, &edges)
	}

	nodes := make([]model.CallGraphNode, 0, len(nodeMap))
	for _, n := range nodeMap {
		nodes = append(nodes, *n)
	}

	writeJSON(w, model.CallGraph{Nodes: nodes, Edges: edges})
}

// bfsCallees performs BFS from root following outgoing call edges.
func (h *Handler) bfsCallees(rootID string, maxDepth int, nodeMap map[string]*model.CallGraphNode, edges *[]model.CallGraphEdge) {
	frontier := []string{rootID}

	for d := 1; d <= maxDepth && len(frontier) > 0; d++ {
		var next []string
		for _, srcID := range frontier {
			rows, err := h.db.Query(`
				SELECT e.target, n.name, COALESCE(n.package, ''), COALESCE(n.file, ''),
				       COALESCE(n.line, 0),
				       COALESCE(m.cyclomatic_complexity, 0),
				       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0)
				FROM edges e
				JOIN nodes n ON n.id = e.target
				LEFT JOIN metrics m ON m.function_id = n.id
				WHERE e.source = ? AND e.kind = 'call' AND n.kind = 'function'
				LIMIT 30`, srcID)
			if err != nil {
				continue
			}

			for rows.Next() {
				var tgtID, name, pkg, file string
				var line, complexity, fanIn, fanOut int
				rows.Scan(&tgtID, &name, &pkg, &file, &line, &complexity, &fanIn, &fanOut)

				*edges = append(*edges, model.CallGraphEdge{
					Source: srcID,
					Target: tgtID,
					Kind:   "call",
				})

				if _, exists := nodeMap[tgtID]; !exists {
					nodeMap[tgtID] = &model.CallGraphNode{
						ID: tgtID, Label: name, Package: pkg,
						File: file, Line: line,
						Complexity: complexity, FanIn: fanIn, FanOut: fanOut,
						Depth: d,
					}
					next = append(next, tgtID)
				}
			}
			rows.Close()
		}
		frontier = next
	}
}

// bfsCallers performs BFS from root following incoming call edges.
func (h *Handler) bfsCallers(rootID string, maxDepth int, nodeMap map[string]*model.CallGraphNode, edges *[]model.CallGraphEdge) {
	frontier := []string{rootID}

	for d := 1; d <= maxDepth && len(frontier) > 0; d++ {
		var next []string
		for _, tgtID := range frontier {
			rows, err := h.db.Query(`
				SELECT e.source, n.name, COALESCE(n.package, ''), COALESCE(n.file, ''),
				       COALESCE(n.line, 0),
				       COALESCE(m.cyclomatic_complexity, 0),
				       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0)
				FROM edges e
				JOIN nodes n ON n.id = e.source
				LEFT JOIN metrics m ON m.function_id = n.id
				WHERE e.target = ? AND e.kind = 'call' AND n.kind = 'function'
				LIMIT 30`, tgtID)
			if err != nil {
				continue
			}

			for rows.Next() {
				var srcID, name, pkg, file string
				var line, complexity, fanIn, fanOut int
				rows.Scan(&srcID, &name, &pkg, &file, &line, &complexity, &fanIn, &fanOut)

				*edges = append(*edges, model.CallGraphEdge{
					Source: srcID,
					Target: tgtID,
					Kind:   "call",
				})

				if _, exists := nodeMap[srcID]; !exists {
					nodeMap[srcID] = &model.CallGraphNode{
						ID: srcID, Label: name, Package: pkg,
						File: file, Line: line,
						Complexity: complexity, FanIn: fanIn, FanOut: fanOut,
						Depth: d,
					}
					next = append(next, srcID)
				}
			}
			rows.Close()
		}
		frontier = next
	}
}

// fetchCallGraphNode loads a single node from the database.
func (h *Handler) fetchCallGraphNode(id string, depth int, isRoot bool) *model.CallGraphNode {
	var name, pkg, file string
	var line, complexity, fanIn, fanOut int

	err := h.db.QueryRow(`
		SELECT n.name, COALESCE(n.package, ''), COALESCE(n.file, ''),
		       COALESCE(n.line, 0),
		       COALESCE(m.cyclomatic_complexity, 0),
		       COALESCE(m.fan_in, 0), COALESCE(m.fan_out, 0)
		FROM nodes n
		LEFT JOIN metrics m ON m.function_id = n.id
		WHERE n.id = ?`, id).Scan(&name, &pkg, &file, &line, &complexity, &fanIn, &fanOut)
	if err != nil {
		return nil
	}

	return &model.CallGraphNode{
		ID: id, Label: name, Package: pkg,
		File: file, Line: line,
		Complexity: complexity, FanIn: fanIn, FanOut: fanOut,
		IsRoot: isRoot, Depth: depth,
	}
}

package handler

import (
	"net/http"

	"cpg-explorer/internal/model"
)

// DataFlow performs a BFS along dfg (data-flow graph) edges from a given node,
// returning a subgraph of definitions and uses for visualization.
func (h *Handler) DataFlow(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, "node id is required", http.StatusBadRequest)
		return
	}

	depth := queryInt(r, "depth", 3)
	if depth < 1 {
		depth = 1
	}
	if depth > 6 {
		depth = 6
	}

	direction := r.URL.Query().Get("direction")
	if direction == "" {
		direction = "forward"
	}

	nodeMap := make(map[string]*model.DataFlowNode)
	var edges []model.DataFlowEdge

	// Seed with root node.
	root := h.fetchDFGNode(id, 0)
	if root == nil {
		writeError(w, "node not found", http.StatusNotFound)
		return
	}
	nodeMap[id] = root

	switch direction {
	case "forward":
		h.bfsDFGForward(id, depth, nodeMap, &edges)
	case "backward":
		h.bfsDFGBackward(id, depth, nodeMap, &edges)
	case "both":
		h.bfsDFGForward(id, depth, nodeMap, &edges)
		h.bfsDFGBackward(id, depth, nodeMap, &edges)
	}

	nodes := make([]model.DataFlowNode, 0, len(nodeMap))
	for _, n := range nodeMap {
		nodes = append(nodes, *n)
	}

	writeJSON(w, model.DataFlowGraph{Nodes: nodes, Edges: edges})
}

func (h *Handler) bfsDFGForward(rootID string, maxDepth int, nodeMap map[string]*model.DataFlowNode, edges *[]model.DataFlowEdge) {
	frontier := []string{rootID}

	for d := 1; d <= maxDepth && len(frontier) > 0; d++ {
		var next []string
		for _, srcID := range frontier {
			rows, err := h.db.Query(`
				SELECT e.target, n.name, n.kind, COALESCE(n.file, ''), COALESCE(n.line, 0)
				FROM edges e
				JOIN nodes n ON n.id = e.target
				WHERE e.source = ? AND e.kind = 'dfg'
				LIMIT 25`, srcID)
			if err != nil {
				continue
			}

			for rows.Next() {
				var tgtID, name, kind, file string
				var line int
				rows.Scan(&tgtID, &name, &kind, &file, &line)

				*edges = append(*edges, model.DataFlowEdge{Source: srcID, Target: tgtID})

				if _, exists := nodeMap[tgtID]; !exists {
					nodeMap[tgtID] = &model.DataFlowNode{
						ID: tgtID, Label: name, Kind: kind,
						File: file, Line: line, Depth: d,
					}
					next = append(next, tgtID)
				}
			}
			rows.Close()
		}
		frontier = next
	}
}

func (h *Handler) bfsDFGBackward(rootID string, maxDepth int, nodeMap map[string]*model.DataFlowNode, edges *[]model.DataFlowEdge) {
	frontier := []string{rootID}

	for d := 1; d <= maxDepth && len(frontier) > 0; d++ {
		var next []string
		for _, tgtID := range frontier {
			rows, err := h.db.Query(`
				SELECT e.source, n.name, n.kind, COALESCE(n.file, ''), COALESCE(n.line, 0)
				FROM edges e
				JOIN nodes n ON n.id = e.source
				WHERE e.target = ? AND e.kind = 'dfg'
				LIMIT 25`, tgtID)
			if err != nil {
				continue
			}

			for rows.Next() {
				var srcID, name, kind, file string
				var line int
				rows.Scan(&srcID, &name, &kind, &file, &line)

				*edges = append(*edges, model.DataFlowEdge{Source: srcID, Target: tgtID})

				if _, exists := nodeMap[srcID]; !exists {
					nodeMap[srcID] = &model.DataFlowNode{
						ID: srcID, Label: name, Kind: kind,
						File: file, Line: line, Depth: d,
					}
					next = append(next, srcID)
				}
			}
			rows.Close()
		}
		frontier = next
	}
}

func (h *Handler) fetchDFGNode(id string, depth int) *model.DataFlowNode {
	var name, kind, file string
	var line int

	err := h.db.QueryRow(`
		SELECT name, kind, COALESCE(file, ''), COALESCE(line, 0)
		FROM nodes WHERE id = ?`, id).Scan(&name, &kind, &file, &line)
	if err != nil {
		return nil
	}

	return &model.DataFlowNode{
		ID: id, Label: name, Kind: kind,
		File: file, Line: line, Depth: depth,
	}
}

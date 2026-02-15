// Package model defines the domain types shared across the application.
package model

// Overview holds high-level statistics about the CPG database.
type Overview struct {
	TotalPackages   string `json:"total_packages"`
	TotalFiles      string `json:"total_files"`
	TotalFunctions  string `json:"total_functions"`
	TotalTypes      string `json:"total_types"`
	TotalNodes      string `json:"total_nodes"`
	TotalEdges      string `json:"total_edges"`
	TotalLOC        string `json:"total_loc"`
	AvgComplexity   string `json:"avg_complexity"`
	MaxComplexity   string `json:"max_complexity"`
	TotalCallEdges  string `json:"total_call_edges"`
	TotalDFGEdges   string `json:"total_dfg_edges"`
	TotalCFGEdges   string `json:"total_cfg_edges"`
	TotalGoroutines string `json:"total_goroutine_launches"`
	TotalDefers     string `json:"total_defers"`
	TotalFindings   string `json:"total_findings"`
	TotalInterfaces string `json:"total_interfaces"`
}

// Package represents a Go package with its metrics.
type Package struct {
	Name            string  `json:"name"`
	FileCount       int     `json:"file_count"`
	FunctionCount   int     `json:"function_count"`
	TotalLOC        int     `json:"total_loc"`
	TotalComplexity int     `json:"total_complexity"`
	AvgComplexity   float64 `json:"avg_complexity"`
	MaxComplexity   int     `json:"max_complexity"`
	TypeCount       int     `json:"type_count"`
	InterfaceCount  int     `json:"interface_count"`
}

// PackageGraphEdge is an edge in the package dependency graph.
type PackageGraphEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Weight int    `json:"weight"`
}

// PackageGraph holds the full package dependency graph.
type PackageGraph struct {
	Nodes []PackageGraphNode `json:"nodes"`
	Edges []PackageGraphEdge `json:"edges"`
}

// PackageGraphNode is a node in the package dependency graph.
type PackageGraphNode struct {
	ID              string  `json:"id"`
	Label           string  `json:"label"`
	FunctionCount   int     `json:"function_count"`
	TotalLOC        int     `json:"total_loc"`
	TotalComplexity int     `json:"total_complexity"`
	AvgComplexity   float64 `json:"avg_complexity"`
}

// Function represents a function in the CPG.
type Function struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Package    string `json:"package"`
	File       string `json:"file"`
	Line       int    `json:"line"`
	EndLine    int    `json:"end_line"`
	Complexity int    `json:"complexity"`
	FanIn      int    `json:"fan_in"`
	FanOut     int    `json:"fan_out"`
	LOC        int    `json:"loc"`
	NumParams  int    `json:"num_params"`
}

// FunctionDetail holds detailed information about a function.
type FunctionDetail struct {
	Function
	Signature    string `json:"signature"`
	NumLocals    int    `json:"num_locals"`
	NumCalls     int    `json:"num_calls"`
	NumBranches  int    `json:"num_branches"`
	NumReturns   int    `json:"num_returns"`
	FindingCount int    `json:"finding_count"`
	Callers      string `json:"callers"`
	Callees      string `json:"callees"`
}

// CallGraphNode represents a node in the call graph visualization.
type CallGraphNode struct {
	ID         string `json:"id"`
	Label      string `json:"label"`
	Package    string `json:"package"`
	File       string `json:"file"`
	Line       int    `json:"line"`
	Complexity int    `json:"complexity"`
	FanIn      int    `json:"fan_in"`
	FanOut     int    `json:"fan_out"`
	IsRoot     bool   `json:"is_root"`
	Depth      int    `json:"depth"`
}

// CallGraphEdge represents an edge in the call graph visualization.
type CallGraphEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Kind   string `json:"kind"`
}

// CallGraph holds the full call graph for rendering.
type CallGraph struct {
	Nodes []CallGraphNode `json:"nodes"`
	Edges []CallGraphEdge `json:"edges"`
}

// DataFlowNode represents a node in data flow analysis.
type DataFlowNode struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Kind  string `json:"kind"`
	File  string `json:"file"`
	Line  int    `json:"line"`
	Depth int    `json:"depth"`
}

// DataFlowEdge represents an edge in data flow analysis.
type DataFlowEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

// DataFlowGraph holds the data flow graph for visualization.
type DataFlowGraph struct {
	Nodes []DataFlowNode `json:"nodes"`
	Edges []DataFlowEdge `json:"edges"`
}

// SourceFile holds the contents and metadata of a source file.
type SourceFile struct {
	File    string `json:"file"`
	Content string `json:"content"`
	Package string `json:"package"`
}

// SchemaDoc describes a database entity for documentation.
type SchemaDoc struct {
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Example     string `json:"example,omitempty"`
}

// Hotspot represents a high-risk function.
type Hotspot struct {
	FunctionID   string  `json:"function_id"`
	Name         string  `json:"name"`
	Package      string  `json:"package"`
	File         string  `json:"file"`
	Complexity   int     `json:"complexity"`
	LOC          int     `json:"loc"`
	FanIn        int     `json:"fan_in"`
	FanOut       int     `json:"fan_out"`
	FindingCount int     `json:"finding_count"`
	HotspotScore float64 `json:"hotspot_score"`
}

// Distribution holds chart data.
type Distribution struct {
	Label string  `json:"label"`
	Count int     `json:"count"`
	Pct   float64 `json:"percentage,omitempty"`
}

// SearchResult holds a function search result.
type SearchResult struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Kind    string `json:"kind"`
	Package string `json:"package"`
	File    string `json:"file"`
	Line    int    `json:"line"`
}

// FileOutline holds a single outline entry for a file.
type FileOutline struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Kind    string `json:"kind"`
	Line    int    `json:"line"`
	EndLine int    `json:"end_line"`
}

// Query holds a built-in query definition.
type Query struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	SQL         string `json:"sql"`
}

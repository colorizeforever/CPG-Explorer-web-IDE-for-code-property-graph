/* Domain types matching the Go backend API responses. */

export interface Overview {
  total_packages: string;
  total_files: string;
  total_functions: string;
  total_types: string;
  total_nodes: string;
  total_edges: string;
  total_loc: string;
  avg_complexity: string;
  max_complexity: string;
  total_call_edges: string;
  total_dfg_edges: string;
  total_cfg_edges: string;
  total_goroutine_launches: string;
  total_defers: string;
  total_findings: string;
  total_interfaces: string;
}

export interface Package {
  name: string;
  file_count: number;
  function_count: number;
  total_loc: number;
  total_complexity: number;
  avg_complexity: number;
  max_complexity: number;
  type_count: number;
  interface_count: number;
}

export interface PackageGraphNode {
  id: string;
  label: string;
  function_count: number;
  total_loc: number;
  total_complexity: number;
  avg_complexity: number;
}

export interface PackageGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface PackageGraph {
  nodes: PackageGraphNode[];
  edges: PackageGraphEdge[];
}

export interface FunctionItem {
  id: string;
  name: string;
  package: string;
  file: string;
  line: number;
  end_line: number;
  complexity: number;
  fan_in: number;
  fan_out: number;
  loc: number;
  num_params: number;
}

export interface FunctionDetail extends FunctionItem {
  signature: string;
  num_locals: number;
  num_calls: number;
  num_branches: number;
  num_returns: number;
  finding_count: number;
  callers: string;
  callees: string;
}

export interface CallGraphNode {
  id: string;
  label: string;
  package: string;
  file: string;
  line: number;
  complexity: number;
  fan_in: number;
  fan_out: number;
  is_root: boolean;
  depth: number;
}

export interface CallGraphEdge {
  source: string;
  target: string;
  kind: string;
}

export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

export interface DataFlowNode {
  id: string;
  label: string;
  kind: string;
  file: string;
  line: number;
  depth: number;
}

export interface DataFlowEdge {
  source: string;
  target: string;
}

export interface DataFlowGraph {
  nodes: DataFlowNode[];
  edges: DataFlowEdge[];
}

export interface SourceFile {
  file: string;
  content: string;
  package: string;
}

export interface Distribution {
  label: string;
  count: number;
  percentage?: number;
}

export interface Distributions {
  node_kinds: Distribution[];
  edge_kinds: Distribution[];
  complexity: Distribution[];
}

export interface Hotspot {
  function_id: string;
  name: string;
  package: string;
  file: string;
  complexity: number;
  loc: number;
  fan_in: number;
  fan_out: number;
  finding_count: number;
  hotspot_score: number;
}

export interface SearchResult {
  id: string;
  name: string;
  kind: string;
  package: string;
  file: string;
  line: number;
}

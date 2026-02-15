import { useState, useCallback } from "react";
import { api } from "../../api/client";
import { useLazyApi } from "../../hooks/useApi";
import SearchBar from "../../shared/components/SearchBar";
import GraphView, { type LayoutName, type GraphNode, type GraphEdge } from "../../shared/components/GraphView";
import type { SearchResult } from "../../types";
import InfoRow from "./components/InfoRow";

const KIND_COLORS: Record<string, string> = {
  parameter: "#d29922",
  return: "#f778ba",
  local: "#8b949e",
  call: "#58a6ff",
  function: "#58a6ff",
  field: "#bc8cff",
};

const DataFlow = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [depth, setDepth] = useState(3);
  const [direction, setDirection] = useState<"forward" | "backward" | "both">("forward");
  const [layout, setLayout] = useState<LayoutName>("dagre");

  const {
    data: graph,
    loading,
    error,
    execute: fetchFlow,
  } = useLazyApi(
    useCallback(
      (id: string, d: number, dir: string) => api.dataFlow(id, d, dir),
      [],
    ),
  );

  const handleSelect = (result: SearchResult) => {
    setSelectedNode(result.id);
    fetchFlow(result.id, depth, direction);
  };

  const handleNodeClick = (id: string) => setSelectedNode(id);

  const handleNodeDoubleClick = (id: string) => {
    setSelectedNode(id);
    fetchFlow(id, depth, direction);
  };

  const handleRefresh = () => {
    if (selectedNode) fetchFlow(selectedNode, depth, direction);
  };

  const graphNodes: GraphNode[] =
    graph?.nodes.map((n) => ({
      id: n.id,
      label: `${n.label} (${n.kind})`,
      group: n.kind,
      color: KIND_COLORS[n.kind] || "#8b949e",
      size: n.depth === 0 ? 40 : 25,
      isRoot: n.depth === 0,
    })) ?? [];

  const graphEdges: GraphEdge[] =
    graph?.edges.map((e) => ({ source: e.source, target: e.target })) ?? [];

  const selectedInfo = graph?.nodes.find((n) => n.id === selectedNode);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-surface-600 bg-surface-800 flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search variable or node..."
            onSelect={handleSelect}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Depth</label>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-surface-700 border border-surface-500 rounded px-2 py-1.5 text-xs text-gray-300"
            >
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as typeof direction)}
              className="bg-surface-700 border border-surface-500 rounded px-2 py-1.5 text-xs text-gray-300"
            >
              <option value="forward">Forward (uses)</option>
              <option value="backward">Backward (defs)</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Layout</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutName)}
              className="bg-surface-700 border border-surface-500 rounded px-2 py-1.5 text-xs text-gray-300"
            >
              <option value="dagre">Hierarchical</option>
              <option value="fcose">Force-Directed</option>
            </select>
          </div>
          {selectedNode && (
            <button
              onClick={handleRefresh}
              className="text-xs px-3 py-1.5 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green rounded transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-surface-500 border-t-accent-green rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Tracing data flow...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}
          {!selectedNode && !loading && !graph && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-gray-500">Data Flow Slicer</p>
                <p className="text-sm text-gray-600 mt-2">
                  Search for a variable, parameter, or function to trace data flow
                </p>
              </div>
            </div>
          )}
          {graph && graphNodes.length > 0 && (
            <GraphView
              nodes={graphNodes}
              edges={graphEdges}
              layout={layout}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              className="h-full"
            />
          )}
          {graph && graphNodes.length > 0 && (
            <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-surface-800/90 px-2 py-1 rounded">
              {graphNodes.length} nodes, {graphEdges.length} edges
            </div>
          )}
          {graph && graphNodes.length > 0 && (
            <div className="absolute top-3 right-3 bg-surface-800/90 border border-surface-600 rounded p-2 space-y-1">
              {Object.entries(KIND_COLORS).map(([kind, color]) => (
                <div key={kind} className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {kind}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedInfo && (
        <aside className="w-72 flex-shrink-0 border-l border-surface-600 bg-surface-800 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">
            Selected Node
          </h3>
          <div className="space-y-2 text-sm">
            <InfoRow label="Name" value={selectedInfo.label} />
            <InfoRow label="Kind" value={selectedInfo.kind} />
            <InfoRow label="File" value={selectedInfo.file} />
            <InfoRow label="Line" value={String(selectedInfo.line)} />
            <InfoRow label="Depth" value={String(selectedInfo.depth)} />
          </div>
        </aside>
      )}
    </div>
  );
};

export default DataFlow;

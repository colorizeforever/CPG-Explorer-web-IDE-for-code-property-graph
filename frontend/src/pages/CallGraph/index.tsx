import { useState, useCallback } from "react";
import { api } from "../../api/client";
import { useLazyApi } from "../../hooks/useApi";
import SearchBar from "../../shared/components/SearchBar";
import GraphView, { type LayoutName, type GraphNode, type GraphEdge } from "../../shared/components/GraphView";
import FunctionDetail from "../../shared/components/FunctionDetail";
import type { SearchResult } from "../../types";

const CallGraph = () => {
  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [direction, setDirection] = useState<"both" | "callers" | "callees">("both");
  const [layout, setLayout] = useState<LayoutName>("dagre");

  const {
    data: graph,
    loading,
    error,
    execute: fetchGraph,
  } = useLazyApi(
    useCallback(
      (id: string, d: number, dir: string) => api.callGraph(id, d, dir),
      [],
    ),
  );

  const handleSelect = (result: SearchResult) => {
    setRootId(result.id);
    setSelectedNode(null);
    fetchGraph(result.id, depth, direction);
  };

  const handleExplore = (id: string) => {
    setRootId(id);
    setSelectedNode(null);
    fetchGraph(id, depth, direction);
  };

  const handleRefresh = () => {
    if (rootId) fetchGraph(rootId, depth, direction);
  };

  const graphNodes: GraphNode[] =
    graph?.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      group: n.is_root ? "root" : "function",
      size: 20 + Math.min(40, (n.complexity || 1) * 3),
      isRoot: n.is_root,
    })) ?? [];

  const graphEdges: GraphEdge[] =
    graph?.edges.map((e) => ({ source: e.source, target: e.target })) ?? [];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-surface-600 bg-surface-800 flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search function to explore..."
            onSelect={handleSelect}
            kindFilter="function"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Depth</label>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-surface-700 border border-surface-500 rounded px-2 py-1.5 text-xs text-gray-300"
            >
              {[1, 2, 3, 4, 5].map((d) => (
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
              <option value="both">Both</option>
              <option value="callees">Callees</option>
              <option value="callers">Callers</option>
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
              <option value="circle">Circle</option>
            </select>
          </div>
          {rootId && (
            <button
              onClick={handleRefresh}
              className="text-xs px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-surface-500 border-t-accent-blue rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading call graph...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}
          {!rootId && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-gray-500">Call Graph Explorer</p>
                <p className="text-sm text-gray-600 mt-2">
                  Search for a function above to visualize its call relationships
                </p>
              </div>
            </div>
          )}
          {graph && graphNodes.length > 0 && (
            <GraphView
              nodes={graphNodes}
              edges={graphEdges}
              layout={layout}
              onNodeClick={setSelectedNode}
              onNodeDoubleClick={handleExplore}
              className="h-full"
            />
          )}
          {graph && graphNodes.length > 0 && (
            <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-surface-800/90 px-2 py-1 rounded">
              {graphNodes.length} nodes, {graphEdges.length} edges — double-click a node to re-center
            </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <aside className="w-80 flex-shrink-0 border-l border-surface-600 bg-surface-800 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <FunctionDetail functionId={selectedNode} onExploreCallGraph={handleExplore} />
        </aside>
      )}
    </div>
  );
};

export default CallGraph;

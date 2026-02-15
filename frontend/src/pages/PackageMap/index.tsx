import { useState, useCallback } from "react";
import { api } from "../../api/client";
import { useApi, useLazyApi } from "../../hooks/useApi";
import GraphView, { type LayoutName, type GraphNode, type GraphEdge } from "../../shared/components/GraphView";
import type { PackageGraph } from "../../types";
import Metric from "./components/Metric";
import FunctionRow from "./components/FunctionRow";

const PackageMap = () => {
  const [layout, setLayout] = useState<LayoutName>("fcose");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  const { data: graph, loading, error } = useApi<PackageGraph>(api.packageGraph);

  const {
    data: funcs,
    loading: funcsLoading,
    execute: fetchFunctions,
  } = useLazyApi(
    useCallback((name: string) => api.packageFunctions(name, 50), []),
  );

  const handleNodeClick = (id: string) => {
    setSelectedPkg(id);
    fetchFunctions(id);
  };

  const graphNodes: GraphNode[] =
    graph?.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      group: "package",
      size: 20 + Math.min(50, Math.sqrt(n.total_complexity || 1) * 3),
    })) ?? [];

  const graphEdges: GraphEdge[] =
    graph?.edges.map((e) => ({ source: e.source, target: e.target })) ?? [];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-surface-600 bg-surface-800 flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-300">Package Architecture</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Layout</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutName)}
              className="bg-surface-700 border border-surface-500 rounded px-2 py-1.5 text-xs text-gray-300"
            >
              <option value="fcose">Force-Directed</option>
              <option value="dagre">Hierarchical</option>
              <option value="circle">Circle</option>
            </select>
          </div>
          {graph && (
            <span className="text-xs text-gray-500">
              {graphNodes.length} packages, {graphEdges.length} dependencies
            </span>
          )}
        </div>

        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-900/80 z-10">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-surface-500 border-t-accent-green rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading package graph...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}
          {graph && graphNodes.length > 0 && (
            <GraphView
              nodes={graphNodes}
              edges={graphEdges}
              layout={layout}
              onNodeClick={handleNodeClick}
              className="h-full"
            />
          )}
        </div>
      </div>

      {selectedPkg && (
        <aside className="w-80 flex-shrink-0 border-l border-surface-600 bg-surface-800 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase truncate" title={selectedPkg}>
              {selectedPkg}
            </h3>
            <button
              onClick={() => setSelectedPkg(null)}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none"
            >
              &times;
            </button>
          </div>

          {graph && (() => {
            const node = graph.nodes.find((n) => n.id === selectedPkg);
            if (!node) return null;
            return (
              <div className="grid grid-cols-2 gap-2 p-4 border-b border-surface-600">
                <Metric label="Functions" value={node.function_count} />
                <Metric label="LOC" value={node.total_loc} />
                <Metric label="Complexity" value={node.total_complexity} />
                <Metric label="Avg Complex." value={Number(node.avg_complexity.toFixed(1))} />
              </div>
            );
          })()}

          <div className="p-4">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Functions</h4>
            {funcsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-surface-600 rounded animate-pulse" />
                ))}
              </div>
            ) : funcs && funcs.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {funcs.map((f) => (
                  <FunctionRow key={f.id} func={f} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No functions found</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default PackageMap;

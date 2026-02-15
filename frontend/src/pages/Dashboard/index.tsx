import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import type { Overview, Distributions, Hotspot } from "../../types";
import StatCard from "./components/StatCard";
import LoadingGrid from "./components/LoadingGrid";

const fmt = (v: string | undefined): string => {
  if (!v) return "-";
  const n = Number(v);
  return isNaN(n) ? v : n.toLocaleString();
};

const Dashboard = () => {
  const { data: overview, loading: ovLoading } = useApi<Overview>(api.overview);
  const { data: dist, loading: distLoading } = useApi<Distributions>(api.distributions);
  const { data: hotspots, loading: hsLoading } = useApi<Hotspot[]>(() => api.hotspots(15));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          High-level overview of the Code Property Graph
        </p>
      </div>

      {ovLoading ? (
        <LoadingGrid />
      ) : overview ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Packages" value={fmt(overview.total_packages)} color="blue" />
          <StatCard label="Files" value={fmt(overview.total_files)} color="green" />
          <StatCard label="Functions" value={fmt(overview.total_functions)} color="purple" />
          <StatCard label="Types" value={fmt(overview.total_types)} color="orange" />
          <StatCard label="Nodes" value={fmt(overview.total_nodes)} color="blue" />
          <StatCard label="Edges" value={fmt(overview.total_edges)} color="green" />
          <StatCard label="Lines of Code" value={fmt(overview.total_loc)} color="purple" />
          <StatCard label="Avg Complexity" value={overview.avg_complexity} color="orange" />
          <StatCard label="Call Edges" value={fmt(overview.total_call_edges)} color="blue" />
          <StatCard label="DFG Edges" value={fmt(overview.total_dfg_edges)} color="green" />
          <StatCard label="CFG Edges" value={fmt(overview.total_cfg_edges)} color="purple" />
          <StatCard label="Findings" value={fmt(overview.total_findings)} color="red" />
          <StatCard label="Goroutines" value={fmt(overview.total_goroutine_launches)} color="blue" />
          <StatCard label="Defers" value={fmt(overview.total_defers)} color="green" />
          <StatCard label="Interfaces" value={fmt(overview.total_interfaces)} color="purple" />
          <StatCard label="Max Complexity" value={overview.max_complexity} color="red" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!distLoading && dist?.complexity && (
          <div className="bg-surface-800 rounded-lg border border-surface-600 p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Complexity Distribution
            </h3>
            <div className="space-y-2">
              {dist.complexity.map((d) => {
                const maxCount = Math.max(...dist.complexity.map((x) => x.count));
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-28 text-right flex-shrink-0 truncate">
                      {d.label}
                    </span>
                    <div className="flex-1 h-5 bg-surface-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-accent-blue rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {d.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!distLoading && dist?.edge_kinds && (
          <div className="bg-surface-800 rounded-lg border border-surface-600 p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Edge Types</h3>
            <div className="space-y-2">
              {dist.edge_kinds.slice(0, 10).map((d) => {
                const maxCount = Math.max(
                  ...dist.edge_kinds.slice(0, 10).map((x) => x.count),
                );
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-28 text-right flex-shrink-0 truncate">
                      {d.label}
                    </span>
                    <div className="flex-1 h-5 bg-surface-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-accent-green rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right">
                      {d.count.toLocaleString()} ({d.percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!hsLoading && hotspots && hotspots.length > 0 && (
        <div className="bg-surface-800 rounded-lg border border-surface-600 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Hotspots — High-Risk Functions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-surface-600">
                  <th className="text-left py-2 px-2">Function</th>
                  <th className="text-left py-2 px-2">Package</th>
                  <th className="text-right py-2 px-2">Complexity</th>
                  <th className="text-right py-2 px-2">LOC</th>
                  <th className="text-right py-2 px-2">Fan-In</th>
                  <th className="text-right py-2 px-2">Fan-Out</th>
                  <th className="text-right py-2 px-2">Findings</th>
                  <th className="text-right py-2 px-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((h) => (
                  <tr
                    key={h.function_id}
                    className="border-b border-surface-700 hover:bg-surface-700 transition-colors"
                  >
                    <td className="py-2 px-2 text-accent-blue truncate max-w-xs">{h.name}</td>
                    <td className="py-2 px-2 text-gray-400 truncate max-w-xs">{h.package}</td>
                    <td className="py-2 px-2 text-right text-accent-orange">{h.complexity}</td>
                    <td className="py-2 px-2 text-right">{h.loc}</td>
                    <td className="py-2 px-2 text-right">{h.fan_in}</td>
                    <td className="py-2 px-2 text-right">{h.fan_out}</td>
                    <td className="py-2 px-2 text-right text-accent-red">{h.finding_count}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      {h.hotspot_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

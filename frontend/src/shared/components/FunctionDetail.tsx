import { api } from "../../api/client";
import { useApi } from "../../hooks/useApi";
import type { FunctionDetail as FunctionDetailType } from "../../types";

interface Props {
  functionId: string;
  onViewSource?: (file: string, line: number) => void;
  onExploreCallGraph?: (id: string) => void;
}

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-surface-700 rounded p-2">
    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
    <p className="text-sm font-semibold text-gray-200">{value}</p>
  </div>
);

const FunctionDetail = ({
  functionId,
  onViewSource,
  onExploreCallGraph,
}: Props) => {
  const { data, loading, error } = useApi<FunctionDetailType>(
    () => api.functionDetail(functionId),
    [functionId],
  );

  if (loading) {
    return (
      <div className="p-4 animate-pulse space-y-3">
        <div className="h-4 bg-surface-600 rounded w-48" />
        <div className="h-3 bg-surface-600 rounded w-32" />
        <div className="h-3 bg-surface-600 rounded w-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {error || "No details available"}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-100 break-all">{data.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {data.package} &mdash; {data.file}:{data.line}
        </p>
        {data.signature && (
          <p className="text-xs text-gray-400 mt-1 font-mono break-all">{data.signature}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Complexity" value={data.complexity} />
        <Metric label="LOC" value={data.loc} />
        <Metric label="Params" value={data.num_params} />
        <Metric label="Fan-In" value={data.fan_in} />
        <Metric label="Fan-Out" value={data.fan_out} />
        <Metric label="Branches" value={data.num_branches} />
        <Metric label="Calls" value={data.num_calls} />
        <Metric label="Returns" value={data.num_returns} />
        <Metric label="Locals" value={data.num_locals} />
      </div>

      {data.finding_count > 0 && (
        <div className="text-xs px-2 py-1 bg-red-900/30 text-accent-red rounded border border-red-800/30">
          {data.finding_count} finding{data.finding_count > 1 ? "s" : ""}
        </div>
      )}

      <div className="flex gap-2">
        {onViewSource && data.file && (
          <button
            onClick={() => onViewSource(data.file, data.line)}
            className="text-xs px-3 py-1.5 bg-surface-600 hover:bg-surface-500 text-gray-300 rounded transition-colors"
          >
            View Source
          </button>
        )}
        {onExploreCallGraph && (
          <button
            onClick={() => onExploreCallGraph(data.id)}
            className="text-xs px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded transition-colors"
          >
            Explore Calls
          </button>
        )}
      </div>

      {data.callers && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">Callers</p>
          <div className="flex flex-wrap gap-1">
            {data.callers.split(",").map((c) => (
              <span
                key={c}
                className="text-xs px-1.5 py-0.5 bg-surface-600 rounded text-gray-400 truncate max-w-[150px]"
              >
                {c.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.callees && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">Callees</p>
          <div className="flex flex-wrap gap-1">
            {data.callees.split(",").map((c) => (
              <span
                key={c}
                className="text-xs px-1.5 py-0.5 bg-surface-600 rounded text-gray-400 truncate max-w-[150px]"
              >
                {c.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionDetail;

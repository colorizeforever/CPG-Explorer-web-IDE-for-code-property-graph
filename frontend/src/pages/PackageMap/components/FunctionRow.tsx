import type { FunctionItem } from "../../../types";

const FunctionRow = ({ func: f }: { func: FunctionItem }) => (
  <div className="px-2 py-1.5 rounded hover:bg-surface-700 cursor-default transition-colors">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-300 truncate">{f.name}</span>
      {f.complexity > 0 && (
        <span
          className={`text-[10px] px-1 rounded ${
            f.complexity > 20
              ? "text-accent-red bg-red-900/20"
              : f.complexity > 10
                ? "text-accent-orange bg-orange-900/20"
                : "text-gray-500 bg-surface-600"
          }`}
        >
          C:{f.complexity}
        </span>
      )}
    </div>
    <p className="text-[10px] text-gray-500 truncate">{f.file}:{f.line}</p>
  </div>
);

export default FunctionRow;

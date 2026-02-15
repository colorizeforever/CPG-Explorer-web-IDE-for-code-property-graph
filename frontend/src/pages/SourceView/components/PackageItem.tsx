import { useState } from "react";
import { api } from "../../../api/client";
import type { Package } from "../../../types";

interface Props {
  pkg: Package;
  selectedFile: string;
  onFileSelect: (file: string) => void;
}

const PackageItem = ({ pkg, selectedFile, onFileSelect }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  const toggle = () => {
    setExpanded(!expanded);
    if (!expanded && files.length === 0) {
      api.packageFunctions(pkg.name, 100).then((funcs) => {
        const uniqueFiles = [...new Set(funcs.map((f) => f.file).filter(Boolean))];
        setFiles(uniqueFiles.sort());
      });
    }
  };

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-left text-xs hover:bg-surface-700 transition-colors"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>&#9656;</span>
        <span className="text-gray-300 truncate">{pkg.name}</span>
        <span className="text-gray-600 ml-auto text-[10px]">{pkg.file_count}f</span>
      </button>

      {expanded && files.length > 0 && (
        <div className="ml-6">
          {files.map((f) => (
            <button
              key={f}
              onClick={() => onFileSelect(f)}
              className={`w-full text-left px-3 py-1 text-xs truncate transition-colors ${
                selectedFile === f
                  ? "text-accent-blue bg-surface-600"
                  : "text-gray-400 hover:text-gray-300 hover:bg-surface-700"
              }`}
            >
              {f.split("/").pop()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageItem;

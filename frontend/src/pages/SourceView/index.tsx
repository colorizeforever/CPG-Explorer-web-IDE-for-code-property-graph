import { useState, useCallback, useEffect } from "react";
import { api } from "../../api/client";
import { useLazyApi, useApi } from "../../hooks/useApi";
import type { Package } from "../../types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import PackageItem from "./components/PackageItem";

const SourceView = () => {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const { data: packages } = useApi<Package[]>(() => api.packages(300, "package"));

  const {
    data: source,
    loading: srcLoading,
    error: srcError,
    execute: fetchSource,
  } = useLazyApi(useCallback((file: string) => api.source(file), []));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");
    const line = params.get("line");
    if (file) {
      setSelectedFile(file);
      fetchSource(file);
      if (line) setHighlightLine(Number(line));
    }
  }, [fetchSource]);

  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    setHighlightLine(null);
    fetchSource(file);
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 flex-shrink-0 border-r border-surface-600 bg-surface-800 overflow-y-auto">
        <div className="px-4 py-3 border-b border-surface-600">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">
            Packages ({packages?.length ?? 0})
          </h3>
        </div>
        <div className="py-1">
          {packages?.map((pkg) => (
            <PackageItem
              key={pkg.name}
              pkg={pkg}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile && (
          <div className="px-4 py-2 border-b border-surface-600 bg-surface-800 flex items-center gap-2">
            <span className="text-xs text-gray-500">File:</span>
            <span className="text-sm text-accent-blue font-mono">{selectedFile}</span>
            {source?.package && (
              <span className="text-xs text-gray-500 ml-auto">pkg: {source.package}</span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {srcLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-surface-500 border-t-accent-blue rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading source...</span>
              </div>
            </div>
          )}
          {srcError && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-accent-red">{srcError}</p>
            </div>
          )}
          {!selectedFile && !srcLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg text-gray-500">Source Browser</p>
                <p className="text-sm text-gray-600 mt-2">
                  Select a package and file from the sidebar to view source code
                </p>
              </div>
            </div>
          )}
          {source && (
            <SyntaxHighlighter
              language="go"
              style={vscDarkPlus}
              showLineNumbers
              wrapLines
              lineProps={(lineNumber: number) => ({
                style: {
                  backgroundColor:
                    lineNumber === highlightLine ? "rgba(88, 166, 255, 0.15)" : undefined,
                },
                id: `line-${lineNumber}`,
              })}
              customStyle={{
                margin: 0,
                background: "#0d1117",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              {source.content}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceView;

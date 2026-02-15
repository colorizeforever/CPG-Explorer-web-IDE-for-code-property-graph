import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../api/client";
import type { SearchResult } from "../../types";

interface Props {
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  kindFilter?: string;
}

const SearchBar = ({
  placeholder = "Search functions...",
  onSelect,
  kindFilter,
}: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(
    (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      api
        .globalSearch(q, 20)
        .then((res) => {
          const filtered = kindFilter ? res.filter((r) => r.kind === kindFilter) : res;
          setResults(filtered);
          setOpen(filtered.length > 0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [kindFilter],
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && selected >= 0 && results[selected]) {
      onSelect(results[selected]);
      setOpen(false);
      setQuery(results[selected].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(-1);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-surface-700 border border-surface-500 rounded-lg px-4 py-2.5 text-sm
                     text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue
                     focus:ring-1 focus:ring-accent-blue transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-surface-500 border-t-accent-blue rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-surface-800 border border-surface-600 rounded-lg shadow-xl max-h-72 overflow-auto">
          {results.map((r, i) => (
            <li
              key={r.id}
              className={`px-4 py-2.5 cursor-pointer text-sm border-b border-surface-700 last:border-0
                         ${i === selected ? "bg-surface-600" : "hover:bg-surface-700"}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => {
                onSelect(r);
                setOpen(false);
                setQuery(r.name);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-200 truncate">{r.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface-600 text-gray-400 flex-shrink-0">
                  {r.kind}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {r.package}
                {r.file ? ` — ${r.file}:${r.line}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;

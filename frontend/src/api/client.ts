/**
 * API client for the CPG Explorer backend.
 * All functions return parsed JSON; errors are thrown as exceptions.
 */

const BASE = "/api";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  overview: () => get<import("../types").Overview>("/overview"),

  distributions: () => get<import("../types").Distributions>("/distributions"),

  packages: (limit = 200, sort = "total_complexity") =>
    get<import("../types").Package[]>("/packages", {
      limit: String(limit),
      sort,
    }),

  packageGraph: () => get<import("../types").PackageGraph>("/packages/graph"),

  packageFunctions: (name: string, limit = 100) =>
    get<import("../types").FunctionItem[]>(
      `/packages/${encodeURIComponent(name)}/functions`,
      { limit: String(limit) },
    ),

  searchFunctions: (search: string, pkg = "", limit = 50) =>
    get<import("../types").FunctionItem[]>("/functions", {
      search,
      package: pkg,
      limit: String(limit),
    }),

  functionDetail: (id: string) =>
    get<import("../types").FunctionDetail>("/functions/detail", { id }),

  callGraph: (id: string, depth = 2, direction = "both") =>
    get<import("../types").CallGraph>("/callgraph", {
      id,
      depth: String(depth),
      direction,
    }),

  dataFlow: (id: string, depth = 3, direction = "forward") =>
    get<import("../types").DataFlowGraph>("/dataflow", {
      id,
      depth: String(depth),
      direction,
    }),

  source: (file: string) =>
    get<import("../types").SourceFile>("/source", { file }),

  hotspots: (limit = 30) =>
    get<import("../types").Hotspot[]>("/hotspots", { limit: String(limit) }),

  globalSearch: (q: string, limit = 30) =>
    get<import("../types").SearchResult[]>("/search", {
      q,
      limit: String(limit),
    }),
};

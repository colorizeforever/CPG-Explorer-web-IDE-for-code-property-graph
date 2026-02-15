# Design Decisions & Trade-offs

## Architecture Overview

The application follows a classic three-tier architecture: **React SPA** → **Go REST API** → **SQLite CPG database**. Docker Compose orchestrates three services (generator, backend, frontend) so `docker compose up` is the only step needed.

## Technology Choices

### Backend: Go + `net/http` + `mattn/go-sqlite3`

- **Standard library HTTP server** (Go 1.22+ enhanced `ServeMux`) — no framework overhead, method-based routing with path parameters built-in. For a read-only API with ~15 endpoints, a framework like Chi or Gin would add unnecessary abstraction.
- **`mattn/go-sqlite3`** (CGO) over `modernc.org/sqlite` (pure Go) — the CPG database is ~900 MB. CGO-based SQLite is 2-3x faster for read-heavy workloads at this scale, and the Docker container handles CGO compilation cleanly.
- **Read-only mode** with aggressive SQLite pragmas (`mmap_size = 512MB`, `cache_size = 128MB`, `query_only = ON`) — the database is never modified at runtime, so we can optimize entirely for reads.
- **Connection pooling** (`MaxOpenConns = 8`) enables concurrent API requests without connection contention.

### Frontend: React 18 + TypeScript + Vite + Cytoscape.js + Tailwind CSS

- **Cytoscape.js** over D3, vis.js, or Sigma.js — Cytoscape is designed specifically for graph/network visualization. It has robust layout algorithms (dagre for hierarchical, fCoSE for force-directed), built-in interaction handling, and handles hundreds of nodes smoothly. D3 would require implementing all graph layout algorithms manually.
- **Dagre layout** for call graphs and data flow (top-down/left-right hierarchy suits caller→callee and def→use patterns). **fCoSE** for package maps (force-directed layout naturally reveals community structure).
- **react-syntax-highlighter** for code display instead of Monaco Editor or CodeMirror — significantly lighter (~200KB vs ~2MB), and we only need read-only viewing with syntax highlighting, not full editing capabilities.
- **Tailwind CSS** for a dark, IDE-inspired theme — utility classes keep styling co-located with components and produce a small, purged CSS bundle.
- **No state management library** — React's built-in `useState` + lightweight custom hooks (`useApi`, `useLazyApi`) suffice for the data-fetching patterns here. Adding Redux or Zustand would over-engineer the data flow.

### 4th Module: Alertmanager

Chose **Alertmanager** because it is a core part of the Prometheus ecosystem, has non-trivial internal architecture (routing trees, notification pipelines, silencing engine), and creates interesting cross-module call edges with both Prometheus and client_golang.

## Key Design Decisions

### Focused subgraphs over full-graph rendering

The README emphasizes 10-100 nodes per view. All graph endpoints use **BFS with configurable depth limits** (default 2, max 5) and per-level result caps (max 30 neighbors per node). This keeps visualizations readable and prevents rendering 555K nodes.

### Pre-computed dashboard data

The CPG generator creates pre-computed tables (`dashboard_overview`, `dashboard_package_graph`, `dashboard_hotspots`, etc.). The API reads these directly rather than computing aggregates at query time, ensuring sub-100ms response times even on the 900MB database.

### Graph interactivity as the primary UX

Three graph-centric views serve different code comprehension needs:
1. **Call Graph Explorer** — "who calls whom?" with BFS expansion and re-centering on double-click
2. **Package Architecture Map** — "how is the codebase structured?" with complexity-sized nodes and click-to-drill-down
3. **Data Flow Slicer** — "where does this data go?" with forward/backward tracing

Each view supports multiple layout algorithms, depth controls, and direction toggles so developers can explore from different angles.

### Backend handles all SQL

The frontend never sends raw SQL. Every query is a parameterized API call. This prevents SQL injection, keeps the frontend decoupled from the schema, and allows future query optimization without frontend changes.

## Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| CGO SQLite driver | 2-3x read performance | Requires C compiler in Docker build |
| BFS depth limit (max 5) | Keeps graphs readable | Can't see deeply transitive paths |
| Pre-computed dashboard tables | Instant dashboard load | Stale if DB were ever updated |
| No WebSocket/SSE | Simpler architecture | No real-time updates (not needed for read-only DB) |
| Single SQLite file | Zero-config deployment | No write concurrency (acceptable for read-only) |
| No code search (FTS) in UI | Simpler scope | Users can't full-text search source code in the browser |

## What I'd Add With More Time

1. **Full-text code search** using the existing FTS5 index in the database
2. **CFG visualization** — render control flow within a function, overlaid on source code
3. **Type hierarchy explorer** — visualize interface implementations and embedding chains
4. **Security taint analysis view** — trace data from taint sources to sinks
5. **Keyboard-driven navigation** — vim-style shortcuts for power users
6. **URL-based state** — shareable links to specific function call graphs
7. **Graph comparison** — diff call graphs between two functions

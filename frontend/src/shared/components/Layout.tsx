import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const GraphIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const FlowIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/callgraph", label: "Call Graph", icon: GraphIcon },
  { to: "/packages", label: "Packages", icon: PackageIcon },
  { to: "/dataflow", label: "Data Flow", icon: FlowIcon },
  { to: "/source", label: "Source", icon: CodeIcon },
];

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-full">
    <nav className="w-56 flex-shrink-0 bg-surface-800 border-r border-surface-600 flex flex-col">
      <div className="px-4 py-4 border-b border-surface-600">
        <h1 className="text-lg font-bold text-accent-blue tracking-tight">CPG Explorer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Code Property Graph IDE</p>
      </div>
      <div className="flex-1 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-surface-600 text-accent-blue border-r-2 border-accent-blue"
                  : "text-gray-400 hover:text-gray-200 hover:bg-surface-700"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-surface-600 text-xs text-gray-600">
        Prometheus CPG
      </div>
    </nav>
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
);

export default Layout;

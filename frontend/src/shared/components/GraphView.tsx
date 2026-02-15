import { useEffect, useRef, useCallback } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";

cytoscape.use(dagre);
cytoscape.use(fcose);

export type LayoutName = "dagre" | "fcose" | "circle" | "grid";

export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  size?: number;
  color?: string;
  isRoot?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  color?: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: LayoutName;
  onNodeClick?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;
  className?: string;
}

const GROUP_COLORS: Record<string, string> = {
  root: "#58a6ff",
  function: "#58a6ff",
  package: "#3fb950",
  type: "#bc8cff",
  variable: "#d29922",
  call: "#58a6ff",
  dfg: "#3fb950",
  parameter: "#d29922",
  return: "#f778ba",
  local: "#8b949e",
  default: "#8b949e",
};

const groupColor = (group?: string): string =>
  (group && GROUP_COLORS[group]) || GROUP_COLORS.default;

const getLayout = (name: LayoutName, nodeCount: number): any => {
  switch (name) {
    case "dagre":
      return {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 40,
        rankSep: 80,
        animate: nodeCount < 100,
        animationDuration: 300,
      };
    case "fcose":
      return {
        name: "fcose",
        animate: nodeCount < 150,
        animationDuration: 400,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
        quality: "proof",
      };
    case "circle":
      return { name: "circle", animate: true, animationDuration: 300 };
    case "grid":
      return { name: "grid", animate: true, animationDuration: 300 };
    default:
      return { name: "dagre", rankDir: "LR" };
  }
};

const GraphView = ({
  nodes,
  edges,
  layout = "dagre",
  onNodeClick,
  onNodeDoubleClick,
  className = "",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const buildElements = useCallback((): ElementDefinition[] => {
    const els: ElementDefinition[] = [];
    for (const n of nodes) {
      els.push({
        data: {
          id: n.id,
          label: n.label.length > 30 ? n.label.slice(0, 28) + "..." : n.label,
          fullLabel: n.label,
          group: n.group || "default",
          nodeSize: Math.max(20, Math.min(60, n.size ?? 30)),
        },
        classes: n.isRoot ? "root" : undefined,
      });
    }
    for (const e of edges) {
      els.push({
        data: {
          source: e.source,
          target: e.target,
          label: e.label || "",
          lineColor: e.color || "#30394a",
        },
      });
    }
    return els;
  }, [nodes, edges]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": "10px",
            color: "#c9d1d9",
            "text-margin-y": 6,
            "background-color": (ele: any) => groupColor(ele.data("group")),
            width: "data(nodeSize)",
            height: "data(nodeSize)",
            "border-width": 2,
            "border-color": "#30394a",
            "text-max-width": "80px",
            "text-wrap": "ellipsis",
          } as any,
        },
        {
          selector: "node.root",
          style: {
            "border-width": 3,
            "border-color": "#58a6ff",
            "background-color": "#1f6feb",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#f0f6fc",
            "background-color": "#388bfd",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#30394a",
            "target-arrow-color": "#30394a",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.8,
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#58a6ff",
            "target-arrow-color": "#58a6ff",
            width: 2.5,
          },
        },
      ],
      layout: getLayout(layout, nodes.length),
      minZoom: 0.2,
      maxZoom: 5,
      wheelSensitivity: 0.3,
    });

    if (onNodeClick) cy.on("tap", "node", (e) => onNodeClick(e.target.id()));
    if (onNodeDoubleClick) cy.on("dbltap", "node", (e) => onNodeDoubleClick(e.target.id()));
    cyRef.current = cy;

    return () => cy.destroy();
  }, [buildElements, layout, onNodeClick, onNodeDoubleClick, nodes.length]);

  return (
    <div
      ref={containerRef}
      className={`cytoscape-container bg-surface-900 rounded-lg border border-surface-600 ${className}`}
    />
  );
};

export default GraphView;

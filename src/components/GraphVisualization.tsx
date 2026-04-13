import { useState, useMemo } from 'react';

interface GraphNode {
  id: string;
  label: string;
  isStart?: boolean;
  isAccept?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title: string;
  highlightNodes?: string[];
}

const GraphVisualization = ({ nodes, edges, title, highlightNodes = [] }: GraphVisualizationProps) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const count = nodes.length;
    const cx = 250, cy = 180, rx = 150, ry = 120;
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      pos[node.id] = {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      };
    });
    return pos;
  }, [nodes]);

  // Group edges by from-to pair
  const groupedEdges = useMemo(() => {
    const map = new Map<string, string[]>();
    edges.forEach(e => {
      const key = `${e.from}->${e.to}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e.label);
    });
    return Array.from(map.entries()).map(([key, labels]) => {
      const [from, to] = key.split('->');
      return { from, to, label: labels.join(', ') };
    });
  }, [edges]);

  const toggleNode = (id: string) => {
    setActiveNode(prev => (prev === id ? null : id));
  };

  const getNodeColor = (node: GraphNode) => {
    if (activeNode === node.id) return 'hsl(280, 65%, 55%)';
    if (highlightNodes.includes(node.id)) return 'hsl(280, 65%, 55%)';
    if (node.isAccept) return 'hsl(160, 60%, 40%)';
    if (node.isStart) return 'hsl(35, 90%, 55%)';
    return 'hsl(220, 70%, 50%)';
  };

  const connectedEdges = activeNode
    ? groupedEdges.filter(e => e.from === activeNode || e.to === activeNode)
    : [];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary flex items-center justify-between">
        <h3 className="font-semibold text-secondary-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">Click nodes to inspect</span>
      </div>
      <div className="p-4">
        <svg viewBox="0 0 500 360" className="w-full max-w-lg mx-auto">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(220, 10%, 45%)" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(280, 65%, 55%)" />
            </marker>
          </defs>

          {/* Start arrow */}
          {nodes.find(n => n.isStart) && positions[nodes.find(n => n.isStart)!.id] && (() => {
            const startNode = nodes.find(n => n.isStart)!;
            const pos = positions[startNode.id];
            return (
              <line
                x1={pos.x - 50}
                y1={pos.y}
                x2={pos.x - 22}
                y2={pos.y}
                stroke="hsl(35, 90%, 55%)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })()}

          {/* Edges */}
          {groupedEdges.map((edge, i) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;

            const isActive = connectedEdges.includes(edge);
            const isSelf = edge.from === edge.to;

            if (isSelf) {
              return (
                <g key={i}>
                  <path
                    d={`M ${from.x - 12} ${from.y - 18} C ${from.x - 40} ${from.y - 60}, ${from.x + 40} ${from.y - 60}, ${from.x + 12} ${from.y - 18}`}
                    fill="none"
                    stroke={isActive ? 'hsl(280, 65%, 55%)' : 'hsl(220, 10%, 70%)'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  />
                  <text
                    x={from.x}
                    y={from.y - 55}
                    textAnchor="middle"
                    className="text-xs font-mono fill-muted-foreground"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            }

            // Check for reverse edge to offset
            const hasReverse = groupedEdges.some(e => e.from === edge.to && e.to === edge.from);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            const offset = hasReverse ? 8 : 0;

            const x1 = from.x + (dx / len) * 20 + nx * offset;
            const y1 = from.y + (dy / len) * 20 + ny * offset;
            const x2 = to.x - (dx / len) * 20 + nx * offset;
            const y2 = to.y - (dy / len) * 20 + ny * offset;

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActive ? 'hsl(280, 65%, 55%)' : 'hsl(220, 10%, 70%)'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                />
                <text
                  x={(x1 + x2) / 2 + nx * 12}
                  y={(y1 + y2) / 2 + ny * 12}
                  textAnchor="middle"
                  className="text-xs font-mono fill-muted-foreground"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const color = getNodeColor(node);
            const isActive = activeNode === node.id;
            return (
              <g
                key={node.id}
                className="graph-node"
                onClick={() => toggleNode(node.id)}
              >
                {node.isAccept && (
                  <circle cx={pos.x} cy={pos.y} r={22} fill="none" stroke={color} strokeWidth="2" />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={18}
                  fill={color}
                  stroke={isActive ? 'hsl(280, 65%, 75%)' : 'none'}
                  strokeWidth={isActive ? 3 : 0}
                  opacity={0.9}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-semibold fill-primary-foreground select-none pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-state-start" /> Start
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-state-accept" /> Accept
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-state-normal" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-state-active" /> Selected
          </span>
        </div>

        {/* Info panel */}
        {activeNode && (
          <div className="mt-3 p-3 bg-secondary rounded-lg text-sm">
            <p className="font-semibold text-secondary-foreground">
              State: {nodes.find(n => n.id === activeNode)?.label}
            </p>
            <p className="text-muted-foreground mt-1">
              {nodes.find(n => n.id === activeNode)?.isStart && '→ Start state '}
              {nodes.find(n => n.id === activeNode)?.isAccept && '★ Accept state '}
            </p>
            {connectedEdges.length > 0 && (
              <div className="mt-1 text-muted-foreground">
                Transitions:{' '}
                {connectedEdges.map((e, i) => (
                  <span key={i} className="font-mono">
                    {e.from}→{e.to} ({e.label})
                    {i < connectedEdges.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphVisualization;

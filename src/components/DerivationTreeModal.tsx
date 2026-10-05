import React, { useMemo } from 'react';
import { ParseStep, ParseTreeNode } from '../types';
import { buildDerivationTree } from '../utils/compilerEngine';

interface DerivationTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputString: string;
  steps: ParseStep[];
}

interface LayoutNode {
  id: string;
  label: string;
  type: 'nt' | 'terminal';
  children: LayoutNode[];
  x: number;
  y: number;
  depth: number;
}

interface Edge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const DerivationTreeModal: React.FC<DerivationTreeModalProps> = ({
  isOpen,
  onClose,
  inputString,
  steps,
}) => {
  const treeRoot = useMemo(() => {
    return buildDerivationTree(steps);
  }, [steps]);

  const { layoutNodes, edges, width, height } = useMemo(() => {
    if (!treeRoot) {
      return { layoutNodes: [], edges: [], width: 500, height: 300 };
    }

    let leafIndex = 0;
    const xSpacing = 70;
    const ySpacing = 75;
    const topMargin = 50;
    const leftMargin = 50;

    let maxDepth = 0;

    function buildLayout(node: ParseTreeNode, depth: number): LayoutNode {
      if (depth > maxDepth) maxDepth = depth;

      const children = (node.children || []).map((c) => buildLayout(c, depth + 1));
      let x = 0;
      if (children.length === 0) {
        x = leftMargin + leafIndex * xSpacing;
        leafIndex++;
      } else {
        x = (children[0].x + children[children.length - 1].x) / 2;
      }
      const y = topMargin + depth * ySpacing;

      return {
        id: node.id,
        label: node.label,
        type: node.type,
        children,
        x,
        y,
        depth,
      };
    }

    const rootLayout = buildLayout(treeRoot, 0);

    const allNodes: LayoutNode[] = [];
    const allEdges: Edge[] = [];

    function collect(node: LayoutNode) {
      allNodes.push(node);
      for (const child of node.children) {
        allEdges.push({
          id: `${node.id}->${child.id}`,
          x1: node.x,
          y1: node.y,
          x2: child.x,
          y2: child.y,
        });
        collect(child);
      }
    }

    collect(rootLayout);

    const calculatedWidth = Math.max(560, (leafIndex + 1) * xSpacing + 60);
    const calculatedHeight = Math.max(300, (maxDepth + 1) * ySpacing + 80);

    return {
      layoutNodes: allNodes,
      edges: allEdges,
      width: calculatedWidth,
      height: calculatedHeight,
    };
  }, [treeRoot]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl border border-[#DDD6C5] shadow-2xl max-w-4xl w-full max-h-[90vh] p-6 flex flex-col gap-4 font-['IBM_Plex_Sans'] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-[#006768]/10 text-[#006768] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">account_tree</span>
          </div>
          <div>
            <h2 className="font-['Bricolage_Grotesque'] text-lg font-bold text-gray-900">
              Syntactic Derivation Tree
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              Target String: <span className="font-bold text-gray-800">{inputString}</span>
            </p>
          </div>
        </div>

        {/* Tree SVG Visualization Container */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col items-center justify-center min-h-[340px] max-h-[500px] overflow-auto">
          {treeRoot ? (
            <svg
              className="min-w-full"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Edges */}
              {edges.map((edge) => (
                <path
                  key={edge.id}
                  d={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`}
                  stroke="#BDC9C9"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}

              {/* Nodes */}
              {layoutNodes.map((node) => {
                const isRoot = node.depth === 0;
                const isTerminal = node.type === 'terminal';

                if (isTerminal) {
                  const rectWidth = Math.max(34, node.label.length * 10 + 16);
                  return (
                    <g key={node.id} transform={`translate(${node.x - rectWidth / 2}, ${node.y - 12})`}>
                      <rect
                        width={rectWidth}
                        height="24"
                        rx="6"
                        fill="#006768"
                        className="shadow-sm"
                      />
                      <text
                        x={rectWidth / 2}
                        y="16"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <circle
                      r="16"
                      fill={isRoot ? '#006768' : '#EDEDFA'}
                      stroke={isRoot ? '#004f51' : '#006768'}
                      strokeWidth="2"
                      className="shadow-sm"
                    />
                    <text
                      y="4"
                      textAnchor="middle"
                      fill={isRoot ? '#FFFFFF' : '#006768'}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500 py-12">
              <span className="material-symbols-outlined text-[36px] text-gray-400">error_outline</span>
              <p className="font-mono text-sm">No valid derivation tree available.</p>
              <p className="text-xs text-gray-400">The string must be parsed to an ACCEPT state to render a derivation tree.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1">
          <span>Hierarchy reconstructed dynamically from bottom-up reduction trace.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

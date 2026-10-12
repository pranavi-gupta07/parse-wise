import React, { useMemo } from 'react';
import { ReNode, fmtSet, nodeLabel, describeNode } from '../../utils/reToDfaEngine';

interface SyntaxTreeSvgProps {
  root: ReNode;
  nodes: ReNode[];
  /** nodes with id <= annotatedUpTo show nullable/firstpos/lastpos; -1 = none */
  annotatedUpTo: number;
  /** node currently being explained (amber) */
  currentId?: number;
  /** optional set of node ids to emphasise (teal ring), e.g. followpos contributors */
  emphasizeIds?: number[];
  /** leaf positions to tint (e.g. positions receiving followpos) */
  highlightPositions?: number[];
  /** dim nodes that are not emphasised */
  dimOthers?: boolean;
  onSelectNode?: (id: number) => void;
  /** only nodes with id <= builtUpTo exist yet (dynamic construction); default = all */
  builtUpTo?: number;
  /** ids of subtree roots currently on the build stack (shown with a stack badge) */
  stackIds?: number[];
  /** hide firstpos/lastpos text (compact mode) */
  compact?: boolean;
}

interface Placed {
  node: ReNode;
  x: number;
  y: number;
}

const R = 17;
const LEVEL_H = 64;
const PAD_X = 70;
const PAD_TOP = 36;

export const SyntaxTreeSvg: React.FC<SyntaxTreeSvgProps> = ({
  root,
  nodes,
  annotatedUpTo,
  currentId,
  emphasizeIds = [],
  highlightPositions = [],
  dimOthers = false,
  onSelectNode,
  builtUpTo,
  stackIds = [],
  compact = false,
}) => {
  const built = builtUpTo ?? Number.MAX_SAFE_INTEGER;
  const layout = useMemo(() => {
    const maxLen = Math.max(...nodes.map((n) => Math.max(fmtSet(n.firstpos).length, fmtSet(n.lastpos).length)));
    const spacing = Math.min(200, Math.max(96, 48 + maxLen * 8));
    const placed: Record<number, Placed> = {};
    let leafIdx = 0;
    let maxDepth = 0;
    const visit = (n: ReNode): number => {
      maxDepth = Math.max(maxDepth, n.depth);
      let x: number;
      if (!n.left && !n.right) {
        x = PAD_X + leafIdx * spacing;
        leafIdx++;
      } else if (n.left && !n.right) {
        x = visit(n.left);
      } else {
        const a = visit(n.left!);
        const b = visit(n.right!);
        x = (a + b) / 2;
      }
      placed[n.id] = { node: n, x, y: PAD_TOP + n.depth * LEVEL_H };
      return x;
    };
    visit(root);
    const width = PAD_X * 2 + Math.max(leafIdx - 1, 0) * spacing;
    const height = PAD_TOP + maxDepth * LEVEL_H + 56;
    return { placed, width, height };
  }, [root, nodes]);

  const { placed, width, height } = layout;
  const edges: { from: Placed; to: Placed }[] = [];
  Object.values(placed).forEach((p) => {
    if (p.node.id > built) return;
    if (p.node.left) edges.push({ from: p, to: placed[p.node.left.id] });
    if (p.node.right) edges.push({ from: p, to: placed[p.node.right.id] });
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: width * 1.25, maxHeight: height * 1.25 }}
        className="block font-mono"
      >
        {edges.map((e, i) => {
          const dim = dimOthers && !emphasizeIds.includes(e.from.node.id) && !emphasizeIds.includes(e.to.node.id);
          return (
            <line
              key={i}
              x1={e.from.x}
              y1={e.from.y + R}
              x2={e.to.x}
              y2={e.to.y - R}
              stroke={dim ? '#E3DCCD' : '#BDC9C9'}
              strokeWidth={1.5}
            />
          );
        })}

        {Object.values(placed).map(({ node: n, x, y }) => {
          if (n.id > built) {
            return null; // not built yet
          }
          const onStack = stackIds.includes(n.id);
          const annotated = n.id <= annotatedUpTo;
          const isCurrent = n.id === currentId;
          const isEmph = emphasizeIds.includes(n.id);
          const isEnd = n.symbol === '#';
          const posHL = n.pos !== undefined && highlightPositions.includes(n.pos);
          const dim = dimOthers && !isCurrent && !isEmph && !posHL;
          const isLeaf = n.type === 'leaf' || n.type === 'eps';

          let fill = '#FFFFFF';
          let stroke = '#BDC9C9';
          let text = '#191B24';
          if (annotated) {
            stroke = '#006768';
            fill = isLeaf ? '#FFFFFF' : '#E6F4F4';
            text = isLeaf ? '#006768' : '#004F51';
          }
          if (isEnd) {
            fill = '#14161F';
            text = '#F2A93B';
            stroke = '#14161F';
          }
          if (posHL) {
            fill = '#ffddb5';
            stroke = '#F2A93B';
            text = '#835400';
          }
          if (isEmph) {
            stroke = '#006768';
          }
          if (isCurrent) {
            fill = '#F2A93B';
            stroke = '#835400';
            text = '#14161F';
          }

          return (
            <g
              key={n.id}
              opacity={dim ? 0.35 : 1}
              onClick={() => onSelectNode?.(n.id)}
              className={onSelectNode ? 'cursor-pointer' : ''}
            >
              <title>
                {describeNode(n)}
                {annotated ? `\nnullable = ${n.nullable}\nfirstpos = ${fmtSet(n.firstpos)}\nlastpos = ${fmtSet(n.lastpos)}` : ''}
              </title>
              {isCurrent && <circle cx={x} cy={y} r={R + 6} fill="none" stroke="#F2A93B" strokeOpacity={0.45} strokeWidth={4} />}
              {isEmph && !isCurrent && <circle cx={x} cy={y} r={R + 5} fill="none" stroke="#006768" strokeOpacity={0.35} strokeWidth={3} />}
              <circle cx={x} cy={y} r={R} fill={fill} stroke={stroke} strokeWidth={isCurrent ? 2.5 : 1.8} />
              {annotated && n.nullable && (
                <circle cx={x} cy={y} r={R - 4} fill="none" stroke="#8E5BD9" strokeWidth={1.4} strokeDasharray="3 2.5" />
              )}
              <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={text}>
                {nodeLabel(n)}
              </text>

              {n.pos !== undefined && (
                <g>
                  <rect x={x - 11} y={y + R + 5} width={22} height={15} rx={3} fill={isEnd ? '#14161F' : '#FEF6E9'} stroke={isEnd ? '#14161F' : '#F2A93B'} strokeWidth={1} />
                  <text x={x} y={y + R + 16} textAnchor="middle" fontSize={10} fontWeight={700} fill={isEnd ? '#F2A93B' : '#835400'}>
                    {n.pos}
                  </text>
                </g>
              )}

              {onStack && (
                <g>
                  <rect x={x - 18} y={y - R - 19} width={36} height={13} rx={6.5} fill="#14161F" />
                  <text x={x} y={y - R - 9.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#8FF3F4">
                    stack
                  </text>
                </g>
              )}
              {annotated && !compact && (
                <>
                  <text x={x - R - 6} y={y + 4} textAnchor="end" fontSize={11} fontWeight={600} fill="#3B6FD8">
                    {fmtSet(n.firstpos)}
                  </text>
                  <text x={x + R + 6} y={y + 4} textAnchor="start" fontSize={11} fontWeight={600} fill="#E8603C">
                    {fmtSet(n.lastpos)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const TreeLegend: React.FC = () => (
  <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-gray-600">
    <span className="flex items-center gap-1.5">
      <span className="font-bold text-[#3B6FD8]">{'{…}'}</span> firstpos (left)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="font-bold text-[#E8603C]">{'{…}'}</span> lastpos (right)
    </span>
    <span className="flex items-center gap-1.5">
      <svg width="16" height="16">
        <circle cx="8" cy="8" r="6" fill="none" stroke="#8E5BD9" strokeWidth="1.4" strokeDasharray="3 2.5" />
      </svg>
      nullable
    </span>
    <span className="flex items-center gap-1.5">
      <span className="px-1 rounded bg-[#FEF6E9] border border-[#F2A93B] text-[#835400] font-bold text-[10px]">n</span> position
    </span>
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full bg-[#14161F] inline-block"></span> # end-marker
    </span>
  </div>
);

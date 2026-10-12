import React, { useMemo } from 'react';
import { DfaState, fmtSet } from '../../utils/reToDfaEngine';

interface DfaGraphSvgProps {
  /** full (final) DFA — used only for a stable layout */
  layoutStates: DfaState[];
  layoutTransitions: Record<string, Record<string, string>>;
  start: string;
  /** what is actually drawn (grows during construction) */
  states: DfaState[];
  transitions: Record<string, Record<string, string>>;
  /** construction highlights */
  processing?: string; // state whose transitions are being computed
  newState?: string; // freshly created state
  activeEdge?: { from: string; symbol: string; to?: string };
  /** simulation highlight */
  activeState?: string | null;
  deadHighlight?: boolean;
  showPositions?: boolean;
}

const R = 26;
const COL_W = 175;
const ROW_H = 130;

export const DfaGraphSvg: React.FC<DfaGraphSvgProps> = ({
  layoutStates,
  layoutTransitions,
  start,
  states,
  transitions,
  processing,
  newState,
  activeEdge,
  activeState,
  deadHighlight,
  showPositions = true,
}) => {
  const layout = useMemo(() => {
    // BFS depth from the start state
    const depth: Record<string, number> = { [start]: 0 };
    const order: string[] = [start];
    for (let i = 0; i < order.length; i++) {
      const s = order[i];
      Object.keys(layoutTransitions[s] || {})
        .sort()
        .forEach((a) => {
          const t = layoutTransitions[s][a];
          if (depth[t] === undefined) {
            depth[t] = depth[s] + 1;
            order.push(t);
          }
        });
    }
    layoutStates.forEach((s) => {
      if (depth[s.name] === undefined) {
        depth[s.name] = 0;
        order.push(s.name);
      }
    });
    const cols: Record<number, string[]> = {};
    order.forEach((n) => (cols[depth[n]] = [...(cols[depth[n]] || []), n]));
    const maxRows = Math.max(...Object.values(cols).map((c) => c.length));
    const nCols = Object.keys(cols).length;
    const topPad = 80;
    const hasBack = layoutStates.some((st) =>
      Object.values(layoutTransitions[st.name] || {}).some((t) => t !== st.name && depthOf(t) <= depthOf(st.name))
    );
    function depthOf(n: string) {
      return depth[n] ?? 0;
    }
    const height = topPad + maxRows * ROW_H + (hasBack ? 110 : 40);
    const width = 110 + (nCols - 1) * COL_W + 90;
    const pos: Record<string, { x: number; y: number; depth: number }> = {};
    Object.entries(cols).forEach(([d, names]) => {
      const colH = names.length * ROW_H;
      const offset = topPad + (maxRows * ROW_H - colH) / 2;
      names.forEach((n, i) => {
        pos[n] = { x: 110 + +d * COL_W, y: offset + i * ROW_H + ROW_H / 2 - 10, depth: +d };
      });
    });
    return { pos, width, height };
  }, [layoutStates, layoutTransitions, start]);

  const { pos, width, height } = layout;

  // group transitions by (from,to)
  const edgeMap: Record<string, { from: string; to: string; symbols: string[] }> = {};
  Object.entries(transitions).forEach(([from, row]) =>
    Object.entries(row).forEach(([sym, to]) => {
      const k = `${from}→${to}`;
      if (!edgeMap[k]) edgeMap[k] = { from, to, symbols: [] };
      edgeMap[k].symbols.push(sym);
    })
  );
  const edges = Object.values(edgeMap);
  const visible = new Set(states.map((s) => s.name));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: width, minWidth: Math.round(width * 0.72), height: 'auto' }}
        className="mx-auto block font-mono"
      >
        <defs>
          <marker id="dfa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#6D7979" />
          </marker>
          <marker id="dfa-arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#E08E0B" />
          </marker>
          <marker id="dfa-arrow-start" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#006768" />
          </marker>
        </defs>

        {/* start arrow */}
        {pos[start] && visible.has(start) && (
          <g>
            <line
              x1={pos[start].x - R - 52}
              y1={pos[start].y}
              x2={pos[start].x - R - 3}
              y2={pos[start].y}
              stroke="#006768"
              strokeWidth={2}
              markerEnd="url(#dfa-arrow-start)"
            />
            <text x={pos[start].x - R - 52} y={pos[start].y - 8} fontSize={10} fill="#006768" fontWeight={700}>
              start
            </text>
          </g>
        )}

        {/* edges */}
        {edges.map((e) => {
          const p = pos[e.from];
          const q = pos[e.to];
          if (!p || !q) return null;
          const isActive = !!activeEdge && activeEdge.from === e.from && e.symbols.includes(activeEdge.symbol) && activeEdge.to === e.to;
          const label = e.symbols.sort().join(', ');
          const color = isActive ? '#E08E0B' : '#6D7979';
          const marker = isActive ? 'url(#dfa-arrow-hl)' : 'url(#dfa-arrow)';
          const sw = isActive ? 3 : 1.6;

          if (e.from === e.to) {
            const d = `M ${p.x - 11} ${p.y - R + 2} C ${p.x - 42} ${p.y - R - 58}, ${p.x + 42} ${p.y - R - 58}, ${p.x + 11} ${p.y - R + 2}`;
            const lw = label.length * 7 + 10;
            return (
              <g key={`${e.from}-${e.to}`}>
                <path d={d} fill="none" stroke={color} strokeWidth={sw} markerEnd={marker} />
                <rect x={p.x - lw / 2} y={p.y - R - 58} width={lw} height={16} rx={4} fill={isActive ? '#ffddb5' : '#FFFDF8'} />
                <text x={p.x} y={p.y - R - 46} textAnchor="middle" fontSize={12} fontWeight={700} fill={isActive ? '#835400' : '#191B24'}>
                  {label}
                </text>
              </g>
            );
          }

          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = -dy / dist;
          const ny = dx / dist;
          const hasReverse = !!edgeMap[`${e.to}→${e.from}`];
          const depthDiff = q.depth - p.depth;
          let c = 0;
          let forceBelow = false;
          if (depthDiff <= 0) {
            c = 45 + 36 * Math.abs(depthDiff);
            forceBelow = true;
          } else if (depthDiff > 1) {
            c = 45 + 20 * (depthDiff - 1);
          } else if (hasReverse) {
            c = 26;
          }
          const mx = (p.x + q.x) / 2;
          const my = (p.y + q.y) / 2;
          let cx = mx + nx * c;
          let cy = my + ny * c;
          if (forceBelow && cy < my) {
            cx = mx - nx * c;
            cy = my - ny * c;
          }
          if (!forceBelow && depthDiff > 1 && cy > my) {
            cx = mx - nx * c;
            cy = my - ny * c;
          }
          // trim endpoints to circle edges
          const u1x = cx - p.x;
          const u1y = cy - p.y;
          const l1 = Math.hypot(u1x, u1y) || 1;
          const u2x = cx - q.x;
          const u2y = cy - q.y;
          const l2 = Math.hypot(u2x, u2y) || 1;
          const sx = p.x + (u1x / l1) * R;
          const sy = p.y + (u1y / l1) * R;
          const ex = q.x + (u2x / l2) * (R + 2);
          const ey = q.y + (u2y / l2) * (R + 2);
          const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
          const ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
          const lw = label.length * 7 + 10;
          return (
            <g key={`${e.from}-${e.to}`}>
              <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={sw} markerEnd={marker} />
              <rect x={lx - lw / 2} y={ly - 9} width={lw} height={16} rx={4} fill={isActive ? '#ffddb5' : '#FFFDF8'} stroke={isActive ? '#F2A93B' : 'none'} />
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize={12} fontWeight={700} fill={isActive ? '#835400' : '#191B24'}>
                {label}
              </text>
            </g>
          );
        })}

        {/* states */}
        {states.map((s) => {
          const p = pos[s.name];
          if (!p) return null;
          const isNew = s.name === newState;
          const isProc = s.name === processing;
          const isSim = s.name === activeState;
          let fill = '#FFFFFF';
          let stroke = '#006768';
          let text = '#004F51';
          if (isProc) fill = '#E6F4F4';
          if (isNew) {
            fill = '#ffddb5';
            stroke = '#E08E0B';
            text = '#835400';
          }
          if (isSim) {
            fill = '#006768';
            stroke = '#004F51';
            text = '#FFFFFF';
          }
          return (
            <g key={s.name}>
              <title>{`${s.name} = ${fmtSet(s.positions)}${s.accepting ? ' (accepting)' : ''}`}</title>
              {(isNew || isSim) && <circle cx={p.x} cy={p.y} r={R + 8} fill="none" stroke={isSim ? '#006768' : '#F2A93B'} strokeOpacity={0.35} strokeWidth={5} />}
              {isProc && !isNew && !isSim && (
                <circle cx={p.x} cy={p.y} r={R + 7} fill="none" stroke="#006768" strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 3" />
              )}
              <circle cx={p.x} cy={p.y} r={R} fill={fill} stroke={stroke} strokeWidth={2.2} />
              {s.accepting && <circle cx={p.x} cy={p.y} r={R - 5} fill="none" stroke={isSim ? '#FFFFFF' : stroke} strokeWidth={1.6} />}
              <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill={text}>
                {s.name}
              </text>
              {showPositions && (
                <text x={p.x} y={p.y + R + 17} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#6D7979">
                  {fmtSet(s.positions)}
                </text>
              )}
            </g>
          );
        })}

        {deadHighlight && activeEdge && pos[activeEdge.from] && (
          <text x={pos[activeEdge.from].x} y={pos[activeEdge.from].y + R + 32} textAnchor="middle" fontSize={11} fontWeight={700} fill="#BA1A1A">
            {`${activeEdge.symbol} → ∅`}
          </text>
        )}
      </svg>
    </div>
  );
};

export const DfaLegend: React.FC = () => (
  <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-gray-600">
    <span className="flex items-center gap-1.5">
      <svg width="18" height="18">
        <circle cx="9" cy="9" r="7.5" fill="#fff" stroke="#006768" strokeWidth="1.6" />
        <circle cx="9" cy="9" r="4.5" fill="none" stroke="#006768" strokeWidth="1.2" />
      </svg>
      accepting (contains #)
    </span>
    <span className="flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded-full bg-[#ffddb5] border-2 border-[#E08E0B] inline-block"></span> new state
    </span>
    <span className="flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded-full bg-[#E6F4F4] border-2 border-dashed border-[#006768] inline-block"></span> being processed
    </span>
    <span className="flex items-center gap-1.5">
      <span className="w-5 h-[3px] bg-[#E08E0B] inline-block rounded"></span> current transition
    </span>
  </div>
);

import React from 'react';

interface FollowposGraphSvgProps {
  positions: { pos: number; symbol: string }[];
  followpos: Record<number, number[]>; // current snapshot
  source?: number | null; // position being updated
  targets?: number[]; // firstpos set being added
  fresh?: number[]; // edges source→fresh are new in this step
}

const R = 19;
const GAP = 74;
const PAD = 50;

/**
 * Positions laid out left→right. Each followpos entry j ∈ followpos(i) is an arrow i → j:
 * forward arrows arc above the row, backward arrows (loops of a star) arc below.
 */
export const FollowposGraphSvg: React.FC<FollowposGraphSvgProps> = ({ positions, followpos, source, targets = [], fresh = [] }) => {
  const xOf = (p: number) => PAD + (p - 1) * GAP;
  const edges: { i: number; j: number; isNew: boolean }[] = [];
  Object.entries(followpos).forEach(([k, set]) =>
    set.forEach((j) => edges.push({ i: +k, j, isNew: source === +k && fresh.includes(j) }))
  );

  const peak = (i: number, j: number) => 16 + 9 * Math.abs(j - i);
  let maxUp = 30;
  let maxDown = 20;
  edges.forEach((e) => {
    if (e.j > e.i) maxUp = Math.max(maxUp, peak(e.i, e.j));
    else if (e.j < e.i) maxDown = Math.max(maxDown, peak(e.i, e.j));
    else maxUp = Math.max(maxUp, 40);
  });
  // keep the canvas size stable-ish by reserving room for the widest possible arcs
  const n = positions.length;
  maxUp = Math.max(maxUp, Math.min(peak(1, n), 70));
  const y = maxUp + 24;
  const width = PAD * 2 + (n - 1) * GAP;
  const height = y + R + 30 + maxDown + 10;

  // draw old edges first, new ones on top
  const ordered = [...edges].sort((a, b) => Number(a.isNew) - Number(b.isNew));

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', maxWidth: width * 1.25, maxHeight: height * 1.25 }}
        className="block font-mono"
      >
        <defs>
          <marker id="fp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#8F9AA0" />
          </marker>
          <marker id="fp-arrow-new" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#E08E0B" />
          </marker>
        </defs>

        {ordered.map(({ i, j, isNew }) => {
          const color = isNew ? '#E08E0B' : '#8F9AA0';
          const sw = isNew ? 2.6 : 1.3;
          const marker = isNew ? 'url(#fp-arrow-new)' : 'url(#fp-arrow)';
          const xi = xOf(i);
          const xj = xOf(j);
          if (i === j) {
            const d = `M ${xi - 8} ${y - R + 2} C ${xi - 28} ${y - R - 34}, ${xi + 28} ${y - R - 34}, ${xi + 8} ${y - R + 2}`;
            return <path key={`${i}-${j}`} d={d} fill="none" stroke={color} strokeWidth={sw} markerEnd={marker} opacity={isNew ? 1 : 0.85} />;
          }
          const up = j > i;
          const cy = y + (up ? -1 : 1) * 2 * peak(i, j);
          const cx = (xi + xj) / 2;
          const trim = (px: number, extra: number) => {
            const dx = cx - px;
            const dy = cy - y;
            const l = Math.hypot(dx, dy) || 1;
            return [px + (dx / l) * (R + extra), y + (dy / l) * (R + extra)];
          };
          const [sx, sy] = trim(xi, 0);
          const [ex, ey] = trim(xj, 2);
          return (
            <path
              key={`${i}-${j}`}
              d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              markerEnd={marker}
              opacity={isNew ? 1 : 0.85}
            />
          );
        })}

        {positions.map((p) => {
          const x = xOf(p.pos);
          const isEnd = p.symbol === '#';
          const isSrc = source === p.pos;
          const isTgt = targets.includes(p.pos);
          let fill = '#FFFFFF';
          let stroke = '#006768';
          let text = '#004F51';
          if (isEnd) {
            fill = '#14161F';
            stroke = '#14161F';
            text = '#F2A93B';
          }
          if (isTgt) {
            fill = '#EAF1FD';
            stroke = '#3B6FD8';
            text = '#1F4FB0';
          }
          if (isSrc) {
            fill = '#F2A93B';
            stroke = '#835400';
            text = '#14161F';
          }
          return (
            <g key={p.pos}>
              {isSrc && <circle cx={x} cy={y} r={R + 6} fill="none" stroke="#F2A93B" strokeOpacity={0.45} strokeWidth={4} />}
              <circle cx={x} cy={y} r={R} fill={fill} stroke={stroke} strokeWidth={2} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={800} fill={text}>
                {p.symbol}
              </text>
              <rect x={x - 11} y={y + R + 5} width={22} height={15} rx={3} fill={isEnd ? '#14161F' : '#FEF6E9'} stroke={isEnd ? '#14161F' : '#F2A93B'} />
              <text x={x} y={y + R + 16} textAnchor="middle" fontSize={10} fontWeight={700} fill={isEnd ? '#F2A93B' : '#835400'}>
                {p.pos}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

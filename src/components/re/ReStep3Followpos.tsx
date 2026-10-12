import React, { useEffect } from 'react';
import { ReParseResult, DfaResult, fmtSet } from '../../utils/reToDfaEngine';
import { useStepPlayer } from './useStepPlayer';
import { PlaybackBar } from './PlaybackBar';
import { SyntaxTreeSvg, TreeLegend } from './SyntaxTreeSvg';
import { StageHeader, StageNav } from './StageHeader';

interface Props {
  parse: ReParseResult;
  dfa: DfaResult;
  startInAll?: boolean;
  globalViewMode?: 'step' | 'all';
  onBack: () => void;
  onProceed: () => void;
}

export const ReStep3Followpos: React.FC<Props> = ({ parse, dfa, startInAll, globalViewMode, onBack, onProceed }) => {
  const steps = dfa.followSteps;
  const player = useStepPlayer(steps.length, parse.augmented);

  useEffect(() => {
    if (startInAll || globalViewMode === 'all') player.showAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow the header's global Step-by-step / Show all toggle
  const firstRender = React.useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (globalViewMode === 'all') player.showAll();
    else player.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalViewMode]);

  const isAll = player.viewMode === 'all';
  const active = steps[player.index];
  const table = isAll ? dfa.followpos : active.snapshot;
  const contributingIds = steps.map((s) => s.nodeId);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 03 · Followpos"
        subtitle={parse.augmented}
        title="Followpos Table Construction"
        description="followpos(i) is the set of positions that can come right after position i. Only cat-nodes and star/plus-nodes add entries."
        metrics={[
          { label: 'Rule Nodes', value: steps.length },
          { label: 'Positions', value: parse.positions.length, tone: 'amber' },
          { label: 'Status', value: player.isComplete ? 'Table Complete' : 'In Progress', tone: player.isComplete ? 'teal' : 'amber' },
        ]}
      />

      <PlaybackBar player={player} unitLabel="rule" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tree */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">account_tree</span>
              <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Contributing Nodes</h3>
            </div>
            <TreeLegend />
          </div>
          <div className="p-4 bg-[#FFFDF8] bg-dot-grid">
            <SyntaxTreeSvg
              root={parse.root!}
              nodes={parse.nodes}
              annotatedUpTo={parse.nodes.length}
              currentId={isAll ? undefined : active.nodeId}
              emphasizeIds={contributingIds}
              highlightPositions={isAll ? [] : active.sources}
              dimOthers={!isAll}
              onSelectNode={(id) => {
                const i = steps.findIndex((s) => s.nodeId === id);
                if (i >= 0) player.setIndex(i);
              }}
            />
          </div>
          <div className="px-4 py-2 border-t border-gray-100 font-mono text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
            <span className="w-3 h-3 rounded-full bg-[#F2A93B] inline-block"></span> current rule node
            <span className="w-3 h-3 rounded-full bg-[#ffddb5] border border-[#F2A93B] inline-block ml-3"></span> positions i whose followpos grows
          </div>
        </div>

        {/* Rule card */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffddb5]/50 rotate-45 pointer-events-none"></div>
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[20px]">rule</span>
                <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">
                  {isAll ? 'All Rules Applied' : active.kind === 'cat' ? 'Rule 1 · Cat-node' : `Rule 2 · ${active.kind === 'star' ? 'Star' : 'Plus'}-node`}
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-bold">
                {isAll ? `${steps.length} rules` : `#${player.index + 1}`}
              </span>
            </div>

            {isAll ? (
              <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
                {steps.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => player.setIndex(s.index)}
                    className="text-left p-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#F2A93B] transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-xs text-gray-900">{s.title}</div>
                    <div className="font-mono text-[11px] text-gray-600">{s.rule}</div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-lg bg-[#14161F] text-[#B8BBC8] font-mono text-[11px] leading-relaxed">
                  {active.kind === 'cat' ? (
                    <>
                      <span className="text-[#F2A93B] font-bold">if</span> n = c1 · c2 <span className="text-[#F2A93B] font-bold">then</span>
                      <br />
                      &nbsp;&nbsp;∀ i ∈ <span className="text-[#F27F5E]">lastpos(c1)</span>: followpos(i) ∪= <span className="text-[#6A93F0]">firstpos(c2)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#F2A93B] font-bold">if</span> n = c1{active.kind === 'star' ? '*' : '+'} <span className="text-[#F2A93B] font-bold">then</span>
                      <br />
                      &nbsp;&nbsp;∀ i ∈ <span className="text-[#F27F5E]">lastpos(n)</span>: followpos(i) ∪= <span className="text-[#6A93F0]">firstpos(n)</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-900">{active.title}</span>
                  <span className="font-mono text-[11px] text-gray-700 leading-relaxed">{active.rule}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 flex flex-col">
                    <span className="font-mono text-[10px] uppercase font-bold text-gray-500">{active.kind === 'cat' ? 'lastpos(c1)' : 'lastpos(n)'}</span>
                    <span className="font-mono text-sm font-bold text-[#E8603C]">{fmtSet(active.sources)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 flex flex-col">
                    <span className="font-mono text-[10px] uppercase font-bold text-gray-500">{active.kind === 'cat' ? 'firstpos(c2)' : 'firstpos(n)'}</span>
                    <span className="font-mono text-sm font-bold text-[#3B6FD8]">{fmtSet(active.added)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase text-gray-500 font-bold tracking-wider">Effect</span>
                  {Object.keys(active.delta).length === 0 ? (
                    <span className="font-mono text-xs text-gray-500">No new entries — all already present.</span>
                  ) : (
                    Object.entries(active.delta).map(([i, add]) => (
                      <span key={i} className="font-mono text-xs text-gray-800">
                        followpos({i}) <span className="text-gray-400">∪=</span> <span className="text-[#835400] font-bold bg-[#ffddb5] px-1 rounded">{fmtSet(add)}</span>
                      </span>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Followpos table */}
      <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
        <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-800 text-[18px]">table_chart</span>
            <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Followpos Table</h3>
          </div>
          <span className="font-mono text-xs text-gray-500">{isAll ? 'final' : `after rule ${player.index + 1} of ${steps.length}`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-4 w-28">Position i</th>
                <th className="py-2.5 px-4 w-28">Symbol</th>
                <th className="py-2.5 px-4">followpos(i)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parse.positions.map((p) => {
                const fresh = !isAll ? active.delta[p.pos] || [] : [];
                const isSource = !isAll && active.sources.includes(p.pos);
                const set = table[p.pos] || [];
                return (
                  <tr key={p.pos} className={isSource ? 'bg-[#FEF6E9]' : ''}>
                    <td className="py-2 px-4 font-bold text-[#835400]">{p.pos}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${p.symbol === '#' ? 'bg-[#14161F] text-[#F2A93B]' : 'bg-gray-100 text-gray-900'}`}>{p.symbol}</span>
                    </td>
                    <td className="py-2 px-4">
                      {p.symbol === '#' ? (
                        <span className="text-gray-400">∅ (end-marker — accepting position)</span>
                      ) : set.length === 0 ? (
                        <span className="text-gray-400">∅</span>
                      ) : (
                        <span className="flex items-center gap-1 flex-wrap">
                          <span className="text-gray-400">{'{'}</span>
                          {set.map((x) => (
                            <span
                              key={x}
                              className={`px-1.5 rounded font-bold ${fresh.includes(x) ? 'bg-[#F2A93B] text-[#14161F]' : 'text-[#006768] bg-[#E6F4F4]'}`}
                            >
                              {x}
                            </span>
                          ))}
                          <span className="text-gray-400">{'}'}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StageNav backLabel="Back to Syntax Tree" onBack={onBack} nextLabel="Proceed to DFA Construction" onNext={onProceed} />
    </div>
  );
};

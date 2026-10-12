import React, { useEffect, useRef } from 'react';
import { ReParseResult, DfaResult, fmtSet } from '../../utils/reToDfaEngine';
import { useStepPlayer } from './useStepPlayer';
import { PlaybackBar } from './PlaybackBar';
import { SyntaxTreeSvg } from './SyntaxTreeSvg';
import { FollowposGraphSvg } from './FollowposGraphSvg';
import { StageHeader, StageNav, WORKSPACE_H } from './StageHeader';
import { scrollIntoContainer } from './scrollIntoContainer';

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
  // step 0 = empty table, then one step per followpos update
  const player = useStepPlayer(steps.length + 1, parse.augmented);
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (startInAll || globalViewMode === 'all') player.showAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstRender = useRef(true);
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
  const isStart = !isAll && player.index === 0;
  const active = !isAll && !isStart ? steps[player.index - 1] : undefined;

  const emptyTable: Record<number, number[]> = {};
  parse.positions.forEach((p) => (emptyTable[p.pos] = []));
  const table = isAll ? dfa.followpos : active ? active.snapshot : emptyTable;
  const ruleNodeIds = Array.from(new Set(steps.map((s) => s.nodeId)));
  const doneRuleIds = isAll ? ruleNodeIds : steps.slice(0, Math.max(0, player.index)).map((s) => s.nodeId);

  useEffect(() => {
    scrollIntoContainer(rowRef.current);
  }, [player.index]);

  const narration = isAll ? (
    <span>
      Followpos complete — {ruleNodeIds.length} rule nodes applied in {steps.length} updates. Every arrow i → j below means j ∈ followpos(i).
    </span>
  ) : isStart ? (
    <span>
      <b className="text-[#835400]">Start:</b> every followpos(i) is ∅. Walk the tree in post-order; each{' '}
      <b>cat-node</b> and <b>star/plus-node</b> adds arrows. Press <b>Next</b>.
    </span>
  ) : (
    <span>
      <b className="text-[#835400]">
        Rule {active!.ruleIndex + 1}/{active!.ruleCount} · {active!.title}:
      </b>{' '}
      {active!.source === null ? (
        active!.rule
      ) : (
        <>
          {active!.rule}
          {active!.fresh.length ? (
            <>
              {' '}
              → new arrows{' '}
              <b className="bg-[#ffddb5] px-1 rounded">
                {active!.fresh.map((j) => `${active!.source}→${j}`).join(', ')}
              </b>
            </>
          ) : (
            ' → already present, nothing new'
          )}
        </>
      )}
    </span>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 03"
        subtitle={parse.augmented}
        title="Build the Followpos Table"
        metrics={[
          { label: 'Rule', value: isAll ? `${ruleNodeIds.length} / ${ruleNodeIds.length}` : active ? `${active.ruleIndex + 1} / ${active.ruleCount}` : `0 / ${ruleNodeIds.length}` },
          { label: 'Arrows', value: Object.values(table).reduce((a, s) => a + s.length, 0), tone: 'amber' },
          { label: 'Status', value: player.isComplete ? 'Table Complete' : 'Building', tone: player.isComplete ? 'teal' : 'amber' },
        ]}
      />

      <PlaybackBar player={player} unitLabel="step" narration={narration} />

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${WORKSPACE_H}`}>
        {/* Canvas: tree (which rule) + followpos graph (what it adds) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col flex-[1.6] min-h-[280px] lg:min-h-0">
            <div className="px-3.5 py-1.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">account_tree</span>
                <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">Rule Node in the Tree</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F2A93B] inline-block"></span>current rule
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#006768] inline-block"></span>rule applied
                </span>
                <span className="text-[#3B6FD8] font-bold">{'{}'}</span>first
                <span className="text-[#E8603C] font-bold">{'{}'}</span>last
              </div>
            </div>
            <div className="flex-1 min-h-0 p-2 bg-[#FFFDF8] bg-dot-grid">
              <SyntaxTreeSvg
                root={parse.root!}
                nodes={parse.nodes}
                annotatedUpTo={parse.nodes.length}
                currentId={active?.nodeId}
                emphasizeIds={doneRuleIds}
                highlightPositions={active?.source != null ? [active.source] : []}
                dimOthers={!isAll}
                onSelectNode={(id) => {
                  const i = steps.findIndex((s) => s.nodeId === id);
                  if (i >= 0) player.setIndex(i + 1);
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col flex-1 min-h-[220px] lg:min-h-0">
            <div className="px-3.5 py-1.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">conversion_path</span>
                <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">Followpos Graph (i → j means j ∈ followpos(i))</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F2A93B] inline-block"></span>i being updated
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAF1FD] border border-[#3B6FD8] inline-block"></span>added set
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-[3px] bg-[#E08E0B] inline-block rounded"></span>new arrow
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-2 bg-[#FFFDF8] bg-dot-grid">
              <FollowposGraphSvg
                positions={parse.positions}
                followpos={table}
                source={active?.source ?? null}
                targets={active?.added ?? []}
                fresh={active?.fresh ?? []}
              />
            </div>
          </div>
        </div>

        {/* Side: rule card + table */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
          <div className="bg-white rounded-xl p-3.5 border border-[#DDD6C5] shadow-xs flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">
                {isAll ? 'All rules applied' : !active ? 'Two rules' : active.kind === 'cat' ? 'Cat-node rule' : `${active.kind === 'star' ? 'Star' : 'Plus'}-node rule`}
              </h2>
              {active && (
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-bold">
                  update {player.index}/{steps.length}
                </span>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-[#14161F] text-[#B8BBC8] font-mono text-[11px] leading-relaxed">
              {(!active || active.kind === 'cat') && (
                <div className={active ? '' : 'mb-1'}>
                  <span className="text-[#F2A93B] font-bold">cat</span> n = c1·c2: ∀ i ∈ <span className="text-[#F27F5E]">lastpos(c1)</span>, followpos(i) ∪={' '}
                  <span className="text-[#6A93F0]">firstpos(c2)</span>
                </div>
              )}
              {(!active || active.kind !== 'cat') && (
                <div>
                  <span className="text-[#F2A93B] font-bold">star</span> n = c1*: ∀ i ∈ <span className="text-[#F27F5E]">lastpos(n)</span>, followpos(i) ∪={' '}
                  <span className="text-[#6A93F0]">firstpos(n)</span>
                </div>
              )}
            </div>
            {active && (
              <div className="grid grid-cols-2 gap-2">
                <div className="px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 flex flex-col">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-500">{active.kind === 'cat' ? 'lastpos(c1)' : 'lastpos(n)'}</span>
                  <span className="font-mono text-sm font-bold text-[#E8603C]">
                    {active.sources.length === 0
                      ? '∅'
                      : active.sources.map((i, k) => (
                          <span key={i} className={i === active.source ? 'bg-[#F2A93B] text-[#14161F] px-1 rounded' : ''}>
                            {k === 0 ? '{' : ''}
                            {i}
                            {k === active.sources.length - 1 ? '}' : ','}
                          </span>
                        ))}
                  </span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 flex flex-col">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-500">{active.kind === 'cat' ? 'firstpos(c2)' : 'firstpos(n)'}</span>
                  <span className="font-mono text-sm font-bold text-[#3B6FD8]">{fmtSet(active.added)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col flex-1 min-h-[200px]">
            <div className="px-3.5 py-2 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">Followpos Table</h3>
              <span className="font-mono text-[11px] text-gray-500">{isAll ? 'final' : `after update ${player.index}`}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                    <th className="py-1.5 px-3">i</th>
                    <th className="py-1.5 px-3">sym</th>
                    <th className="py-1.5 px-3">followpos(i)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parse.positions.map((p) => {
                    const isSrc = active?.source === p.pos;
                    const fresh = isSrc ? active!.fresh : [];
                    const set = table[p.pos] || [];
                    return (
                      <tr key={p.pos} ref={isSrc ? rowRef : undefined} className={isSrc ? 'bg-[#FEF6E9]' : ''}>
                        <td className="py-1.5 px-3 font-bold text-[#835400]">{p.pos}</td>
                        <td className="py-1.5 px-3">
                          <span className={`px-1.5 rounded font-bold ${p.symbol === '#' ? 'bg-[#14161F] text-[#F2A93B]' : 'bg-gray-100 text-gray-900'}`}>{p.symbol}</span>
                        </td>
                        <td className="py-1.5 px-3">
                          {set.length === 0 ? (
                            <span className="text-gray-400">{p.symbol === '#' ? '∅ (accepting)' : '∅'}</span>
                          ) : (
                            <span className="flex items-center gap-1 flex-wrap">
                              {set.map((x) => (
                                <span
                                  key={x}
                                  className={`px-1.5 rounded font-bold transition-colors ${
                                    fresh.includes(x) ? 'bg-[#F2A93B] text-[#14161F]' : 'text-[#006768] bg-[#E6F4F4]'
                                  }`}
                                >
                                  {x}
                                </span>
                              ))}
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
        </div>
      </div>

      <StageNav backLabel="Back to Syntax Tree" onBack={onBack} nextLabel="Proceed to DFA Construction" onNext={onProceed} />
    </div>
  );
};

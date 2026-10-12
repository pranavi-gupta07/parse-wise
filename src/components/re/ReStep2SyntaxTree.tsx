import React, { useEffect, useRef } from 'react';
import { ReParseResult, DfaResult, fmtSet, nodeLabel, describeNode } from '../../utils/reToDfaEngine';
import { useStepPlayer } from './useStepPlayer';
import { PlaybackBar } from './PlaybackBar';
import { SyntaxTreeSvg, TreeLegend } from './SyntaxTreeSvg';
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

export const ReStep2SyntaxTree: React.FC<Props> = ({ parse, dfa, startInAll, globalViewMode, onBack, onProceed }) => {
  const steps = dfa.treeSteps;
  const player = useStepPlayer(steps.length, parse.augmented);
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const tapeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (startInAll || globalViewMode === 'all') player.showAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow the header's global Step-by-step / Show all toggle
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
  const active = steps[player.index];
  const node = parse.nodes[active.nodeId];
  const visibleRows = isAll ? parse.nodes : parse.nodes.slice(0, player.index + 1);

  useEffect(() => {
    scrollIntoContainer(rowRef.current);
    scrollIntoContainer(tapeRef.current, 'x');
  }, [player.index]);

  const narration = isAll ? (
    <span>
      Tree complete: {parse.nodes.length} nodes built from postfix <b>{parse.postfix}</b>. Root: firstpos ={' '}
      <b className="text-[#3B6FD8]">{fmtSet(parse.root!.firstpos)}</b>, lastpos = <b className="text-[#E8603C]">{fmtSet(parse.root!.lastpos)}</b>.
    </span>
  ) : (
    <span>
      <b className="text-[#835400]">Step {player.index + 1}:</b> {active.action}. Then{' '}
      <span className="text-[#8E5BD9] font-bold">nullable={String(node.nullable)}</span>,{' '}
      <span className="text-[#3B6FD8] font-bold">firstpos={fmtSet(node.firstpos)}</span>,{' '}
      <span className="text-[#E8603C] font-bold">lastpos={fmtSet(node.lastpos)}</span>.
    </span>
  );

  // the postfix tape: one token per node (post-order == postfix order)
  const tokens = steps.map((s) => s.token);
  const stackIds = isAll ? [parse.root!.id] : active.stack;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 02"
        subtitle={parse.augmented}
        title="Build the Syntax Tree"
        metrics={[
          { label: 'Built', value: `${isAll ? parse.nodes.length : player.index + 1} / ${parse.nodes.length}` },
          { label: 'Positions', value: parse.positions.length, tone: 'amber' },
          { label: 'Status', value: player.isComplete ? 'Tree Complete' : 'Building', tone: player.isComplete ? 'teal' : 'amber' },
        ]}
      />

      <PlaybackBar player={player} unitLabel="node" narration={narration} />

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${WORKSPACE_H}`}>
        {/* Canvas */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col min-h-[420px] lg:min-h-0">
          <div className="px-3.5 py-2 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">account_tree</span>
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">Syntax Tree (built bottom-up from postfix)</h3>
            </div>
            <TreeLegend />
          </div>

          {/* Postfix tape + build stack */}
          <div className="px-3.5 py-2 border-b border-gray-100 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-500 w-14 shrink-0">Postfix</span>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {tokens.map((t, i) => {
                  const done = isAll || i < player.index;
                  const cur = !isAll && i === player.index;
                  return (
                    <span
                      key={i}
                      ref={cur ? tapeRef : undefined}
                      onClick={() => player.setIndex(i)}
                      className={`px-2 py-0.5 rounded font-mono text-xs font-bold border cursor-pointer shrink-0 ${
                        cur
                          ? 'bg-[#F2A93B] border-[#E08E0B] text-[#14161F]'
                          : done
                          ? 'bg-[#E6F4F4] border-[#BFE3E3] text-[#006768]'
                          : t === '#'
                          ? 'bg-[#14161F] border-[#14161F] text-[#F2A93B]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-500 w-14 shrink-0">Stack</span>
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="font-mono text-[10px] text-gray-400 shrink-0">bottom</span>
                {stackIds.map((id, i) => {
                  const n = parse.nodes[id];
                  const top = i === stackIds.length - 1;
                  return (
                    <span
                      key={id}
                      title={describeNode(n)}
                      className={`px-2 py-0.5 rounded font-mono text-xs font-bold shrink-0 ${
                        top && !isAll ? 'bg-[#F2A93B] text-[#14161F]' : 'bg-[#14161F] text-[#8FF3F4]'
                      }`}
                    >
                      {nodeLabel(n)}
                      {n.pos !== undefined && <sub className="ml-0.5">{n.pos}</sub>}
                    </span>
                  );
                })}
                <span className="font-mono text-[10px] text-gray-400 shrink-0">top</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-3 bg-[#FFFDF8] bg-dot-grid">
            <SyntaxTreeSvg
              root={parse.root!}
              nodes={parse.nodes}
              builtUpTo={player.index}
              annotatedUpTo={player.index}
              stackIds={isAll ? [] : active.stack}
              currentId={isAll ? undefined : active.nodeId}
              onSelectNode={(id) => player.setIndex(id)}
            />
          </div>
        </div>

        {/* Side panel: current node + ledger */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
          <div className="bg-white rounded-xl p-3.5 border border-[#DDD6C5] shadow-xs flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#F2A93B] border-2 border-[#835400] flex items-center justify-center font-mono text-base font-extrabold text-[#14161F] shrink-0">
                {nodeLabel(node)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-gray-900 truncate">{describeNode(node)}</span>
                <span className="font-mono text-[11px] text-gray-500">
                  {node.left ? `c1 = ${nodeLabel(node.left)}${node.right ? `, c2 = ${nodeLabel(node.right)}` : ''}` : 'leaf node'}
                </span>
              </div>
            </div>
            {[
              { k: 'nullable', v: String(node.nullable), rule: active.nullableRule, color: 'text-[#8E5BD9] bg-purple-50 border-purple-200' },
              { k: 'firstpos', v: fmtSet(node.firstpos), rule: active.firstposRule, color: 'text-[#3B6FD8] bg-blue-50 border-blue-200' },
              { k: 'lastpos', v: fmtSet(node.lastpos), rule: active.lastposRule, color: 'text-[#E8603C] bg-orange-50 border-orange-200' },
            ].map((r) => (
              <div key={r.k} className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-500 tracking-wider">{r.k}(n)</span>
                  <span className={`font-mono text-xs font-bold px-2 rounded border ${r.color}`}>{r.v}</span>
                </div>
                <span className="font-mono text-[11px] text-gray-700 leading-snug">{r.rule}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col flex-1 min-h-[200px]">
            <div className="px-3.5 py-2 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">Node Ledger</h3>
              <span className="font-mono text-[11px] text-gray-500">
                {visibleRows.length}/{parse.nodes.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                    <th className="py-1.5 px-2">#</th>
                    <th className="py-1.5 px-2">Node</th>
                    <th className="py-1.5 px-2 text-center">null</th>
                    <th className="py-1.5 px-2">first</th>
                    <th className="py-1.5 px-2">last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.map((n) => {
                    const sel = !isAll && n.id === active.nodeId;
                    return (
                      <tr
                        key={n.id}
                        ref={sel ? rowRef : undefined}
                        onClick={() => player.setIndex(n.id)}
                        className={`cursor-pointer ${sel ? 'bg-[#ffddb5] text-[#835400] font-bold' : 'hover:bg-gray-50 text-gray-800'}`}
                      >
                        <td className="py-1.5 px-2 text-gray-500">{String(n.id + 1).padStart(2, '0')}</td>
                        <td className="py-1.5 px-2 font-bold">
                          {nodeLabel(n)}
                          {n.pos !== undefined && <sub className="text-[#835400] ml-0.5">{n.pos}</sub>}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={n.nullable ? 'text-[#8E5BD9] font-bold' : 'text-gray-400'}>{n.nullable ? 'T' : 'F'}</span>
                        </td>
                        <td className="py-1.5 px-2 text-[#3B6FD8] font-bold">{fmtSet(n.firstpos)}</td>
                        <td className="py-1.5 px-2 text-[#E8603C] font-bold">{fmtSet(n.lastpos)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <StageNav backLabel="Back to Regular Expression" onBack={onBack} nextLabel="Proceed to Followpos" onNext={onProceed} />
    </div>
  );
};

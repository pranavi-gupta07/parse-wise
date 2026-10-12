import React, { useEffect, useRef } from 'react';
import { ReParseResult, DfaResult, fmtSet, nodeLabel, describeNode } from '../../utils/reToDfaEngine';
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

export const ReStep2SyntaxTree: React.FC<Props> = ({ parse, dfa, startInAll, globalViewMode, onBack, onProceed }) => {
  const steps = dfa.treeSteps;
  const player = useStepPlayer(steps.length, parse.augmented);
  const rowRef = useRef<HTMLTableRowElement | null>(null);

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

  const active = steps[player.index];
  const node = parse.nodes[active.nodeId];
  const visibleRows = player.viewMode === 'all' ? parse.nodes : parse.nodes.slice(0, player.index + 1);

  useEffect(() => {
    rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [player.index]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 02 · Syntax Tree"
        subtitle={parse.augmented}
        title="Syntax Tree & Position Functions"
        description="Nodes are visited in post-order (children before parent) to compute nullable, firstpos and lastpos."
        metrics={[
          { label: 'Nodes', value: parse.nodes.length },
          { label: 'Positions', value: parse.positions.length, tone: 'amber' },
          { label: 'firstpos(root)', value: fmtSet(parse.root!.firstpos) },
        ]}
      />

      <PlaybackBar player={player} unitLabel="node" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tree canvas */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">account_tree</span>
              <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Annotated Syntax Tree</h3>
            </div>
            <TreeLegend />
          </div>
          <div className="p-4 bg-[#FFFDF8] bg-dot-grid">
            <SyntaxTreeSvg
              root={parse.root!}
              nodes={parse.nodes}
              annotatedUpTo={player.index}
              currentId={player.viewMode === 'all' ? undefined : active.nodeId}
              onSelectNode={(id) => player.setIndex(id)}
            />
          </div>
          <div className="px-4 py-2 border-t border-gray-100 font-mono text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            Click any node to jump to its computation.
          </div>
        </div>

        {/* Current computation */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-xs flex flex-col gap-3.5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffddb5]/50 rotate-45 pointer-events-none"></div>
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[20px]">functions</span>
                <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">
                  {player.viewMode === 'all' ? 'Root Node' : 'Current Node'}
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-bold">
                {player.viewMode === 'all' ? 'complete' : `post-order #${player.index + 1}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#F2A93B] border-2 border-[#835400] flex items-center justify-center font-mono text-lg font-extrabold text-[#14161F] shrink-0">
                {nodeLabel(node)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-900">{describeNode(node)}</span>
                {node.left && (
                  <span className="font-mono text-[11px] text-gray-500">
                    c1 = {nodeLabel(node.left)}
                    {node.right ? `  ·  c2 = ${nodeLabel(node.right)}` : ''}
                  </span>
                )}
              </div>
            </div>

            {[
              { k: 'nullable', v: String(node.nullable), rule: active.nullableRule, color: 'text-[#8E5BD9] bg-purple-50 border-purple-200' },
              { k: 'firstpos', v: fmtSet(node.firstpos), rule: active.firstposRule, color: 'text-[#3B6FD8] bg-blue-50 border-blue-200' },
              { k: 'lastpos', v: fmtSet(node.lastpos), rule: active.lastposRule, color: 'text-[#E8603C] bg-orange-50 border-orange-200' },
            ].map((r) => (
              <div key={r.k} className="flex flex-col gap-1 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase font-bold text-gray-500 tracking-wider">{r.k}(n)</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${r.color}`}>{r.v}</span>
                </div>
                <span className="font-mono text-[11px] text-gray-700 leading-relaxed">{r.rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Node ledger */}
      <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
        <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-800 text-[18px]">table_rows</span>
            <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Node Computation Ledger</h3>
          </div>
          <span className="font-mono text-xs text-gray-500">
            {player.viewMode === 'step' ? `Showing ${visibleRows.length} of ${parse.nodes.length} nodes` : 'Showing all nodes'}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Node</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">nullable</th>
                <th className="py-2.5 px-3">firstpos</th>
                <th className="py-2.5 px-3">lastpos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRows.map((n) => {
                const sel = player.viewMode === 'step' && n.id === active.nodeId;
                return (
                  <tr
                    key={n.id}
                    ref={sel ? rowRef : undefined}
                    onClick={() => player.setIndex(n.id)}
                    className={`cursor-pointer transition-colors ${sel ? 'bg-[#ffddb5] text-[#835400] font-bold' : 'hover:bg-gray-50 text-gray-800'}`}
                  >
                    <td className="py-2 px-3 text-gray-500 font-bold">{String(n.id + 1).padStart(2, '0')}</td>
                    <td className="py-2 px-3 font-bold">
                      {nodeLabel(n)}
                      {n.pos !== undefined && <sub className="text-[#835400] ml-0.5">{n.pos}</sub>}
                    </td>
                    <td className="py-2 px-3">{describeNode(n)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 rounded font-bold ${n.nullable ? 'text-[#8E5BD9] bg-purple-50' : 'text-gray-500 bg-gray-100'}`}>
                        {n.nullable ? 'true' : 'false'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#3B6FD8] font-bold">{fmtSet(n.firstpos)}</td>
                    <td className="py-2 px-3 text-[#E8603C] font-bold">{fmtSet(n.lastpos)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {player.viewMode === 'step' && visibleRows.length < parse.nodes.length && (
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F2A93B] animate-pulse"></span>
              <span>+ {parse.nodes.length - visibleRows.length} more node(s) pending...</span>
            </span>
            <span className="text-gray-400">Click Next to step through</span>
          </div>
        )}
      </div>

      <StageNav backLabel="Back to Regular Expression" onBack={onBack} nextLabel="Proceed to Followpos" onNext={onProceed} />
    </div>
  );
};

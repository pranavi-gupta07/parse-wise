import React, { useEffect, useMemo, useState } from 'react';
import { ReParseResult, DfaResult, fmtSet, simulateDfa, RE_PRESETS } from '../../utils/reToDfaEngine';
import { useStepPlayer } from './useStepPlayer';
import { PlaybackBar } from './PlaybackBar';
import { DfaGraphSvg, DfaLegend } from './DfaGraphSvg';
import { StageHeader, StageNav, WORKSPACE_H } from './StageHeader';
import { scrollIntoContainer } from './scrollIntoContainer';

interface Props {
  parse: ReParseResult;
  dfa: DfaResult;
  startInAll?: boolean;
  globalViewMode?: 'step' | 'all';
  onBack: () => void;
}

export const ReStep4Dfa: React.FC<Props> = ({ parse, dfa, startInAll, globalViewMode, onBack }) => {
  const steps = dfa.dfaSteps;
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
  const shownStates = isAll ? dfa.states : active.statesSoFar;
  const shownTrans = isAll ? dfa.transitions : active.transitionsSoFar;
  const marked = isAll ? dfa.states.map((s) => s.name) : active.markedSoFar;
  const cellStep = useMemo(() => {
    const m: Record<string, number> = {};
    steps.forEach((st) => {
      if (st.kind === 'transition') m[`${st.from}|${st.symbol}`] = st.index;
    });
    return m;
  }, [steps]);
  const symOf = useMemo(() => Object.fromEntries(parse.positions.map((p) => [p.pos, p.symbol])), [parse.positions]);

  // ── string simulation ──
  const preset = RE_PRESETS.find((p) => p.regex === parse.cleaned);
  const [testStr, setTestStr] = useState<string>(preset?.sampleAccept ?? '');
  const [simIdx, setSimIdx] = useState(0);
  useEffect(() => {
    setTestStr(preset?.sampleAccept ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parse.augmented]);
  const sim = useMemo(() => simulateDfa(dfa, testStr), [dfa, testStr]);
  useEffect(() => setSimIdx(0), [sim]);
  const simStep = sim.steps[Math.min(simIdx, sim.steps.length - 1)];
  const simDone = simIdx >= sim.steps.length - 1;
  const showSim = player.isComplete;

  // right-panel tabs; jump to the tester when construction finishes
  const [tab, setTab] = useState<'dstates' | 'dtran' | 'test'>('dstates');
  useEffect(() => {
    if (player.isComplete) setTab('test');
    else setTab((t) => (t === 'test' ? 'dstates' : t));
  }, [player.isComplete]);
  const simRowRef = React.useRef<HTMLTableRowElement | null>(null);
  useEffect(() => scrollIntoContainer(simRowRef.current), [simIdx]);

  const highlightEdge =
    !showSim && active.kind === 'transition' && active.from && active.symbol
      ? { from: active.from, symbol: active.symbol, to: active.target }
      : showSim && simStep.symbol && simIdx > 0
      ? { from: sim.steps[simIdx - 1].state!, symbol: simStep.symbol, to: simStep.next ?? undefined }
      : undefined;

  const handleExportJson = () => {
    const data = {
      regex: parse.cleaned,
      augmented: parse.augmented,
      alphabet: dfa.alphabet,
      start: dfa.start,
      accepting: dfa.accepting,
      deadState: dfa.deadState,
      states: dfa.states,
      transitions: dfa.transitions,
      followpos: dfa.followpos,
    };
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = `parsewise_dfa_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const curState = !isAll && active.kind === 'transition' ? shownStates.find((x) => x.name === active.from) : undefined;
  const isDeadTarget = active.kind === 'transition' && !!dfa.deadState && active.target === dfa.deadState;

  const narration = showSim ? (
    simIdx === 0 ? (
      <span>
        <b className="text-[#006768]">DFA complete</b> — {dfa.states.length} states, start <b>{dfa.start}</b>, accepting <b>{dfa.accepting.join(', ') || '—'}</b>. Test a
        string in the <b>Test string</b> tab; the active state lights up on the graph.
      </span>
    ) : (
      <span>
        <b className="text-[#835400]">Simulating:</b> {simStep.note}
        {simDone && (sim.accepted ? <b className="text-[#2E9E6B]"> → ACCEPT</b> : <b className="text-red-700"> → REJECT</b>)}
      </span>
    )
  ) : active.kind === 'start' ? (
    <span>
      <b className="text-[#835400]">Step 1:</b> {active.explanation}
    </span>
  ) : (
    <span>
      <b className="text-[#835400]">
        Step {player.index + 1} · Dtran[{active.from}, {active.symbol}]:
      </b>{' '}
      {active.explanation}
    </span>
  );

  const tabBtn = (id: typeof tab, label: string, disabled = false) => (
    <button
      key={id}
      onClick={() => !disabled && setTab(id)}
      disabled={disabled}
      title={disabled ? 'Finish construction first' : undefined}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        tab === id ? 'bg-[#006768] text-white shadow-xs' : disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 cursor-pointer'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 04"
        subtitle={parse.augmented}
        title="Construct the DFA"
        metrics={[
          { label: 'States', value: shownStates.length },
          { label: 'Σ', value: `{${dfa.alphabet.join(', ')}}`, tone: 'amber' },
          { label: 'Status', value: player.isComplete ? 'DFA Complete' : 'Constructing', tone: player.isComplete ? 'teal' : 'amber' },
        ]}
      />

      <PlaybackBar player={player} unitLabel="step" narration={narration} />

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${WORKSPACE_H}`}>
        {/* Graph */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col min-h-[360px] lg:min-h-0">
          <div className="px-3.5 py-2 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">hub</span>
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">{showSim ? 'Final DFA' : 'DFA Under Construction'}</h3>
            </div>
            <DfaLegend />
          </div>
          <div className="flex-1 min-h-0 p-3 bg-[#FFFDF8] bg-dot-grid">
            <DfaGraphSvg
              layoutStates={dfa.states}
              layoutTransitions={dfa.transitions}
              start={dfa.start}
              states={shownStates}
              transitions={shownTrans}
              processing={!showSim && active.kind === 'transition' ? active.from : undefined}
              newState={!showSim && active.isNew ? active.target : undefined}
              activeEdge={highlightEdge}
              activeState={showSim ? simStep.state : undefined}
              deadHighlight={!showSim && isDeadTarget}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
          {/* current computation */}
          <div className="bg-white rounded-xl p-3.5 border border-[#DDD6C5] shadow-xs flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">
                {isAll || showSim ? 'Construction complete' : active.kind === 'start' ? 'Initial state' : `Dtran[${active.from}, ${active.symbol}]`}
              </h2>
              {!showSim && active.kind === 'transition' && (
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                    isDeadTarget ? 'bg-red-100 text-red-700' : active.isNew ? 'bg-[#ffddb5] text-[#835400]' : 'bg-[#E6F4F4] text-[#006768]'
                  }`}
                >
                  {isDeadTarget
                    ? active.isNew
                      ? `new trap state ${active.target}`
                      : `→ ${active.target} (dead)`
                    : active.isNew
                    ? `new state ${active.target}`
                    : `→ ${active.target}`}
                </span>
              )}
            </div>
            {showSim ? (
              <p className="text-xs text-gray-700 leading-relaxed">
                Start <b className="font-mono">{dfa.start}</b> = firstpos(root). Accepting: <b className="font-mono">{dfa.accepting.join(', ') || '—'}</b> (contain
                position <b className="font-mono">{parse.endPos}</b>, the #).
                {dfa.deadState &&
                  ` Every (state, symbol) pair whose position union is empty goes to the trap state ${dfa.deadState}, so δ is a total function — a complete DFA.`}
              </p>
            ) : active.kind === 'start' ? (
              <div className="font-mono text-xs text-gray-700">
                firstpos(root) = <b className="text-[#835400] bg-[#ffddb5] px-1 rounded">{fmtSet(active.union)}</b> → state <b>{active.target}</b>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center flex-wrap gap-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-gray-500 mr-1">{active.from} =</span>
                  {curState?.positions.map((p) => {
                    const hit = active.contributing.includes(p);
                    return (
                      <span
                        key={p}
                        className={`px-1.5 py-0.5 rounded font-mono text-xs border ${
                          hit ? 'bg-[#F2A93B] border-[#E08E0B] text-[#14161F] font-bold' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        {p}
                        <sub className="ml-0.5">{symOf[p]}</sub>
                      </span>
                    );
                  })}
                </div>
                {active.contributing.length > 0 ? (
                  <div className="font-mono text-[11px] text-gray-700 leading-relaxed">
                    {active.contributing.map((p) => `followpos(${p})`).join(' ∪ ')} ={' '}
                    {active.contributing.map((p) => fmtSet(dfa.followpos[p])).join(' ∪ ')} ={' '}
                    <b className="text-[#835400] bg-[#ffddb5] px-1 rounded">{fmtSet(active.union)}</b>
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-red-700">
                    no position in {active.from} is labelled '{active.symbol}' → U = ∅ → {dfa.deadState ?? '∅'} (trap state)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* tabs */}
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col flex-1 min-h-[260px]">
            <div className="px-2 py-1.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between gap-2">
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-gray-200">
                {tabBtn('dstates', `Dstates (${shownStates.length})`)}
                {tabBtn('dtran', 'Dtran table')}
                {tabBtn('test', 'Test string', !player.isComplete)}
              </div>
              <button
                onClick={handleExportJson}
                className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-[#DDD6C5] flex items-center cursor-pointer"
                title="Export DFA (.json)"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tab === 'dstates' && (
                <div className="p-2.5 flex flex-col gap-1.5">
                  {shownStates.map((st) => {
                    const isMarked = marked.includes(st.name);
                    const isProc = !isAll && !player.isComplete && st.name === active.from;
                    const isNew = !isAll && !player.isComplete && active.isNew && st.name === active.target;
                    return (
                      <div
                        key={st.name}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border font-mono text-xs ${
                          isNew
                            ? 'bg-[#ffddb5] border-[#F2A93B]'
                            : isProc
                            ? 'bg-[#E6F4F4] border-[#BFE3E3]'
                            : st.dead
                            ? 'bg-gray-100 border-dashed border-gray-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 bg-white ${
                            st.dead
                              ? 'border-2 border-dashed border-gray-400 text-gray-500'
                              : st.accepting
                              ? 'border-[3px] border-double border-[#006768] text-[#006768]'
                              : 'border-2 border-[#006768] text-[#006768]'
                          }`}
                        >
                          {st.name}
                        </span>
                        <span className="text-gray-800 font-semibold">{fmtSet(st.positions)}</span>
                        <span className="ml-auto flex items-center gap-1.5">
                          {st.name === dfa.start && <span className="px-1.5 rounded bg-[#006768] text-white text-[10px] font-bold">START</span>}
                          {st.accepting && <span className="px-1.5 rounded bg-emerald-100 text-[#006768] text-[10px] font-bold">ACCEPT</span>}
                          {st.dead && <span className="px-1.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">DEAD</span>}
                          <span className={isMarked ? 'text-[#006768] font-bold' : 'text-gray-400'} title={isProc ? 'processing' : isMarked ? 'marked' : 'unmarked'}>
                            {isProc ? '◐' : isMarked ? '✓' : '○'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  <div className="font-mono text-[10px] text-gray-500 pt-1">
                    ✓ marked · ◐ processing · ○ unmarked (waiting)
                    {dfa.deadState && ` · ${dfa.deadState} = trap state (empty position set, never accepts)`}
                  </div>
                </div>
              )}

              {tab === 'dtran' && (
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                      <th className="py-1.5 px-3">State</th>
                      {dfa.alphabet.map((a) => (
                        <th key={a} className="py-1.5 px-3 text-center normal-case">
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shownStates.map((st) => (
                      <tr
                        key={st.name}
                        className={
                          !isAll && !player.isComplete && st.name === active.from
                            ? 'bg-[#E6F4F4]/60'
                            : st.dead
                            ? 'bg-gray-50 text-gray-500'
                            : ''
                        }
                      >
                        <td className="py-1.5 px-3 font-bold text-gray-900 whitespace-nowrap">
                          {st.name === dfa.start && <span className="text-[#006768] mr-1">→</span>}
                          {st.name}
                          {st.accepting && <span className="text-[#006768] ml-0.5">*</span>}
                          <span className="ml-2 font-normal text-gray-400">{fmtSet(st.positions)}</span>
                        </td>
                        {dfa.alphabet.map((a) => {
                          const t = shownTrans[st.name]?.[a];
                          const isCur = !isAll && !showSim && active.kind === 'transition' && active.from === st.name && active.symbol === a;
                          const k = cellStep[`${st.name}|${a}`];
                          const computedYet = isAll || (k !== undefined && k <= player.index);
                          return (
                            <td key={a} className="py-1.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isCur ? (t ? 'bg-[#F2A93B] text-[#14161F]' : 'bg-red-100 text-red-700') : t ? 'bg-[#E6F4F4] text-[#006768]' : 'text-gray-400'
                                }`}
                              >
                                {t ?? (computedYet ? '—' : '·')}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'test' && (
                <div className="p-3 flex flex-col gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-mono text-sm">w =</div>
                    <input
                      type="text"
                      value={testStr}
                      onChange={(e) => setTestStr(e.target.value)}
                      placeholder={`over {${dfa.alphabet.join(', ')}} (empty = ε)`}
                      spellCheck="false"
                      className="w-full pl-11 pr-3 py-1.5 bg-gray-50 text-gray-900 font-mono text-sm rounded-lg border border-[#DDD6C5] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006768]"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => setSimIdx(0)} className="p-1 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-[#DDD6C5] cursor-pointer" title="Restart">
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    </button>
                    <button
                      onClick={() => setSimIdx((i) => Math.max(0, i - 1))}
                      disabled={simIdx === 0}
                      className="px-2 py-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-800 rounded-lg border border-[#DDD6C5] text-xs font-medium cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setSimIdx((i) => Math.min(sim.steps.length - 1, i + 1))}
                      disabled={simDone}
                      className="px-2.5 py-1 bg-[#006768] hover:bg-[#004f51] text-white font-semibold text-xs rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      Next symbol
                    </button>
                    <button onClick={() => setSimIdx(sim.steps.length - 1)} className="px-2 py-1 bg-white hover:bg-gray-50 text-gray-800 rounded-lg border border-[#DDD6C5] text-xs font-medium cursor-pointer">
                      Run all
                    </button>
                    {preset && (
                      <span className="ml-auto flex items-center gap-1">
                        {preset.sampleAccept && (
                          <button onClick={() => setTestStr(preset.sampleAccept!)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[#006768] font-mono text-xs cursor-pointer">
                            {preset.sampleAccept}
                          </button>
                        )}
                        {preset.sampleReject && (
                          <button onClick={() => setTestStr(preset.sampleReject!)} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs cursor-pointer">
                            {preset.sampleReject}
                          </button>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap font-mono text-sm p-2 rounded-lg bg-[#F6F2EA] border border-[#DDD6C5]">
                    {testStr.replace(/\s+/g, '').length === 0 ? (
                      <span className="text-gray-500 text-xs">ε (empty string)</span>
                    ) : (
                      testStr
                        .replace(/\s+/g, '')
                        .split('')
                        .map((ch, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded font-bold border ${
                              i < simIdx - 1 ? 'bg-white text-gray-400 border-gray-200' : i === simIdx - 1 ? 'bg-[#F2A93B] text-[#14161F] border-[#E08E0B]' : 'bg-white text-gray-900 border-gray-300'
                            }`}
                          >
                            {ch}
                          </span>
                        ))
                    )}
                    <span className="ml-auto text-xs text-gray-600">
                      state: <b className="text-[#006768]">{simStep.state ?? '∅'}</b>
                    </span>
                  </div>

                  {simDone && (
                    <div
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
                        sim.accepted ? 'bg-[#E5F7EC] border-[#2E9E6B]/30 text-[#14532D]' : 'bg-[#ffdad6] border-[#ba1a1a]/30 text-[#93000a]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{sim.accepted ? 'check_circle' : 'cancel'}</span>
                      {sim.accepted
                        ? `ACCEPT — ends in accepting state ${simStep.state}`
                        : simStep.state
                        ? `REJECT — ends in non-accepting state ${simStep.state}`
                        : `REJECT — ${simStep.note}`}
                    </div>
                  )}

                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                        <th className="py-1 px-2">#</th>
                        <th className="py-1 px-2">read</th>
                        <th className="py-1 px-2">state</th>
                        <th className="py-1 px-2">note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sim.steps.slice(0, simIdx + 1).map((st) => (
                        <tr
                          key={st.index}
                          ref={st.index === simIdx ? simRowRef : undefined}
                          onClick={() => setSimIdx(st.index)}
                          className={`cursor-pointer ${st.index === simIdx ? 'bg-[#ffddb5] text-[#835400] font-bold' : 'hover:bg-gray-50 text-gray-800'}`}
                        >
                          <td className="py-1 px-2">{st.index}</td>
                          <td className="py-1 px-2">{st.symbol ?? '—'}</td>
                          <td className="py-1 px-2">{st.state ?? '∅'}</td>
                          <td className="py-1 px-2">{st.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StageNav backLabel="Back to Followpos" onBack={onBack} />
    </div>
  );
};

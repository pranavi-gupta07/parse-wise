import React, { useEffect, useMemo, useState } from 'react';
import { ReParseResult, DfaResult, fmtSet, simulateDfa, RE_PRESETS } from '../../utils/reToDfaEngine';
import { useStepPlayer } from './useStepPlayer';
import { PlaybackBar } from './PlaybackBar';
import { DfaGraphSvg, DfaLegend } from './DfaGraphSvg';
import { StageHeader, StageNav } from './StageHeader';

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
  useEffect(() => setSimIdx(sim.steps.length - 1), [sim]);
  const simStep = sim.steps[Math.min(simIdx, sim.steps.length - 1)];
  const simDone = simIdx >= sim.steps.length - 1;
  const showSim = player.isComplete;

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans'] select-none">
      <StageHeader
        stage="Stage 04 · DFA"
        subtitle={parse.augmented}
        title="DFA Construction (Dstates & Dtran)"
        description="Start from firstpos(root). For each unmarked state S and symbol a, the next state is the union of followpos(p) for all p in S labelled a."
        metrics={[
          { label: 'States', value: `${shownStates.length}${!isAll && !player.isComplete ? ` / ${dfa.states.length}` : ''}` },
          { label: 'Σ', value: `{${dfa.alphabet.join(', ')}}`, tone: 'amber' },
          { label: 'Status', value: player.isComplete ? 'DFA Complete' : 'Constructing', tone: player.isComplete ? 'teal' : 'amber' },
        ]}
      />

      <PlaybackBar player={player} unitLabel="transition" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Graph */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">hub</span>
              <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                {showSim ? 'Final DFA' : 'DFA Under Construction'}
              </h3>
            </div>
            <DfaLegend />
          </div>
          <div className="p-4 bg-[#FFFDF8] bg-dot-grid min-h-[300px] flex items-center">
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
              deadHighlight={!showSim && active.kind === 'transition' && !active.target}
            />
          </div>
        </div>

        {/* Explanation + Dstates */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffddb5]/50 rotate-45 pointer-events-none"></div>
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[20px]">psychology</span>
                <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">
                  {isAll ? 'Construction Complete' : active.kind === 'start' ? 'Initial State' : `Dtran[${active.from}, ${active.symbol}]`}
                </h2>
              </div>
              {!isAll && active.kind === 'transition' && (
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                    !active.target ? 'bg-red-100 text-red-700' : active.isNew ? 'bg-[#ffddb5] text-[#835400]' : 'bg-[#E6F4F4] text-[#006768]'
                  }`}
                >
                  {!active.target ? 'no transition' : active.isNew ? 'new state' : 'existing state'}
                </span>
              )}
            </div>

            {isAll ? (
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                All {dfa.states.length} states are marked. Start state <b className="font-mono">{dfa.start}</b>, accepting state
                {dfa.accepting.length === 1 ? '' : 's'} <b className="font-mono">{dfa.accepting.join(', ') || '—'}</b> (each contains position{' '}
                <b className="font-mono">{parse.endPos}</b>, the <b className="font-mono">#</b>).
                {dfa.hasDeadTransitions && ' Missing entries in Dtran go to an implicit dead state.'}
              </p>
            ) : (
              <>
                {active.kind === 'transition' && active.from && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] uppercase text-gray-500 font-bold tracking-wider">
                      Positions in {active.from} labelled '{active.symbol}'
                    </span>
                    <div className="flex items-center flex-wrap gap-1">
                      {shownStates
                        .find((s) => s.name === active.from)!
                        .positions.map((p) => {
                          const hit = active.contributing.includes(p);
                          return (
                            <span
                              key={p}
                              className={`px-2 py-0.5 rounded font-mono text-xs border ${
                                hit ? 'bg-[#F2A93B] border-[#E08E0B] text-[#14161F] font-bold' : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}
                            >
                              {p}
                              <sub className="ml-0.5">{symOf[p]}</sub>
                            </span>
                          );
                        })}
                    </div>
                    {active.contributing.length > 0 && (
                      <div className="font-mono text-[11px] text-gray-700 flex flex-col gap-0.5 pt-1">
                        {active.contributing.map((p) => (
                          <span key={p}>
                            followpos({p}) = <b className="text-[#006768]">{fmtSet(dfa.followpos[p])}</b>
                          </span>
                        ))}
                        <span className="pt-0.5">
                          U = <b className="text-[#835400] bg-[#ffddb5] px-1 rounded">{fmtSet(active.union)}</b>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-700 font-mono leading-relaxed p-2.5 rounded-lg bg-gray-50 border border-gray-200">{active.explanation}</p>
              </>
            )}
          </div>

          <div className="w-full bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#F2A93B] text-[18px]">inventory_2</span>
                Dstates
              </h3>
              <span className="font-mono text-[10px] text-gray-500">✓ marked · ○ unmarked</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
              {shownStates.map((s) => {
                const isMarked = marked.includes(s.name);
                const isProc = !isAll && !player.isComplete && s.name === active.from;
                const isNew = !isAll && active.isNew && s.name === active.target;
                return (
                  <div
                    key={s.name}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border font-mono text-xs ${
                      isNew ? 'bg-[#ffddb5] border-[#F2A93B]' : isProc ? 'bg-[#E6F4F4] border-[#BFE3E3]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        s.accepting ? 'border-[3px] border-double border-[#006768] text-[#006768] bg-white' : 'border-2 border-[#006768] text-[#006768] bg-white'
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="text-gray-800 font-semibold">{fmtSet(s.positions)}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      {s.name === dfa.start && <span className="px-1.5 rounded bg-[#006768] text-white text-[10px] font-bold">START</span>}
                      {s.accepting && <span className="px-1.5 rounded bg-emerald-100 text-[#006768] text-[10px] font-bold">ACCEPT</span>}
                      <span className={isMarked ? 'text-[#006768] font-bold' : 'text-gray-400'}>{isProc ? '◐' : isMarked ? '✓' : '○'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Transition table */}
      <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
        <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-800 text-[18px]">grid_on</span>
            <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Transition Table (Dtran)</h3>
          </div>
          <span className="font-mono text-xs text-gray-500">— = no transition (dead)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] tracking-wider border-b border-gray-200">
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Positions</th>
                {dfa.alphabet.map((a) => (
                  <th key={a} className="py-2.5 px-4 text-center normal-case">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shownStates.map((s) => (
                <tr key={s.name} className={!isAll && s.name === active.from ? 'bg-[#E6F4F4]/60' : ''}>
                  <td className="py-2 px-4 font-bold text-gray-900 whitespace-nowrap">
                    {s.name === dfa.start && <span className="text-[#006768] mr-1">→</span>}
                    {s.name}
                    {s.accepting && <span className="text-[#006768] ml-1">*</span>}
                  </td>
                  <td className="py-2 px-4 text-gray-500">{fmtSet(s.positions)}</td>
                  {dfa.alphabet.map((a) => {
                    const t = shownTrans[s.name]?.[a];
                    const isCur = !isAll && !showSim && active.kind === 'transition' && active.from === s.name && active.symbol === a;
                    const k = cellStep[`${s.name}|${a}`];
                    const computedYet = isAll || (k !== undefined && k <= player.index);
                    return (
                      <td key={a} className="py-2 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            isCur
                              ? t
                                ? 'bg-[#F2A93B] text-[#14161F]'
                                : 'bg-red-100 text-red-700'
                              : t
                              ? 'bg-[#E6F4F4] text-[#006768]'
                              : 'text-gray-400'
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
        </div>
      </div>

      {/* String tester */}
      {player.isComplete ? (
        <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 md:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006768] text-[20px]">play_circle</span>
              <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">Test a String on the DFA</h2>
            </div>
            <span className="font-mono text-[11px] text-gray-500">The active state is highlighted on the graph above.</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-sm">w =</div>
              <input
                type="text"
                value={testStr}
                onChange={(e) => setTestStr(e.target.value)}
                placeholder={`string over {${dfa.alphabet.join(', ')}} (empty = ε)`}
                spellCheck="false"
                className="w-full pl-12 pr-4 py-2 bg-gray-50 text-gray-900 font-mono text-sm rounded-lg border border-[#DDD6C5] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006768]"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSimIdx(0)}
                className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-[#DDD6C5] shadow-2xs cursor-pointer"
                title="Restart"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
              <button
                onClick={() => setSimIdx((i) => Math.max(0, i - 1))}
                disabled={simIdx === 0}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-800 rounded-lg border border-[#DDD6C5] flex items-center gap-1 shadow-2xs text-xs font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Prev
              </button>
              <button
                onClick={() => setSimIdx((i) => Math.min(sim.steps.length - 1, i + 1))}
                disabled={simDone}
                className="px-3 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs disabled:opacity-40 cursor-pointer"
              >
                Next symbol
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                onClick={() => setSimIdx(sim.steps.length - 1)}
                className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-[#DDD6C5] shadow-2xs cursor-pointer"
                title="Run to end"
              >
                <span className="material-symbols-outlined text-[16px]">fast_forward</span>
              </button>
            </div>
          </div>

          {preset && (
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Try:</span>
              {preset.sampleAccept && (
                <button onClick={() => setTestStr(preset.sampleAccept!)} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[#006768] font-mono text-xs cursor-pointer">
                  {preset.sampleAccept}
                </button>
              )}
              {preset.sampleReject && (
                <button onClick={() => setTestStr(preset.sampleReject!)} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs cursor-pointer">
                  {preset.sampleReject}
                </button>
              )}
            </div>
          )}

          {/* tape */}
          <div className="flex items-center gap-1 flex-wrap font-mono text-sm p-3 rounded-xl bg-[#F6F2EA] border border-[#DDD6C5]">
            {testStr.replace(/\s+/g, '').length === 0 ? (
              <span className="text-gray-500 text-xs">ε (empty string)</span>
            ) : (
              testStr
                .replace(/\s+/g, '')
                .split('')
                .map((ch, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded font-bold border ${
                      i < simIdx - 1
                        ? 'bg-white text-gray-400 border-gray-200'
                        : i === simIdx - 1
                        ? 'bg-[#F2A93B] text-[#14161F] border-[#E08E0B]'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    {ch}
                  </span>
                ))
            )}
            <span className="ml-auto text-xs text-gray-600">
              state: <b className="text-[#006768]">{simStep.state ?? '∅ (dead)'}</b>
            </span>
          </div>

          <div className="overflow-x-auto max-h-[220px] overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] tracking-wider">
                  <th className="py-2 px-3">Step</th>
                  <th className="py-2 px-3">Read</th>
                  <th className="py-2 px-3">Consumed</th>
                  <th className="py-2 px-3">Remaining</th>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sim.steps.slice(0, simIdx + 1).map((s) => (
                  <tr
                    key={s.index}
                    onClick={() => setSimIdx(s.index)}
                    className={`cursor-pointer ${s.index === simIdx ? 'bg-[#ffddb5] text-[#835400] font-bold' : 'hover:bg-gray-50 text-gray-800'}`}
                  >
                    <td className="py-1.5 px-3">{String(s.index).padStart(2, '0')}</td>
                    <td className="py-1.5 px-3">{s.symbol ?? '—'}</td>
                    <td className="py-1.5 px-3">{s.consumed || 'ε'}</td>
                    <td className="py-1.5 px-3">{s.remaining || 'ε'}</td>
                    <td className="py-1.5 px-3">{s.state ?? '∅'}</td>
                    <td className="py-1.5 px-3">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {simDone &&
            (sim.accepted ? (
              <div className="w-full bg-[#E5F7EC] p-4 rounded-xl border border-[#2E9E6B]/30 flex items-start gap-3.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#2E9E6B]"></div>
                <div className="w-10 h-10 rounded-xl bg-[#2E9E6B] text-white flex items-center justify-center shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-['Bricolage_Grotesque'] text-base font-bold text-[#14532D]">ACCEPT — string is in L({parse.cleaned})</h3>
                  <p className="text-xs md:text-sm text-[#1E3A2F]">
                    Input <code className="font-mono font-bold px-1 bg-[#CDEFD9] rounded">{testStr.replace(/\s+/g, '') || 'ε'}</code> ends in accepting state{' '}
                    <code className="font-mono font-bold">{simStep.state}</code>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full bg-[#ffdad6] p-4 rounded-xl border border-[#ba1a1a]/30 flex items-start gap-3.5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#ba1a1a]"></div>
                <div className="w-10 h-10 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 ml-2">
                  <span className="material-symbols-outlined text-[24px]">cancel</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-['Bricolage_Grotesque'] text-base font-bold text-[#93000a]">REJECT — string is not in L({parse.cleaned})</h3>
                  <p className="text-xs md:text-sm text-[#5B1015]">
                    {simStep.state
                      ? `Input consumed, but final state ${simStep.state} is not accepting.`
                      : simStep.note}
                  </p>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="w-full bg-white text-gray-700 p-3.5 rounded-xl border border-[#DDD6C5] shadow-xs flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006768] animate-pulse"></span>
            <span>
              Construction in progress · step {player.index + 1} of {steps.length}
            </span>
          </div>
          <span className="text-gray-500 font-mono">Finish construction (or press Show all) to test strings on the DFA</span>
        </div>
      )}

      <StageNav
        backLabel="Back to Followpos"
        onBack={onBack}
        extra={
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-white border border-[#DDD6C5] hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export DFA (.json)</span>
          </button>
        }
      />
    </div>
  );
};

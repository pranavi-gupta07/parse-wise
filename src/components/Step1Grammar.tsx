import React, { useState, useEffect } from 'react';
import { GrammarValidationResult } from '../types';
import { PRESETS } from '../utils/compilerEngine';

interface Step1GrammarProps {
  grammarText: string;
  onChangeGrammar: (text: string) => void;
  validation: GrammarValidationResult;
  onProceed: () => void;
}

export const Step1Grammar: React.FC<Step1GrammarProps> = ({
  grammarText,
  onChangeGrammar,
  validation,
  onProceed,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('valid_arithmetic');
  const [theoryOpen, setTheoryOpen] = useState(false);

  // Sync preset dropdown when text matches preset
  useEffect(() => {
    const matched = PRESETS.find((p) => p.grammar.trim() === grammarText.trim());
    if (matched) {
      setSelectedPreset(matched.id);
    }
  }, [grammarText]);

  const handleSelectPreset = (id: string) => {
    setSelectedPreset(id);
    const p = PRESETS.find((item) => item.id === id);
    if (p) {
      onChangeGrammar(p.grammar);
    }
  };

  const handleFormat = () => {
    const lines = grammarText.split('\n');
    const formatted = lines
      .map((line) => {
        if (!line.includes('->')) return line.trim();
        const [lhs, rhs] = line.split('->').map((s) => s.trim());
        const alts = rhs
          .split('|')
          .map((a) => a.trim())
          .join(' | ');
        return `${lhs} -> ${alts}`;
      })
      .join('\n');
    onChangeGrammar(formatted);
  };

  const handleClear = () => {
    onChangeGrammar('');
  };

  const handleReset = () => {
    const defaultPreset = PRESETS[0];
    setSelectedPreset(defaultPreset.id);
    onChangeGrammar(defaultPreset.grammar);
  };

  const handleAutoFix = () => {
    handleReset();
  };

  const lines = grammarText.split('\n');
  const lineCount = Math.max(lines.length, 6);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans']">
      {/* Stage Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-mono text-[11px] uppercase tracking-wider font-bold">
              Stage 01 • Parsing Laboratory
            </span>
            <span className="text-gray-400">•</span>
            <span className="font-mono text-xs text-gray-600 font-medium">Floyd 1963 Axiom Suite</span>
          </div>
          <h1 className="font-['Bricolage_Grotesque'] text-3xl md:text-4xl text-on-surface font-extrabold tracking-tight">
            Grammar Specification & Verification
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Define productions for operator precedence evaluation. The context-free grammar must adhere to strict Floyd
            1963 operator constraints (no ε-rules, no adjacent non-terminals).
          </p>
        </div>

      </div>

      {/* Crimson Alert Banner (if failed) */}
      {!validation.isOperatorGrammar && (
        <div className="w-full bg-[#ffdad6] rounded-xl p-4 md:p-5 shadow-sm border border-[#ba1a1a]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Bricolage_Grotesque'] text-lg text-[#93000a] font-bold">
                  Validation Failed: Not an Operator Grammar
                </span>
                <span className="font-mono text-[10px] uppercase bg-[#93000a] text-white px-2 py-0.5 rounded font-bold tracking-wider">
                  {validation.hasAdjacentNTs
                    ? 'Axiom 2 Violated'
                    : validation.hasEpsilon
                    ? 'Axiom 1 Violated'
                    : 'Syntax Error'}
                </span>
              </div>
              <p className="text-sm text-[#93000a] leading-relaxed max-w-3xl font-medium">
                {validation.errorReason ||
                  'The grammar fails operator grammar conditions. Check for adjacent non-terminals or ε-productions.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoFix}
            className="shrink-0 px-4 py-2 bg-white text-[#93000a] hover:bg-gray-50 border border-[#ba1a1a]/30 rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
            <span>Auto-Fix with Valid Sample</span>
          </button>
        </div>
      )}

      {/* Main Grid: Editor (7 cols) + Invariants (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Grammar Editor */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-sm overflow-hidden flex flex-col">
            {/* Editor Top Bar */}
            <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between border-b border-[#DDD6C5]">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">terminal</span>
                <span className="font-bold text-gray-800">grammar.cfg</span>
                <span className="text-gray-500 text-[11px] bg-white border border-[#DDD6C5] px-2 py-0.5 rounded">
                  UTF-8 • CFG Standard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFormat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-gray-700 hover:bg-gray-200 rounded text-xs font-mono font-medium transition-colors"
                  title="Format grammar spacing"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                  <span>Format</span>
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded text-xs font-mono font-medium transition-colors"
                  title="Clear editor"
                >
                  <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="p-3.5 bg-gray-50/70 border-b border-[#DDD6C5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label htmlFor="sample-select" className="font-mono text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#835400]">collections_bookmark</span>
                Preset Test Benches
              </label>
              <div className="relative min-w-[280px]">
                <select
                  id="sample-select"
                  value={selectedPreset}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full appearance-none bg-white border border-[#DDD6C5] text-gray-800 font-mono text-xs py-1.5 pl-3 pr-8 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#006768] cursor-pointer"
                >
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2 pointer-events-none text-gray-500 text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="relative flex min-h-[260px] bg-white font-mono text-sm leading-6">
              {/* Line Numbers Gutter */}
              <div className="w-12 py-3 bg-gray-50 select-none flex flex-col items-center gap-0.5 text-gray-400 font-mono text-xs border-r border-[#E3DCCD]">
                {Array.from({ length: lineCount }).map((_, idx) => (
                  <span key={idx} className={validation.adjacentDetails?.line === idx + 1 ? 'text-red-600 font-bold' : ''}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                ))}
              </div>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  id="grammar-editor"
                  value={grammarText}
                  onChange={(e) => onChangeGrammar(e.target.value)}
                  placeholder="Enter productions e.g. E -> E + T | T"
                  spellCheck="false"
                  className="w-full h-full min-h-[260px] p-3 font-mono text-xs md:text-sm text-gray-900 bg-transparent resize-none focus:outline-none selection:bg-[#ffddb5]"
                />
              </div>
            </div>

            {/* Error Line Highlight Overlay Reminder if adjacent non-terminals */}
            {validation.hasAdjacentNTs && (
              <div className="p-3 bg-[#FEF6E9] border-t border-[#DDD6C5] flex items-start gap-2.5 text-xs text-[#835400]">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
                <div>
                  <strong className="font-semibold">Floyd Grammar Reminder:</strong> In an operator grammar, no two
                  non-terminals may appear side by side (<code className="font-mono font-bold">...V_N V_N...</code>). At
                  least one terminal token (<code className="font-mono font-bold">V_T</code>) must separate them.
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-3.5 bg-gray-50 border-t border-[#DDD6C5] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#DDD6C5] hover:bg-gray-100 text-gray-800 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-gray-600 font-mono text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#006768]"></span>
                  <span>{validation.rulesCount}</span> rules
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F2A93B]"></span>
                  <span>{validation.charsCount}</span> chars
                </span>
              </div>
            </div>
          </div>

          {/* Floyd Grammar Heuristics 4 boxes */}
          <div className="bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-gray-600 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#006768]">psychology</span>
                Floyd Grammar Heuristics
              </span>
              <span className="font-mono text-xs text-[#006768] font-bold">Strict Standard</span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              An operator grammar ensures that no handle contains consecutive non-terminal variables and avoids
              null-derivations, allowing precedence matrices between all terminal tokens without ambiguity in shift/reduce
              decisions.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center">
                <div className="font-mono text-[11px] text-gray-500">Rule 1</div>
                <div className="font-mono text-xs font-bold text-gray-800">No A → ε</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center">
                <div className="font-mono text-[11px] text-gray-500">Rule 2</div>
                <div className="font-mono text-xs font-bold text-gray-800">No ...XY... (NT)</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center">
                <div className="font-mono text-[11px] text-gray-500">Rule 3</div>
                <div className="font-mono text-xs font-bold text-gray-800">V_T ≠ ∅</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-center">
                <div className="font-mono text-[11px] text-gray-500">Rule 4</div>
                <div className="font-mono text-xs font-bold text-gray-800">Valid LHS</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Alphabet Partitioning & Invariants */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Verdict Banner */}
          {validation.isOperatorGrammar ? (
            <div className="rounded-xl p-4 bg-[#ffddb5]/30 border border-[#F2A93B]/40 shadow-xs flex items-start gap-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#006768] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-['Bricolage_Grotesque'] text-base font-bold text-gray-900">
                  Operator Grammar Valid
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Floyd 1963 axioms fully satisfied. Ready for Leading & Trailing sets computation.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200 shadow-xs flex items-start gap-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-['Bricolage_Grotesque'] text-base font-bold text-red-900">
                  Floyd Invariant Violation
                </h3>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  {validation.errorReason}
                </p>
              </div>
            </div>
          )}

          {/* Alphabet Partitioning */}
          <div className="bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h2 className="font-['Bricolage_Grotesque'] text-base font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">data_array</span>
                Alphabet Partitioning
              </h2>
              <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">Disjoint Sets</span>
            </div>

            {/* Terminals (V_T) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-gray-500 font-semibold">Terminals (V_T)</span>
                <span className="text-gray-500">{validation.terminals.length} symbols</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-gray-50 min-h-[38px] items-center border border-gray-200">
                {validation.terminals.length === 0 ? (
                  <span className="text-xs text-gray-400 italic font-mono">None detected</span>
                ) : (
                  validation.terminals.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-xs px-2.5 py-0.5 rounded bg-white text-[#006768] font-bold shadow-2xs border border-gray-200"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Non-Terminals (V_N) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-gray-500 font-semibold">Non-Terminals (V_N)</span>
                <span className="text-gray-500">
                  {validation.nonTerminals.length} symbols • Start: {validation.startSymbol}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-gray-50 min-h-[38px] items-center border border-gray-200">
                {validation.nonTerminals.length === 0 ? (
                  <span className="text-xs text-gray-400 italic font-mono">None detected</span>
                ) : (
                  validation.nonTerminals.map((nt, idx) => (
                    <span
                      key={nt}
                      className="font-mono text-xs px-2.5 py-0.5 rounded bg-white text-[#835400] font-bold shadow-2xs border border-gray-200 flex items-center gap-1"
                    >
                      <span>{nt}</span>
                      {idx === 0 && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-[#ffddb5] text-[#835400] font-sans">
                          Start
                        </span>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Invariant Verification Checklist */}
          <div className="bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h2 className="font-['Bricolage_Grotesque'] text-base font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#F2A93B] text-[18px]">checklist</span>
                Invariant Verification
              </h2>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  validation.isOperatorGrammar
                    ? 'bg-[#8ff3f4]/40 text-[#004f51]'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {validation.invariants.filter((i) => i.passed).length}/5 Passed
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {validation.invariants.map((inv, idx) => (
                <div
                  key={idx}
                  className={`flex items-start justify-between p-2.5 rounded-lg border gap-3 ${
                    inv.passed ? 'bg-gray-50/70 border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[18px] mt-0.5 ${
                        inv.passed ? 'text-[#006768]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {inv.passed ? 'check_circle' : 'cancel'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-semibold text-gray-900">{inv.title}</span>
                      <span className="text-xs text-gray-600">{inv.message}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      inv.passed
                        ? 'text-[#006768] bg-white border border-gray-200'
                        : 'text-red-700 bg-white border border-red-200'
                    }`}
                  >
                    {inv.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Proceed CTA */}
            <div className="pt-2">
              <button
                onClick={onProceed}
                disabled={!validation.isOperatorGrammar}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs md:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  validation.isOperatorGrammar
                    ? 'bg-[#006768] hover:bg-[#004f51] text-white active:scale-[0.99]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Leading & Trailing Sets</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theoretical Primer Accordion */}
      <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-sm overflow-hidden mt-1">
        <button
          onClick={() => setTheoryOpen(!theoryOpen)}
          className="w-full flex items-center justify-between p-4 cursor-pointer select-none bg-gray-50/70 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#835400] text-[20px]">menu_book</span>
            <div className="flex flex-col">
              <span className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                Theoretical Primer: Operator Grammar Constraints (Floyd 1963)
              </span>
              <span className="text-xs text-gray-500">
                Why Robert W. Floyd instituted these conditions for bottom-up precedence parsing
              </span>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-gray-500 transition-transform ${
              theoryOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {theoryOpen && (
          <div className="p-5 border-t border-[#DDD6C5] grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[#006768] font-['Bricolage_Grotesque'] text-sm font-bold">
                <span className="font-mono text-xs w-5 h-5 rounded bg-[#8ff3f4]/50 text-[#004f51] flex items-center justify-center">
                  1
                </span>
                Null-Free Productions
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                If <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">A → ε</code> is permitted, terminals
                surrounding <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">A</code> can become adjacent
                dynamically during derivations, creating conflicting precedence relations between identical tokens.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[#006768] font-['Bricolage_Grotesque'] text-sm font-bold">
                <span className="font-mono text-xs w-5 h-5 rounded bg-[#8ff3f4]/50 text-[#004f51] flex items-center justify-center">
                  2
                </span>
                Variable Isolation
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every right-hand side has at least one terminal separating non-terminals (e.g.{' '}
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">E + T</code>, never{' '}
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">E T</code>). This guarantees that parser
                handles are framed by deterministic terminal delimiters.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[#006768] font-['Bricolage_Grotesque'] text-sm font-bold">
                <span className="font-mono text-xs w-5 h-5 rounded bg-[#8ff3f4]/50 text-[#004f51] flex items-center justify-center">
                  3
                </span>
                Precedence Matrix Feasibility
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Leading and Trailing sets are uniquely defined over terminal boundaries. Without Floyd constraints, the
                precedence relations <code className="font-mono text-[#3B6FD8] font-bold">⋖</code>,{' '}
                <code className="font-mono text-[#E8603C] font-bold">⋗</code>, and{' '}
                <code className="font-mono text-[#8E5BD9] font-bold">≐</code> yield multi-valued conflicts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

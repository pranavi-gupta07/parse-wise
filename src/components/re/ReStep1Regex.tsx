import React, { useState } from 'react';
import { ReParseResult, RE_PRESETS } from '../../utils/reToDfaEngine';

interface ReStep1RegexProps {
  regex: string;
  onChangeRegex: (r: string) => void;
  parse: ReParseResult;
  onProceed: () => void;
  onShowComplete: () => void;
}

const OPERATOR_KEYS = ['|', '*', '+', '?', '(', ')', 'ε'];

export const ReStep1Regex: React.FC<ReStep1RegexProps> = ({ regex, onChangeRegex, parse, onProceed, onShowComplete }) => {
  const [theoryOpen, setTheoryOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const insert = (s: string) => {
    const el = inputRef.current;
    if (!el) return onChangeRegex(regex + s);
    const start = el.selectionStart ?? regex.length;
    const end = el.selectionEnd ?? regex.length;
    const next = regex.slice(0, start) + s + regex.slice(end);
    onChangeRegex(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + s.length, start + s.length);
    });
  };

  const passedCount = parse.checks.filter((c) => c.passed).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans']">
      {/* Stage Header */}
      <div className="flex flex-col gap-1 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-mono text-[11px] uppercase tracking-wider font-bold">
            Stage 01 • Automata Laboratory
          </span>
          <span className="text-gray-400">•</span>
          <span className="font-mono text-xs text-gray-600 font-medium">Direct method (followpos)</span>
        </div>
        <h1 className="font-['Bricolage_Grotesque'] text-3xl md:text-4xl font-extrabold tracking-tight">
          Regular Expression Input & Augmentation
        </h1>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
          Enter a regular expression. It is augmented with an end-marker <code className="font-mono font-bold text-[#835400]">#</code> as{' '}
          <code className="font-mono font-bold">(r)#</code>, turned into a syntax tree, and converted straight into a DFA — no NFA in between.
        </p>
      </div>

      {/* Error banner */}
      {!parse.ok && (
        <div className="w-full bg-[#ffdad6] rounded-xl p-4 md:p-5 shadow-sm border border-[#ba1a1a]/20 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <span className="material-symbols-outlined text-[24px]">cancel</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Bricolage_Grotesque'] text-lg text-[#93000a] font-bold">Invalid Regular Expression</span>
              <span className="font-mono text-[10px] uppercase bg-[#93000a] text-white px-2 py-0.5 rounded font-bold tracking-wider">Syntax Error</span>
            </div>
            <p className="text-sm text-[#93000a] font-medium">{parse.error}</p>
            {parse.errorIndex !== undefined && regex.length > 0 && (
              <pre className="font-mono text-sm text-[#93000a] mt-1 leading-tight">
                {regex}
                {'\n'}
                {' '.repeat(Math.min(parse.errorIndex, regex.length))}^
              </pre>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: editor + derived forms */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between border-b border-[#DDD6C5]">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">terminal</span>
                <span className="font-bold text-gray-800">pattern.re</span>
                <span className="text-gray-500 text-[11px] bg-white border border-[#DDD6C5] px-2 py-0.5 rounded">single-char symbols</span>
              </div>
              <button
                onClick={() => onChangeRegex('')}
                className="text-xs font-mono text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">backspace</span>
                Clear
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-sm">r =</div>
                <input
                  ref={inputRef}
                  type="text"
                  value={regex}
                  onChange={(e) => onChangeRegex(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && parse.ok) onProceed();
                  }}
                  placeholder="e.g. (a|b)*abb"
                  spellCheck="false"
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-900 font-mono text-lg rounded-lg border focus:outline-none focus:bg-white focus:ring-1 transition-colors ${
                    parse.ok ? 'border-[#DDD6C5] focus:ring-[#006768]' : 'border-red-300 focus:ring-[#ba1a1a]'
                  }`}
                />
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <span className="font-mono text-[10px] uppercase text-gray-500 font-bold mr-1">Insert:</span>
                {OPERATOR_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => insert(k)}
                    className="w-8 h-7 bg-gray-100 hover:bg-[#ffddb5] hover:text-[#835400] rounded font-mono text-sm font-bold text-gray-800 border border-gray-200 transition-colors cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex items-center flex-wrap gap-2 pt-1">
                <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Quick Presets:</span>
                {RE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onChangeRegex(p.regex)}
                    title={p.description}
                    className={`px-2.5 py-1 rounded font-mono text-xs transition-colors cursor-pointer ${
                      regex === p.regex ? 'bg-[#006768] text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#006768]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Derived forms */}
          {parse.ok && (
            <div className="bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-sm flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffddb5]/50 rotate-45 pointer-events-none"></div>
              <h2 className="font-['Bricolage_Grotesque'] text-base font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">transform</span>
                Augmentation Pipeline
              </h2>
              <div className="flex flex-col gap-2 font-mono text-sm">
                {[
                  { k: 'Original', v: parse.cleaned, note: 'as typed (whitespace removed)' },
                  { k: 'Explicit ·', v: parse.explicit, note: 'concatenation made explicit' },
                  { k: 'Augmented', v: parse.augmented, note: 'append end-marker #' },
                  { k: 'Postfix', v: parse.postfix, note: 'order the tree is built in' },
                ].map((row, i) => (
                  <div key={row.k} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="w-6 h-6 rounded bg-[#8ff3f4]/50 text-[#004f51] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-gray-500 font-bold">{row.k}</span>
                    <span className="font-bold text-gray-900 break-all">
                      {row.v.split('').map((ch, j) => (
                        <span key={j} className={ch === '#' ? 'text-[#F2A93B] bg-[#14161F] px-0.5 rounded' : ch === '·' ? 'text-[#8E5BD9]' : '|*+?()'.includes(ch) ? 'text-[#E8603C]' : ''}>
                          {ch}
                        </span>
                      ))}
                    </span>
                    <span className="hidden md:inline ml-auto text-[11px] text-gray-400 whitespace-nowrap">{row.note}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <span className="font-mono text-[11px] uppercase text-gray-500 font-bold tracking-wider">Leaf Positions</span>
                <div className="flex items-center flex-wrap gap-1.5">
                  {parse.positions.map((p) => (
                    <div
                      key={p.pos}
                      className={`flex flex-col items-center rounded-lg border px-2.5 py-1 min-w-[40px] ${
                        p.symbol === '#' ? 'bg-[#14161F] border-[#14161F]' : 'bg-[#FEF6E9] border-[#F2A93B]/60'
                      }`}
                    >
                      <span className={`font-mono text-sm font-bold ${p.symbol === '#' ? 'text-[#F2A93B]' : 'text-gray-900'}`}>{p.symbol}</span>
                      <span className={`font-mono text-[10px] font-bold ${p.symbol === '#' ? 'text-white/70' : 'text-[#835400]'}`}>{p.pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: checklist */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h2 className="font-['Bricolage_Grotesque'] text-base font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#F2A93B] text-[18px]">checklist</span>
                Expression Verification
              </h2>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${parse.ok ? 'bg-[#8ff3f4]/40 text-[#004f51]' : 'bg-red-100 text-red-700'}`}>
                {passedCount}/{parse.checks.length} Passed
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {parse.checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`flex items-start justify-between p-2.5 rounded-lg border gap-3 ${c.passed ? 'bg-gray-50/70 border-gray-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`material-symbols-outlined text-[18px] mt-0.5 ${c.passed ? 'text-[#006768]' : 'text-[#ba1a1a]'}`}>
                      {c.passed ? 'check_circle' : 'cancel'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-semibold text-gray-900">{c.title}</span>
                      <span className="text-xs text-gray-600 font-mono">{c.message}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      c.passed ? 'text-[#006768] bg-white border border-gray-200' : 'text-red-700 bg-white border border-red-200'
                    }`}
                  >
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={onProceed}
                disabled={!parse.ok}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs md:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  parse.ok ? 'bg-[#006768] hover:bg-[#004f51] text-white active:scale-[0.99]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Build Syntax Tree (step-by-step)</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                onClick={onShowComplete}
                disabled={!parse.ok}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  parse.ok ? 'bg-white hover:bg-[#FEF6E9] text-[#835400] border-[#F2A93B]/60' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">fast_forward</span>
                <span>Jump to Complete DFA</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#DDD6C5] shadow-sm flex flex-col gap-2">
            <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#835400] text-[18px]">keyboard</span>
              Syntax Reference
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs text-gray-700">
              <span><b className="text-[#E8603C]">a|b</b> union</span>
              <span><b className="text-[#E8603C]">ab</b> or <b className="text-[#E8603C]">a.b</b> concat</span>
              <span><b className="text-[#E8603C]">a*</b> zero or more</span>
              <span><b className="text-[#E8603C]">a+</b> one or more</span>
              <span><b className="text-[#E8603C]">a?</b> optional</span>
              <span><b className="text-[#E8603C]">ε</b> or <b className="text-[#E8603C]">eps</b> empty</span>
              <span className="col-span-2 text-gray-500">Symbols are single characters (a, b, 0, 1, …). # is reserved.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theory accordion */}
      <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-sm overflow-hidden mt-1">
        <button
          onClick={() => setTheoryOpen(!theoryOpen)}
          className="w-full flex items-center justify-between p-4 cursor-pointer select-none bg-gray-50/70 hover:bg-gray-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#835400] text-[20px]">menu_book</span>
            <div className="flex flex-col">
              <span className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">Theoretical Primer: The Direct RE → DFA Method</span>
              <span className="text-xs text-gray-500">How positions, followpos and the end-marker # produce a DFA without building an NFA</span>
            </div>
          </div>
          <span className={`material-symbols-outlined text-gray-500 transition-transform ${theoryOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {theoryOpen && (
          <div className="p-5 border-t border-[#DDD6C5] grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
            {[
              {
                t: 'Positions & Augmentation',
                d: (
                  <>
                    Every symbol occurrence in the tree is a <b>position</b>. Appending <code className="font-mono bg-gray-100 px-1 rounded">#</code> gives the
                    accepting position: any DFA state containing it is accepting.
                  </>
                ),
              },
              {
                t: 'nullable · firstpos · lastpos',
                d: (
                  <>
                    Computed bottom-up. <span className="text-[#3B6FD8] font-bold font-mono">firstpos</span> = positions that can start a string of the
                    sub-expression, <span className="text-[#E8603C] font-bold font-mono">lastpos</span> = positions that can end one, and{' '}
                    <span className="text-[#8E5BD9] font-bold font-mono">nullable</span> = it can match ε.
                  </>
                ),
              },
              {
                t: 'followpos → DFA states',
                d: (
                  <>
                    Only cat- and star-nodes create followpos entries. The start state is firstpos(root); from state S on symbol a, go to the union of followpos(p) for
                    every p in S labelled a.
                  </>
                ),
              },
            ].map((x, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[#006768] font-['Bricolage_Grotesque'] text-sm font-bold">
                  <span className="font-mono text-xs w-5 h-5 rounded bg-[#8ff3f4]/50 text-[#004f51] flex items-center justify-center">{i + 1}</span>
                  {x.t}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

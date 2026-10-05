import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl border border-[#DDD6C5] shadow-2xl max-w-2xl w-full p-6 flex flex-col gap-4 font-['IBM_Plex_Sans'] relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-[#006768]/10 text-[#006768] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div>
            <h2 className="font-['Bricolage_Grotesque'] text-xl font-bold text-gray-900">
              Operator Precedence Theory & Floyd Axioms
            </h2>
            <p className="text-xs text-gray-500">
              Robert W. Floyd (1963) Syntactic Analysis and Operator Precedence
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-xs md:text-sm text-gray-700 leading-relaxed">
          <section className="flex flex-col gap-1.5">
            <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#006768] uppercase tracking-wide">
              1. What is an Operator Grammar?
            </h3>
            <p>
              A context-free grammar G is an <strong>operator grammar</strong> if:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>No ε-productions:</strong> No non-terminal derives the empty string null token (
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">A → ε</code> is forbidden).
              </li>
              <li>
                <strong>No adjacent non-terminals:</strong> No right-hand side contains two non-terminals side-by-side (
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">...X Y...</code> where X, Y ∈ V_N).
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#006768] uppercase tracking-wide">
              2. Precedence Relations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 bg-[#E3EBFA] rounded-lg border border-blue-200">
                <span className="font-bold text-[#3B6FD8] text-sm block">a ⋖ b</span>
                <span className="text-gray-700 font-sans text-xs">
                  a <strong>yields precedence</strong> to b (SHIFT)
                </span>
              </div>
              <div className="p-2.5 bg-[#EDE4FA] rounded-lg border border-purple-200">
                <span className="font-bold text-[#8E5BD9] text-sm block">a ≐ b</span>
                <span className="text-gray-700 font-sans text-xs">
                  a <strong>has equal precedence</strong> to b (SHIFT)
                </span>
              </div>
              <div className="p-2.5 bg-[#FBE3DA] rounded-lg border border-orange-200">
                <span className="font-bold text-[#E8603C] text-sm block">a ⋗ b</span>
                <span className="text-gray-700 font-sans text-xs">
                  a <strong>takes precedence</strong> over b (REDUCE)
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#006768] uppercase tracking-wide">
              3. Why Ambiguous Grammars Produce Conflicts
            </h3>
            <p>
              In grammars like <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">E → E + E | E * E | id</code>,
              both <code className="font-mono text-[#3B6FD8] font-bold">+ ⋖ +</code> and{' '}
              <code className="font-mono text-[#E8603C] font-bold">+ ⋗ +</code> are mathematically deduced. Because multiple
              relations exist for the same cell, the bottom-up parser cannot deterministically decide whether to shift or
              reduce.
            </p>
          </section>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

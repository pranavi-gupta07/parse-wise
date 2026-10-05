import React from 'react';
import { StepId } from '../types';

interface FooterProps {
  currentStep: StepId;
  onOpenHelp: () => void;
  onOpenShortcuts: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentStep,
  onOpenHelp,
  onOpenShortcuts,
}) => {
  const stepLabel =
    currentStep === 'grammar'
      ? 'Step 1 of 4 · Axiom Verification'
      : currentStep === 'sets'
      ? 'Step 2 of 4 · Inductive Boundary Sets'
      : currentStep === 'table'
      ? 'Step 3 of 4 · Matrix Relations Evaluation'
      : 'Step 4 of 4 · Shift-Reduce String Execution';

  return (
    <footer className="w-full bg-[#14161F] text-[#B8BBC8] mt-12 border-t border-[#232738] select-none">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Brand & Tagline */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#006768] flex items-center justify-center">
              <span className="font-mono text-sm text-[#F2A93B] font-bold leading-none">⋖</span>
            </div>
            <span className="font-['Bricolage_Grotesque'] text-lg font-bold text-white">Parsewise</span>
          </div>
          <p className="text-xs text-[#8F94A6]">Compiler design, one step at a time.</p>
          <div className="flex items-center gap-3 pt-2 text-xs font-mono text-[#8F94A6]">
            <button onClick={onOpenHelp} className="hover:text-white transition-colors cursor-pointer">
              About
            </button>
            <span className="text-[#383D52]">·</span>
            <button
              onClick={() => alert('Issue report logged to Parsewise sandbox logger.')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Report an issue
            </button>
            <span className="text-[#383D52]">·</span>
            <button onClick={onOpenShortcuts} className="hover:text-white transition-colors cursor-pointer">
              Shortcuts
            </button>
          </div>
        </div>

        {/* Column 2: Relation Legend */}
        <div className="flex flex-col gap-2">
          <h4 className="font-mono text-xs uppercase tracking-wider text-white/70 font-semibold">
            Relation Legend
          </h4>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#6A93F0]">⋖</span>
              <span className="text-[#8F94A6]">yields (shift)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#AE82EE]">≐</span>
              <span className="text-[#8F94A6]">equals (shift)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#F27F5E]">⋗</span>
              <span className="text-[#8F94A6]">precedes (reduce)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#6B6F80]">∅</span>
              <span className="text-[#8F94A6]">blank (syntax error)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Shortcuts */}
        <div className="flex flex-col gap-2">
          <h4 className="font-mono text-xs uppercase tracking-wider text-white/70 font-semibold">
            Shortcuts
          </h4>
          <div className="flex flex-col gap-1.5 font-mono text-xs text-[#8F94A6]">
            <div className="flex items-center justify-between">
              <span>Next step</span>
              <kbd className="bg-[#1F2333] text-white px-2 py-0.5 rounded text-[11px] border border-[#2E354B]">
                →
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Previous step</span>
              <kbd className="bg-[#1F2333] text-white px-2 py-0.5 rounded text-[11px] border border-[#2E354B]">
                ←
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Play / Pause</span>
              <kbd className="bg-[#1F2333] text-white px-2 py-0.5 rounded text-[11px] border border-[#2E354B]">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Reset parser</span>
              <kbd className="bg-[#1F2333] text-white px-2 py-0.5 rounded text-[11px] border border-[#2E354B]">
                R
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar */}
      <div className="w-full px-4 md:px-8 py-2.5 bg-[#0D0F15] border-t border-[#1F2333] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs text-[#8F94A6]">
        <div>© 2026 Parsewise. Interactive Compiler Design Laboratory.</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F2A93B]"></span>
          <span className="text-white font-medium">{stepLabel}</span>
        </div>
      </div>
    </footer>
  );
};

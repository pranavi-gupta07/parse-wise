import React from 'react';

export type ReStepId = 'regex' | 'tree' | 'followpos' | 'dfa';

export const RE_STEPS: { id: ReStepId; label: string; title: string }[] = [
  { id: 'regex', label: '① Regular Expression', title: 'Step 1: Enter & augment the regular expression' },
  { id: 'tree', label: '② Syntax Tree', title: 'Step 2: Syntax tree with nullable, firstpos, lastpos' },
  { id: 'followpos', label: '③ Followpos', title: 'Step 3: Followpos table' },
  { id: 'dfa', label: '④ DFA', title: 'Step 4: DFA construction & string test' },
];

interface ReStepperNavProps {
  currentStep: ReStepId;
  onSelectStep: (step: ReStepId) => void;
  isRegexValid: boolean;
  dfaStateCount: number;
  rightSlot?: React.ReactNode;
}

export const ReStepperNav: React.FC<ReStepperNavProps> = ({ currentStep, onSelectStep, isRegexValid, dfaStateCount, rightSlot }) => {
  const currentIdx = RE_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="sticky top-[60px] z-40 bg-[#F6F2EA]/95 backdrop-blur border-b border-[#E3DCCD] shadow-[0_1px_3px_rgba(20,22,31,0.04)]">
      <div className="w-full px-4 md:px-8 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {RE_STEPS.map((s, i) => {
            const locked = i > 0 && !isRegexValid;
            const isCurrent = s.id === currentStep;
            const isDone = !locked && i < currentIdx;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <div className={`w-4 md:w-8 h-[2px] ${!locked && i <= currentIdx ? 'bg-[#F2A93B]' : i === 1 && isRegexValid ? 'bg-[#006768]' : 'bg-[#BDC9C9]'}`}></div>}
                <button
                  onClick={() => !locked && onSelectStep(s.id)}
                  disabled={locked}
                  title={locked ? 'Enter a valid regular expression first' : s.title}
                  className={`flex items-center gap-1.5 font-mono text-xs focus:outline-none transition-opacity ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0
                        ? isRegexValid
                          ? isCurrent
                            ? 'border-2 border-[#006768] bg-[#006768] text-white shadow-sm'
                            : 'bg-[#006768] text-white'
                          : 'bg-[#BA1A1A] text-white'
                        : isCurrent
                        ? 'border-2 border-[#F2A93B] bg-white text-[#835400] shadow-[0_0_6px_rgba(242,169,59,0.5)]'
                        : locked
                        ? 'bg-gray-300 text-gray-600'
                        : isDone
                        ? 'bg-[#006768] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {i === 0 ? (isRegexValid ? '✓' : '!') : locked ? '🔒' : isDone ? '✓' : i + 1}
                  </span>
                  <span
                    className={`transition-colors ${
                      isCurrent
                        ? i === 0
                          ? 'text-[#006768] font-bold underline decoration-2'
                          : 'text-[#835400] font-bold'
                        : locked
                        ? 'text-gray-400'
                        : 'text-gray-700 hover:text-black font-medium'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.id === 'dfa' && isRegexValid && (
                    <span className="px-1.5 rounded-full bg-[#E6F4F4] text-[#006768] text-[10px] font-bold border border-[#BFE3E3]">
                      {dfaStateCount} state{dfaStateCount === 1 ? '' : 's'}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {rightSlot}
      </div>
    </div>
  );
};

import React from 'react';
import { StepId } from '../types';

interface StepperNavProps {
  currentStep: StepId;
  onSelectStep: (step: StepId) => void;
  isGrammarValid: boolean;
  hasConflicts: boolean;
  conflictsCount: number;
}

export const StepperNav: React.FC<StepperNavProps> = ({
  currentStep,
  onSelectStep,
  isGrammarValid,
  hasConflicts,
  conflictsCount,
}) => {
  return (
    <div className="sticky top-[60px] z-40 bg-[#F6F2EA]/95 backdrop-blur border-b border-[#E3DCCD] shadow-[0_1px_3px_rgba(20,22,31,0.04)]">
      <div className="w-full px-4 md:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap max-w-4xl w-full">
          {/* Step 1 */}
          <button
            onClick={() => onSelectStep('grammar')}
            className="flex items-center gap-1.5 font-mono text-xs font-medium group cursor-pointer focus:outline-none"
          >
            {isGrammarValid ? (
              <span className="w-5 h-5 rounded-full bg-[#006768] text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-[#BA1A1A] text-white flex items-center justify-center text-[10px] font-bold">
                !
              </span>
            )}
            <span
              className={`transition-colors ${
                currentStep === 'grammar' ? 'text-[#006768] font-bold underline decoration-2' : 'text-gray-700 hover:text-black'
              }`}
            >
              ① Grammar
            </span>
          </button>

          <div className="w-4 md:w-8 h-[2px] bg-[#006768]"></div>

          {/* Step 2 */}
          <button
            onClick={() => isGrammarValid && onSelectStep('sets')}
            disabled={!isGrammarValid}
            className={`flex items-center gap-1.5 font-mono text-xs focus:outline-none transition-opacity ${
              isGrammarValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            title={isGrammarValid ? 'Step 2: Leading & Trailing Sets' : 'Complete Step 1 Grammar verification first'}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'sets'
                  ? 'border-2 border-[#F2A93B] bg-white text-[#835400] shadow-[0_0_6px_rgba(242,169,59,0.5)]'
                  : isGrammarValid
                  ? 'bg-[#006768] text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {currentStep === 'sets' ? '2' : isGrammarValid ? '✓' : '🔒'}
            </span>
            <span
              className={`transition-colors ${
                currentStep === 'sets'
                  ? 'text-[#835400] font-bold'
                  : isGrammarValid
                  ? 'text-gray-700 hover:text-black font-medium'
                  : 'text-gray-400'
              }`}
            >
              ② Leading/Trailing
            </span>
          </button>

          <div
            className={`w-4 md:w-8 h-[2px] ${
              (currentStep === 'table' || currentStep === 'trace') && isGrammarValid ? 'bg-[#F2A93B]' : 'bg-[#BDC9C9]'
            }`}
          ></div>

          {/* Step 3 */}
          <button
            onClick={() => isGrammarValid && onSelectStep('table')}
            disabled={!isGrammarValid}
            className={`flex items-center gap-1.5 font-mono text-xs focus:outline-none transition-opacity ${
              isGrammarValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            title={isGrammarValid ? 'Step 3: Precedence Relation Table' : 'Complete Step 1 Grammar verification first'}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'table'
                  ? 'border-2 border-[#F2A93B] bg-white text-[#835400] shadow-[0_0_8px_rgba(242,169,59,0.4)]'
                  : !isGrammarValid
                  ? 'bg-gray-300 text-gray-600'
                  : hasConflicts
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {!isGrammarValid ? '🔒' : '3'}
            </span>
            <span
              className={`transition-colors ${
                currentStep === 'table'
                  ? 'text-[#835400] font-bold'
                  : isGrammarValid
                  ? 'text-gray-700 hover:text-black font-medium'
                  : 'text-gray-400'
              }`}
            >
              ③ Precedence Table
            </span>
            {hasConflicts && isGrammarValid && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                {conflictsCount} conflicts
              </span>
            )}
          </button>

          <div className="w-4 md:w-8 h-[2px] bg-[#BDC9C9]"></div>

          {/* Step 4 */}
          <button
            onClick={() => isGrammarValid && onSelectStep('trace')}
            disabled={!isGrammarValid}
            className={`flex items-center gap-1.5 font-mono text-xs focus:outline-none transition-opacity ${
              isGrammarValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            title={isGrammarValid ? 'Step 4: Parse String Trace' : 'Complete Step 1 Grammar verification first'}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'trace'
                  ? 'border-2 border-[#006768] bg-[#006768] text-white shadow-sm'
                  : !isGrammarValid
                  ? 'bg-gray-300 text-gray-600'
                  : hasConflicts
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {!isGrammarValid ? '🔒' : '4'}
            </span>
            <span
              className={`transition-colors ${
                currentStep === 'trace'
                  ? 'text-[#006768] font-bold'
                  : !isGrammarValid
                  ? 'text-gray-400'
                  : hasConflicts
                  ? 'text-red-700 font-medium'
                  : 'text-gray-700 hover:text-black font-medium'
              }`}
            >
              ④ Parse String
            </span>
            {hasConflicts && isGrammarValid && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-red-700 bg-red-100 px-1 rounded font-bold border border-red-200">
                Conflict Demo
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { GrammarValidationResult, LeadingTrailingData, LeadingTrailingStep } from '../types';

interface Step2LeadingTrailingProps {
  validation: GrammarValidationResult;
  setsData: LeadingTrailingData;
  onProceed: () => void;
  onBack: () => void;
}

export const Step2LeadingTrailing: React.FC<Step2LeadingTrailingProps> = ({
  validation,
  setsData,
  onProceed,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'leading' | 'trailing'>('leading');
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const currentStepsList = activeTab === 'leading' ? setsData.leadingSteps : setsData.trailingSteps;
  const totalSteps = Math.max(currentStepsList.length, 1);
  const safeIndex = Math.min(stepIndex, totalSteps - 1);
  const activeStep: LeadingTrailingStep | undefined = currentStepsList[safeIndex];

  // Incrementally computed leading and trailing sets for step-by-step display
  const visibleLeading: Record<string, string[]> = React.useMemo(() => {
    if (viewMode === 'all' || activeTab === 'trailing') {
      return setsData.leading;
    }
    const map: Record<string, Set<string>> = {};
    validation.nonTerminals.forEach((nt) => {
      map[nt] = new Set<string>();
    });
    const stepsToConsider = setsData.leadingSteps.slice(0, safeIndex + 1);
    stepsToConsider.forEach((step) => {
      if (step.terminalExtracted && map[step.nt]) {
        map[step.nt].add(step.terminalExtracted);
      }
    });
    const res: Record<string, string[]> = {};
    validation.nonTerminals.forEach((nt) => {
      res[nt] = Array.from(map[nt] || []);
    });
    return res;
  }, [validation.nonTerminals, viewMode, activeTab, safeIndex, setsData]);

  const visibleTrailing: Record<string, string[]> = React.useMemo(() => {
    if (viewMode === 'all') {
      return setsData.trailing;
    }
    if (activeTab === 'leading') {
      const res: Record<string, string[]> = {};
      validation.nonTerminals.forEach((nt) => {
        res[nt] = [];
      });
      return res;
    }
    const map: Record<string, Set<string>> = {};
    validation.nonTerminals.forEach((nt) => {
      map[nt] = new Set<string>();
    });
    const stepsToConsider = setsData.trailingSteps.slice(0, safeIndex + 1);
    stepsToConsider.forEach((step) => {
      if (step.terminalExtracted && map[step.nt]) {
        map[step.nt].add(step.terminalExtracted);
      }
    });
    const res: Record<string, string[]> = {};
    validation.nonTerminals.forEach((nt) => {
      res[nt] = Array.from(map[nt] || []);
    });
    return res;
  }, [validation.nonTerminals, viewMode, activeTab, safeIndex, setsData]);

  // Auto-play interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalSteps]);

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleFastForward = () => {
    setIsPlaying(false);
    setStepIndex(totalSteps - 1);
  };

  const progressPercent = Math.round(((safeIndex + 1) / totalSteps) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans']">
      {/* Subtitle & Operational Meta Band */}
      <div className="w-full px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#DDD6C5] rounded-xl shadow-xs">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#835400] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#F2A93B] animate-pulse"></span>
            <span>
              Pass 1 · Step {String(safeIndex + 1).padStart(2, '0')} of {String(totalSteps).padStart(2, '0')} ·{' '}
              Evaluating {activeTab === 'leading' ? 'Leading' : 'Trailing'}({activeStep?.nt || 'E'})
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-600">
            Step 2 of 4 · Fixed-point inductive computation of boundary terminals.
          </p>
        </div>

        {/* Algorithm Stage Progress Metric Widget */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[11px] text-gray-500 uppercase tracking-wider">
              Fixed-Point Convergence
            </span>
            <span className="font-mono text-xs font-bold text-[#006768]">
              {progressPercent}% Iteration Sweep
            </span>
          </div>
          <div className="w-28 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-[#006768] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Controls & Subtabs Bar */}
      <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Sub-Tabs: Leading vs Trailing */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setActiveTab('leading');
              setStepIndex(0);
              setIsPlaying(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'leading'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#006768] text-white flex items-center justify-center font-mono text-[10px]">
              ✓
            </span>
            <span>Leading Sets</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
              {activeTab === 'leading' ? 'Active' : 'Done'}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trailing');
              setStepIndex(0);
              setIsPlaying(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'trailing'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#835400] animate-pulse"></span>
            <span>Trailing Sets</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#ffddb5] text-[#835400] font-bold">
              {activeTab === 'trailing' ? 'Active' : 'Step 2.2'}
            </span>
          </button>
        </div>

        {/* Stepper Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs">
            <button
              onClick={() => setViewMode('step')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                viewMode === 'step' ? 'bg-[#006768] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Step-by-step
            </button>
            <button
              onClick={() => {
                setViewMode('all');
                handleFastForward();
              }}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                viewMode === 'all' ? 'bg-[#006768] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Show all
            </button>
          </div>

          <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              title="Previous Step"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Prev</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#835400]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={stepIndex >= totalSteps - 1}
              className="px-3 py-1.5 rounded-lg bg-[#006768] hover:bg-[#004f51] text-white text-xs font-medium shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Next Step"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Reset"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>

            <button
              onClick={handleFastForward}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Skip to end"
            >
              <span className="material-symbols-outlined text-[16px]">fast_forward</span>
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="ml-auto sm:ml-2 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#006768] bg-[#8ff3f4]/30 hover:bg-[#8ff3f4]/50 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span>Rules Ledger</span>
            <span className={`material-symbols-outlined text-[15px] transition-transform ${drawerOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Rules Ledger Drawer (Collapsible) */}
      {drawerOpen && (
        <div className="bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-1">
            <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#006768] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#006768] text-white flex items-center justify-center font-mono text-xs">
                1
              </span>
              Direct Base Condition
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              If there exists a production <code className="font-mono bg-white px-1 rounded">A → aγ</code> or{' '}
              <code className="font-mono bg-white px-1 rounded">A → Baγ</code>, then terminal{' '}
              <strong className="text-gray-900">a</strong> is immediately placed into Leading(A).
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-1">
            <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#006768] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#006768] text-white flex items-center justify-center font-mono text-xs">
                2
              </span>
              Transitive Propagation
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              If <code className="font-mono bg-white px-1 rounded">A → Bγ</code>, then every terminal already present in
              Leading(B) bubbles up into Leading(A) via closure until fixed-point convergence is reached.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-1">
            <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-[#835400] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#F2A93B] text-black flex items-center justify-center font-mono text-xs font-bold">
                3
              </span>
              Trailing Dual Symmetrical
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Conversely, <code className="font-mono bg-white px-1 rounded">A → γa</code> or{' '}
              <code className="font-mono bg-white px-1 rounded">A → γaB</code> introduces{' '}
              <strong className="text-gray-900">a ∈ Trailing(A)</strong>, and{' '}
              <code className="font-mono bg-white px-1 rounded">A → γB</code> propagates Trailing(B) into Trailing(A).
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Split Panels (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Deduction Card (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Active Deduction Card */}
          <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F2A93B]/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#835400] text-[18px]">functions</span>
                <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                  Deduction: {activeTab === 'leading' ? 'Leading' : 'Trailing'}({activeStep?.nt || 'T'})
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-bold">
                {activeStep?.ruleTitle || 'Rule Trace'}
              </span>
            </div>

            {/* Invariance Principle Statement */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs flex flex-col gap-1">
              <div className="font-mono font-bold text-[#835400] uppercase text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">rule</span>
                <span>Operator {activeTab === 'leading' ? 'Leading' : 'Trailing'} Invariance Principle</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {activeTab === 'leading'
                  ? 'For production A → a... or A → Ba..., terminal a ∈ Leading(A). If A → B..., then Leading(A) ⊇ Leading(B).'
                  : 'For production A → ...a or A → ...aB, terminal a ∈ Trailing(A). If A → ...B, then Trailing(A) ⊇ Trailing(B).'}
              </p>
            </div>

            {/* Deduction Breakdown Details */}
            <div className="flex flex-col gap-2 pt-1 text-xs">
              <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                Step-by-Step Contributions
              </span>

              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#835400]"></span>
                    {activeStep?.ruleTitle || '1. Direct Terminal Extraction'}
                  </span>
                  {activeStep?.delta && (
                    <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-[#CDEFD9] text-[#196B3E] font-bold">
                      {activeStep.delta}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 pl-2 leading-relaxed">
                  {activeStep?.deductionNotes ||
                    'Evaluating boundary terminals along the derivation frontier.'}
                </p>
              </div>

              {/* Transitive Bubble Flow Diagram (SVG) */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  Transitive Bubble Flow
                </span>
                <svg className="w-full h-20" viewBox="0 0 360 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 80 40 L 160 40" stroke="#BDC9C9" strokeDasharray="4 4" strokeWidth="2" />
                  <path d="M 220 40 L 290 40" stroke="#008284" strokeWidth="2" />
                  <circle cx="160" cy="40" r="3" fill="#008284" />
                  <polygon points="290,36 298,40 290,44" fill="#008284" />

                  {/* Node 1 */}
                  <rect x="10" y="18" width="70" height="44" rx="8" fill="#FFFFFF" stroke="#E3DCCD" strokeWidth="1" />
                  <text x="45" y="36" textAnchor="middle" fill="#191B24" fontFamily="Bricolage Grotesque" fontSize="13" fontWeight="700">
                    NT: F
                  </text>
                  <text x="45" y="50" textAnchor="middle" fill="#575B6D" fontFamily="JetBrains Mono" fontSize="9">
                    {'{ (, id }'}
                  </text>

                  {/* Operator Bubble */}
                  <circle cx="140" cy="40" r="14" fill="#CDEFD9" stroke="#2E9E6B" strokeWidth="1.5" />
                  <text x="140" y="45" textAnchor="middle" fill="#196B3E" fontFamily="JetBrains Mono" fontSize="14" fontWeight="700">
                    {activeStep?.terminalExtracted || '*'}
                  </text>

                  {/* Active Target NT */}
                  <rect x="165" y="16" width="60" height="48" rx="8" fill="#FDB244" fillOpacity="0.2" stroke="#FDB244" strokeWidth="2" />
                  <text x="195" y="36" textAnchor="middle" fill="#191B24" fontFamily="Bricolage Grotesque" fontSize="14" fontWeight="700">
                    NT: {activeStep?.nt || 'T'}
                  </text>
                  <text x="195" y="50" textAnchor="middle" fill="#835400" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600">
                    {activeTab === 'leading' ? 'Leading' : 'Trailing'}
                  </text>

                  {/* Node Target */}
                  <rect x="290" y="18" width="60" height="44" rx="8" fill="#EDEDFA" stroke="#E3DCCD" strokeWidth="1" />
                  <text x="320" y="36" textAnchor="middle" fill="#575B6D" fontFamily="Bricolage Grotesque" fontSize="13" fontWeight="700">
                    NT: E
                  </text>
                  <text x="320" y="50" textAnchor="middle" fill="#575B6D" fontFamily="JetBrains Mono" fontSize="9">
                    Pass 2
                  </text>
                </svg>
              </div>
            </div>

            {/* Accumulated State Banner */}
            <div className="mt-1 p-3 rounded-lg bg-gray-100 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Accumulated State</span>
                <div className="font-mono text-sm font-bold flex items-center gap-1.5 flex-wrap text-gray-900">
                  <span>
                    {activeTab === 'leading' ? 'Leading' : 'Trailing'}({activeStep?.nt || 'T'}) = {'{ '}
                  </span>
                  {(activeStep?.currentSet || ['*', ')', 'id']).map((term, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-white text-[#006768] font-bold border border-gray-300">
                        {term}
                      </span>
                      {i < (activeStep?.currentSet.length || 0) - 1 && <span className="text-gray-400">,</span>}
                    </span>
                  ))}
                  <span>{' }'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#196B3E] font-bold bg-[#CDEFD9] px-2.5 py-1 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                <span>{activeStep?.delta || '+1 New Terminal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Terminal Sets Ledger & Inductive Log (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Terminal Sets Ledger Table Card */}
          <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006768] text-[20px]">table_chart</span>
                <h2 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                  Terminal Sets Ledger
                </h2>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#006768]"></span>
                <span>Live Accumulation Table</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Tracking Leading boundary terminals alongside inductive Trailing set evolution.
            </p>

            {/* The Table */}
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold">Non-Terminal</th>
                    <th className="py-2.5 px-3 font-bold">Leading Set</th>
                    <th className="py-2.5 px-3 font-bold">Trailing Set</th>
                    <th className="py-2.5 px-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validation.nonTerminals.map((nt) => {
                    const lSet = visibleLeading[nt] || [];
                    const tSet = visibleTrailing[nt] || [];
                    const isTarget = activeStep?.nt === nt;
                    const isLeadingDone = activeTab === 'trailing' || viewMode === 'all' || (lSet.length > 0 && lSet.length === (setsData.leading[nt] || []).length);
                    const isTrailingDone = viewMode === 'all' || (activeTab === 'trailing' && tSet.length > 0 && tSet.length === (setsData.trailing[nt] || []).length);

                    return (
                      <tr
                        key={nt}
                        className={`transition-colors ${
                          isTarget ? 'bg-[#ffddb5]/25 font-bold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-[#835400] text-sm flex items-center gap-1">
                          {isTarget && <span className="w-1.5 h-1.5 rounded-full bg-[#835400]"></span>}
                          <span>{nt}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-semibold ${lSet.length > 0 ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-400 border border-dashed border-gray-200'}`}>
                            {lSet.length > 0 ? '{ ' + lSet.join(', ') + ' }' : '∅ (empty)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-semibold ${tSet.length > 0 ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-400 border border-dashed border-gray-200'}`}>
                            {tSet.length > 0 ? '{ ' + tSet.join(', ') + ' }' : '∅ (empty)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isTarget ? (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#ffddb5] text-[#835400] font-bold">
                              Active Step {String(safeIndex + 1).padStart(2, '0')}
                            </span>
                          ) : (activeTab === 'leading' ? isLeadingDone : isTrailingDone) ? (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              {viewMode === 'all' || safeIndex === totalSteps - 1 ? 'Completed' : 'Updated'}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Micro Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-gray-200"></span> Dimmed: Reference
                </span>
                <span className="flex items-center gap-1 text-[#196B3E] font-semibold">
                  <span className="w-2.5 h-2.5 rounded bg-[#CDEFD9] border border-[#2E9E6B]"></span> Green: Derived
                </span>
                <span className="flex items-center gap-1 text-[#835400] font-semibold">
                  <span className="w-2.5 h-2.5 rounded bg-[#ffddb5]"></span> Active Target
                </span>
              </div>
              <span>Fixed-point terminates on zero delta</span>
            </div>
          </div>

          {/* Inductive Scan Step Log Card */}
          <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#835400] text-[20px]">receipt_long</span>
                <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                  Inductive Scan Step Log
                </h3>
              </div>
              <span className="font-mono text-xs text-gray-500">Sequential Proof Sequence</span>
            </div>

            {/* Chronological Step Items */}
            <div className="flex flex-col gap-1.5 font-mono text-xs max-h-56 overflow-y-auto pr-1">
              {currentStepsList.map((step, idx) => {
                const isCurrent = idx === safeIndex;
                const isPast = idx < safeIndex;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex(idx);
                    }}
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-[#ffddb5] text-[#835400] font-bold shadow-2xs'
                        : isPast
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'bg-gray-50/60 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isCurrent
                            ? 'bg-[#F2A93B] text-black'
                            : isPast
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        #{String(step.id).padStart(2, '0')}
                      </span>
                      <span>{step.production}</span>
                      <span className="text-gray-500 font-normal">→ {step.ruleCode}</span>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] uppercase font-bold text-[#835400]">Current</span>
                    ) : isPast ? (
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">done</span>
                    ) : (
                      <span className="text-[10px] uppercase text-gray-400">Queued</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LOWER REFERENCE SECTION (Shifted Downwards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Grammar Specifications Card */}
        <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006768] text-[18px]">menu_book</span>
              <h2 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                Grammar Specifications
              </h2>
            </div>
            <span className="font-mono text-[11px] text-gray-500 uppercase tracking-wider">Operator Grammar</span>
          </div>
          <p className="text-xs text-gray-600">
            Productions must be free of empty transitions (ε) and have no consecutive non-terminals.
          </p>

          {/* Grammar Rules List */}
          <div className="flex flex-col gap-1.5 font-mono text-xs">
            {validation.productions.map((p, idx) => {
              const isActive = activeStep?.production.startsWith(p.lhs);
              return (
                <div
                  key={p.lhs}
                  className={`p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#FEF6E9] border border-[#F2A93B]/50 shadow-2xs'
                      : 'bg-gray-50 border border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${isActive ? 'text-[#835400]' : 'text-gray-400'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <strong className="text-[#835400] font-bold">{p.lhs}</strong> → {p.rhsList.join(' | ')}
                    </span>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F2A93B] text-black">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Resolved</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Field Note & Pass Status */}
        <div className="flex flex-col gap-4">
          <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-start gap-3 text-xs text-gray-600">
            <span className="material-symbols-outlined text-[#835400] text-[20px] shrink-0 mt-0.5">school</span>
            <div>
              <strong className="font-semibold text-gray-800">Compiler Design Note:</strong> In bottom-up operator
              precedence parsers, boundary sets determine the exact handles during shift/reduce actions without
              ambiguity. Fixed-point iteration terminates once a pass yields no new terminal insertions into any non-terminal set.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2.5 text-xs">
            <span className="material-symbols-outlined text-[#006768] text-[20px] shrink-0 mt-0.5">autorenew</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-[#006768] font-bold uppercase tracking-wider">
                Fixed-Point Iteration Logic
              </span>
              <p className="text-gray-600">
                Evaluating boundary seeds and direct inheritances. Once no new terminals are added across a complete iteration cycle, fixed-point convergence is guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Grammar Input</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="material-symbols-outlined text-[18px] text-[#006768]">info</span>
          <span>Boundary sets computed. Proceed to operator precedence relation matrix.</span>
        </div>

        <button
          onClick={onProceed}
          className="px-5 py-2.5 rounded-lg bg-[#006768] hover:bg-[#004f51] text-white text-xs md:text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>Proceed to Precedence Matrix</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

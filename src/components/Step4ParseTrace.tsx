import React, { useState, useEffect } from 'react';
import { GrammarValidationResult, PrecedenceMatrixData, ParseStep } from '../types';
import { simulateShiftReduceParse } from '../utils/compilerEngine';
import { DerivationTreeModal } from './DerivationTreeModal';

interface Step4ParseTraceProps {
  validation: GrammarValidationResult;
  matrixData: PrecedenceMatrixData;
  onBack: () => void;
}

export const Step4ParseTrace: React.FC<Step4ParseTraceProps> = ({
  validation,
  matrixData,
  onBack,
}) => {
  const [inputString, setInputString] = useState<string>('id + id * id');
  const [steps, setSteps] = useState<ParseStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState<boolean>(false);

  // Compute parse trace when input or matrix changes
  const runParser = (strToParse: string, autoPlay: boolean = false) => {
    const res = simulateShiftReduceParse(strToParse, matrixData, validation);
    setSteps(res);
    setCurrentStepIndex(0);
    if (autoPlay) {
      setViewMode('step');
      setIsPlaying(true);
    }
  };

  const handleStartParse = () => {
    runParser(inputString, true);
  };

  const handleSelectPreset = (str: string) => {
    setInputString(str);
    runParser(str, true);
  };

  useEffect(() => {
    runParser(inputString, false);
  }, [inputString, matrixData]);

  // Auto-play stepper
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, steps.length, playbackSpeed]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        setIsPlaying(false);
        setCurrentStepIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steps.length]);

  const totalStepsCount = Math.max(steps.length, 1);
  const safeIndex = Math.min(currentStepIndex, totalStepsCount - 1);
  const activeStep: ParseStep | undefined = steps[safeIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleFastForward = () => {
    setIsPlaying(false);
    setCurrentStepIndex(steps.length - 1);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(steps, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `parsewise_trace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isCompleted = viewMode === 'all' || safeIndex >= steps.length - 1;
  const lastStep = steps[steps.length - 1];
  const isAccepted = isCompleted && lastStep?.action === 'ACCEPT';
  const isRejected = isCompleted && lastStep?.action === 'SYNTAX ERROR';
  const visibleSteps = viewMode === 'all' ? steps : steps.slice(0, safeIndex + 1);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans'] select-none">
      {/* Top Workspace Header & Metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#835400] font-bold px-2 py-0.5 rounded bg-[#ffddb5]">
              Execution Stage · Final
            </span>
            <span className="font-mono text-xs text-gray-500">Session ID: #OP-8824-SYN</span>
          </div>
          <h1 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl text-on-surface font-extrabold tracking-tight">
            String Parser Step Trace
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            Interactive bottom-up shift-reduce parsing guided by operator precedence relations.
          </p>
        </div>

        {/* Live Metric Badges */}
        <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto">
          <div className="bg-white border border-[#DDD6C5] px-3.5 py-2 rounded-xl shadow-2xs flex flex-col">
            <span className="font-mono text-[10px] uppercase text-gray-500">Current Action</span>
            <span className="font-mono text-xs text-[#006768] font-bold">
              {activeStep?.action || 'INITIAL'}
            </span>
          </div>
          <div className="bg-white border border-[#DDD6C5] px-3.5 py-2 rounded-xl shadow-2xs flex flex-col">
            <span className="font-mono text-[10px] uppercase text-gray-500">Step Progress</span>
            <span className="font-mono text-xs text-[#835400] font-bold">
              {String(safeIndex + 1).padStart(2, '0')} / {String(totalStepsCount).padStart(2, '0')}
            </span>
          </div>
          <div className="bg-white border border-[#DDD6C5] px-3.5 py-2 rounded-xl shadow-2xs flex flex-col">
            <span className="font-mono text-[10px] uppercase text-gray-500">Status</span>
            <span
              className={`font-mono text-xs font-bold ${
                isAccepted
                  ? 'text-[#006768]'
                  : isRejected
                  ? 'text-red-700'
                  : 'text-[#835400]'
              }`}
            >
              {isAccepted ? 'Accepted' : isRejected ? 'Syntax Error' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Input Bar & Presets */}
      <div className="w-full bg-white p-4 md:p-5 rounded-xl border border-[#DDD6C5] shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-sm">
                w =
              </div>
              <input
                type="text"
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                placeholder="e.g. id + id * id"
                spellCheck="false"
                className="w-full pl-12 pr-4 py-2 bg-gray-50 text-gray-900 font-mono text-sm rounded-lg border border-[#DDD6C5] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006768] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-gray-600 border border-gray-200">
              <span className="font-mono text-[11px] uppercase font-bold text-gray-700">End Marker</span>
              <span className="font-mono text-sm text-[#006768] font-bold px-1.5 bg-white rounded border border-gray-300">
                $
              </span>
            </div>

            <button
              onClick={handleStartParse}
              className="px-5 py-2 bg-[#006768] hover:bg-[#004f51] text-white font-semibold text-xs md:text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              <span>Start Parse</span>
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Quick Presets:</span>
          <button
            onClick={() => handleSelectPreset('id + id * id')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[#006768] font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>id + id * id (Accept)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('( id + id ) * id')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[#006768] font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>( id + id ) * id (Accept)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('id + * id')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>id + * id (Reject: no left operand)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('+ id')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>+ id (Reject: leading +)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('id * * id')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>id * * id (Reject: double *)</span>
          </button>
          <button
            onClick={() => handleSelectPreset('( )')}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-red-700 font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            <span>( ) (Reject: empty parens)</span>
          </button>
        </div>
      </div>

      {/* Interactive Runner Strip & Shortcuts */}
      <div className="w-full bg-gray-100 p-3 rounded-xl border border-[#DDD6C5] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          {/* Stepper View Mode Toggle */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-gray-200 text-xs shadow-2xs">
            <button
              onClick={() => setViewMode('step')}
              className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
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
              className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
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
              disabled={currentStepIndex === 0}
              className="px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-800 rounded-lg border border-[#DDD6C5] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer text-xs font-medium"
              title="Previous Step (Left Arrow)"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Prev</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 font-medium text-xs rounded-lg border border-[#DDD6C5] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#835400]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-3.5 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
              title="Next Step (Right Arrow)"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-black rounded-lg border border-[#DDD6C5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
              title="Reset (R)"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>

            <button
              onClick={handleFastForward}
              className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-black rounded-lg border border-[#DDD6C5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
              title="Skip to end"
            >
              <span className="material-symbols-outlined text-[16px]">fast_forward</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Speed</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.25"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-20 accent-[#006768] cursor-pointer"
            />
            <span className="font-mono text-xs text-gray-700 font-semibold">{playbackSpeed.toFixed(1)}x</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-gray-500">
            <span>Hints:</span>
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#DDD6C5] text-gray-700 text-[10px]">←</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#DDD6C5] text-gray-700 text-[10px]">→</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#DDD6C5] text-gray-700 text-[10px]">Space</kbd>
            <kbd className="px-1 py-0.5 rounded bg-white border border-[#DDD6C5] text-gray-700 text-[10px]">R</kbd>
          </div>
        </div>
      </div>

      {/* Main Parser Workspace Split Panels (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Live Parser Configuration View (5 cols on xl, 6 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl p-4 md:p-5 border border-[#DDD6C5] shadow-xs flex flex-col gap-3.5 relative overflow-hidden">
            {/* Notebook Corner Tape Accent */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#ffddb5]/50 rotate-45 pointer-events-none"></div>

            {/* Panel Title */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006768] text-[20px]">layers</span>
                <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">
                  Live Parser State
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffddb5] text-[#835400] font-bold">
                Step #{String(safeIndex + 1).padStart(2, '0')} / {String(totalStepsCount).padStart(2, '0')}
              </span>
            </div>

            {/* Top Terminal vs Next Lookahead Strip */}
            <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-[11px] uppercase text-gray-500 font-bold">Evaluated Relation:</span>
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-gray-300 shadow-2xs font-mono">
                  <span className="font-bold text-gray-900">{activeStep?.topTerm || '$'}</span>
                  <span
                    className={`font-bold px-1 rounded ${
                      activeStep?.relation === '⋖'
                        ? 'text-[#3B6FD8] bg-blue-50'
                        : activeStep?.relation === '⋗'
                        ? 'text-[#E8603C] bg-orange-50'
                        : 'text-[#8E5BD9] bg-purple-50'
                    }`}
                  >
                    {activeStep?.relation || '⋖'}
                  </span>
                  <span className="font-bold text-gray-900">{activeStep?.lookahead || 'id'}</span>
                </div>
                <span className="text-gray-400 font-mono text-xs">⇒</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                    activeStep?.relType === 'shift'
                      ? 'bg-blue-100 text-[#3B6FD8]'
                      : activeStep?.relType === 'reduce'
                      ? 'bg-orange-100 text-[#E8603C]'
                      : activeStep?.relType === 'accept'
                      ? 'bg-emerald-100 text-[#006768]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {activeStep?.actionBadge || 'SHIFT TO STACK'}
                </span>
              </div>

              <div className="text-gray-600 font-mono text-xs flex items-center gap-1 pt-0.5">
                <span className="material-symbols-outlined text-[15px] text-[#006768] shrink-0">psychology</span>
                <span>{activeStep?.reason || 'Evaluation based on operator precedence relations'}</span>
              </div>
            </div>

            {/* Stack Representation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="uppercase text-gray-500 font-bold tracking-wider">Stack (Bottom → Top)</span>
                <span className="text-[#835400] font-medium text-[11px]">Amber: handle</span>
              </div>
              <div className="p-3.5 bg-[#F6F2EA] rounded-xl border border-[#DDD6C5] flex flex-col gap-2 min-h-[90px] justify-center">
                {/* Stack Chips Flow */}
                <div className="flex items-center flex-wrap gap-1.5 text-gray-900 z-10 font-mono">
                  {activeStep?.stack.map((item, i) => {
                    const isHandle =
                      activeStep.handle &&
                      (activeStep.handle.split(' ').includes(item) || activeStep.handle === item);
                    const isLast = i === activeStep.stack.length - 1;

                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        {isHandle && isLast ? (
                          <div className="relative group">
                            <div className="px-2.5 py-1 bg-[#F2A93B] rounded-md font-bold text-black shadow-xs text-xs">
                              {item}
                            </div>
                            <div className="absolute -bottom-4 left-0 right-0 flex flex-col items-center">
                              <span className="font-mono text-[8px] uppercase text-[#835400] font-extrabold whitespace-nowrap">
                                Handle [{activeStep.handle}]
                              </span>
                            </div>
                          </div>
                        ) : item === '$' || item === '+' || item === '*' || item === '(' || item === ')' ? (
                          <div className="px-2.5 py-1 bg-gray-200 rounded-md font-bold text-gray-800 shadow-2xs border border-gray-300 text-xs">
                            {item}
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 bg-white rounded-md font-bold text-[#006768] shadow-2xs border border-gray-300 text-xs">
                            {item}
                          </div>
                        )}

                        {i < activeStep.stack.length - 1 && (
                          <span className="text-gray-400 font-bold text-[11px]">⋖</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Remaining Input Stream */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="uppercase text-gray-500 font-bold tracking-wider">Remaining Input Buffer</span>
                <span className="text-[#006768] font-medium text-[11px]">Lookahead cursor</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-1 shrink-0 font-mono text-xs text-[#006768] font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                  <span className="uppercase">Lookahead:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {activeStep?.input.map((tok, i) => {
                    if (i === 0) {
                      return (
                        <div key={i} className="flex items-center">
                          <div className="px-2.5 py-0.5 bg-[#006768] text-white rounded font-bold shadow-2xs text-xs">
                            {tok}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={`px-2.5 py-0.5 bg-white rounded shadow-2xs border border-gray-200 text-xs ${
                          tok === '$' ? 'text-gray-400 font-bold' : 'text-gray-800 font-medium'
                        }`}
                      >
                        {tok}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Execution Ledger Trace Table (7 cols on xl, 6 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-gray-100 border-b border-[#DDD6C5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-800 text-[18px]">table_rows</span>
                <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                  Execution Ledger Trace
                </h3>
              </div>
              <span className="font-mono text-xs text-gray-500">
                {viewMode === 'step' ? `Showing ${visibleSteps.length} of ${steps.length} steps` : 'Showing all steps'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] tracking-wider border-b border-gray-200">
                    <th className="py-2.5 px-3">Step</th>
                    <th className="py-2.5 px-3">Stack Content</th>
                    <th className="py-2.5 px-3 text-center">Relation</th>
                    <th className="py-2.5 px-3">Remaining Input</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Handle / Production</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleSteps.map((st, idx) => {
                    const isSelected = idx === safeIndex;

                    return (
                      <tr
                        key={st.step}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentStepIndex(idx);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#ffddb5] text-[#835400] font-bold shadow-2xs'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-gray-500 font-bold">
                          {String(st.step).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{st.stack.join(' ')}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              st.relation === '⋖'
                                ? 'text-[#3B6FD8] bg-blue-50'
                                : st.relation === '⋗'
                                ? 'text-[#E8603C] bg-orange-50'
                                : st.relation === '≐'
                                ? 'text-[#8E5BD9] bg-purple-50'
                                : 'text-red-700 bg-red-50'
                            }`}
                          >
                            {st.relation}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">{st.input.join(' ')}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              st.action === 'SHIFT'
                                ? 'bg-blue-100 text-[#3B6FD8]'
                                : st.action === 'REDUCE'
                                ? 'bg-orange-100 text-[#E8603C]'
                                : st.action === 'ACCEPT'
                                ? 'bg-emerald-100 text-[#006768]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {st.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {st.handle
                            ? st.productionApplied
                              ? `Handle [${st.handle}] ⇒ ${st.productionApplied}`
                              : `Handle [${st.handle}] matches no production`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {viewMode === 'step' && steps.length > visibleSteps.length && (
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F2A93B] animate-pulse"></span>
                  <span>+ {steps.length - visibleSteps.length} more step(s) pending in parse sequence...</span>
                </span>
                <span className="text-gray-400">Click Next to step through</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Input Config, Verdict Banner & Auxiliary Info (Shifted Downwards) */}
      <div className="flex flex-col gap-4">
        {/* Large Verdict Banner (Displayed upon completion) */}
        {isAccepted ? (
          <div className="w-full bg-[#E5F7EC] text-gray-900 p-4 md:p-5 rounded-xl border border-[#2E9E6B]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#2E9E6B]"></div>
            <div className="flex items-start gap-3.5 pl-2">
              <div className="w-10 h-10 rounded-xl bg-[#2E9E6B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-[#14532D]">
                    ACCEPT — Input String Verified & Conforms to Grammar
                  </h2>
                  <span className="px-2 py-0.2 bg-[#CDEFD9] text-[#14532D] font-mono text-[11px] font-bold rounded">
                    Valid Syntax
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[#1E3A2F] leading-relaxed">
                  String <code className="font-mono font-bold px-1 bg-[#CDEFD9] rounded">{inputString}</code> parsed
                  successfully! Stack cleanly reduced to grammar start symbol{' '}
                  <code className="font-mono font-bold">{validation.startSymbol}</code> with both sentinel markers
                  synchronized (<code className="font-mono font-bold text-[#006768]">$ ≐ $</code>).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={() => setIsTreeModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-[#DDD6C5] shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span>Derivation Tree</span>
              </button>
            </div>
          </div>
        ) : isRejected ? (
          <div className="w-full bg-[#ffdad6] text-[#93000a] p-4 md:p-5 rounded-xl border border-[#ba1a1a]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#ba1a1a]"></div>
            <div className="flex items-start gap-3.5 pl-2">
              <div className="w-10 h-10 rounded-xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-[#93000a]">
                    REJECT — Syntax Error Detected in Input Stream
                  </h2>
                  <span className="px-2 py-0.2 bg-[#93000a] text-white font-mono text-[11px] font-bold rounded">
                    Syntax Error
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[#5B1015] leading-relaxed">
                  {lastStep?.reason ||
                    `Parsing halted. The operator precedence relation for top terminal '${activeStep?.topTerm}' and lookahead '${activeStep?.lookahead}' is blank (∅) or invalid.`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white text-gray-700 p-3.5 rounded-xl border border-[#DDD6C5] shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006768] animate-pulse"></span>
              <span>Parsing in progress · Step {safeIndex + 1} of {steps.length}</span>
            </div>
            <span className="text-gray-500 font-mono">Advance using 'Next' or 'Auto-Play' to evaluate shift/reduce actions</span>
          </div>
        )}
      </div>

      {/* Bottom Contextual Navigation Strip */}
      <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-[#DDD6C5] hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Precedence Matrix</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-white border border-[#DDD6C5] hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Trace Log (.json)</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Parser</span>
          </button>
        </div>
      </div>

      {/* Derivation Tree Modal */}
      <DerivationTreeModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        inputString={inputString}
        steps={steps}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  GrammarValidationResult,
  LeadingTrailingData,
  PrecedenceMatrixData,
  PrecedenceCell,
  DerivationTraceItem,
} from '../types';

interface Step3PrecedenceTableProps {
  validation: GrammarValidationResult;
  setsData: LeadingTrailingData;
  matrixData: PrecedenceMatrixData;
  onProceed: () => void;
  onBack: () => void;
  onLoadPreset: (presetId: string) => void;
}

export const Step3PrecedenceTable: React.FC<Step3PrecedenceTableProps> = ({
  validation,
  setsData,
  matrixData,
  onProceed,
  onBack,
  onLoadPreset,
}) => {
  const isConflicting = !matrixData.isPrecedenceGrammar;
  const conflictList = matrixData.conflicts;
  const [selectedConflictKey, setSelectedConflictKey] = useState<string>(
    conflictList.length > 0 ? `${conflictList[0].row}-${conflictList[0].col}` : ''
  );
  const [currentTraceStep, setCurrentTraceStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tableMode, setTableMode] = useState<'step' | 'all'>('step');
  const [filterMode, setFilterMode] = useState<'all' | 'conflicts'>('all');

  const traceLog = matrixData.derivationLog;
  const maxTraceSteps = Math.max(traceLog.length, 1);
  const activeLogItem: DerivationTraceItem | undefined =
    traceLog.find((item) => item.step === currentTraceStep) || traceLog[0];

  useEffect(() => {
    if (conflictList.length > 0 && !conflictList.some((c) => `${c.row}-${c.col}` === selectedConflictKey)) {
      setSelectedConflictKey(`${conflictList[0].row}-${conflictList[0].col}`);
    }
  }, [conflictList, selectedConflictKey]);

  // Auto-play for step-by-step matrix derivation in valid state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTraceStep((prev) => {
          if (prev >= maxTraceSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxTraceSteps]);

  // Incrementally compute visible precedence matrix in step-by-step mode
  const visibleMatrix = React.useMemo(() => {
    if (tableMode === 'all' || isConflicting) {
      return matrixData.cells;
    }
    const cells: Record<string, Record<string, PrecedenceCell>> = {};
    const relTracker: Record<string, Record<string, Set<'⋖' | '⋗' | '≐'>>> = {};

    matrixData.terminals.forEach((r) => {
      cells[r] = {};
      relTracker[r] = {};
      matrixData.terminals.forEach((c) => {
        relTracker[r][c] = new Set();
      });
    });

    const activeLogs = traceLog.filter((item) => item.step <= currentTraceStep);
    activeLogs.forEach((item) => {
      if (item.row && item.col && (item.symbol === '⋖' || item.symbol === '⋗' || item.symbol === '≐')) {
        relTracker[item.row]?.[item.col]?.add(item.symbol as '⋖' | '⋗' | '≐');
      }
    });

    matrixData.terminals.forEach((r) => {
      matrixData.terminals.forEach((c) => {
        const rels = Array.from(relTracker[r]?.[c] || []);
        let primary: 'yields' | 'takes' | 'equals' | 'conflict' | 'accept' | 'blank' = 'blank';
        let displaySymbol = '—';
        const isConflict = rels.length > 1;

        if (r === '$' && c === '$') {
          primary = 'accept';
          displaySymbol = 'ACCEPT';
        } else if (isConflict) {
          primary = 'conflict';
          displaySymbol = rels.join(' / ');
        } else if (rels.includes('⋖')) {
          primary = 'yields';
          displaySymbol = '⋖';
        } else if (rels.includes('⋗')) {
          primary = 'takes';
          displaySymbol = '⋗';
        } else if (rels.includes('≐')) {
          primary = 'equals';
          displaySymbol = '≐';
        }

        cells[r][c] = {
          row: r,
          col: c,
          relations: rels,
          primaryRelation: primary,
          displaySymbol,
          isConflict,
        };
      });
    });

    return cells;
  }, [matrixData, tableMode, isConflicting, traceLog, currentTraceStep]);

  const activeConflict =
    conflictList.find((c) => `${c.row}-${c.col}` === selectedConflictKey) || conflictList[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-['IBM_Plex_Sans']">
      {/* Top Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                isConflicting ? 'bg-red-100 text-red-700' : 'bg-[#ffddb5] text-[#835400]'
              }`}
            >
              {isConflicting ? 'Conflict Analysis Mode' : 'Analytical Notebook Stage III'}
            </span>
            <span className="text-gray-400 font-mono">•</span>
            <span className="font-mono text-xs text-gray-600">
              {isConflicting ? 'Shift/Reduce Mathematical Validation' : 'Formal Derivation: Floyd (1963) Algorithm'}
            </span>
          </div>

          <h1 className="font-['Bricolage_Grotesque'] text-2xl md:text-3xl text-on-surface font-extrabold tracking-tight">
            Operator Precedence Relation Table {isConflicting ? '(Conflict State)' : ''}
          </h1>

          <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm text-gray-600 font-mono">
            <span className="px-2 py-0.5 rounded bg-white border border-[#DDD6C5] font-semibold text-[#006768]">
              Grammar:
            </span>
            <span className="font-bold text-gray-900">
              {validation.productions.map((p) => `${p.lhs} → ${p.rhsList.join(' | ')}`).join('; ')}
            </span>
            <span className="text-gray-400">|</span>
            <span>Terminals: {'{ ' + matrixData.terminals.join(', ') + ' }'}</span>
          </div>
        </div>

        {/* Target Grammar Card or Toggle */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <label className="flex items-center gap-2 bg-white border border-[#DDD6C5] hover:bg-gray-50 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-colors text-xs">
            <input
              type="checkbox"
              checked={isConflicting}
              onChange={(e) => {
                if (e.target.checked) {
                  onLoadPreset('valid_ambiguous');
                } else {
                  onLoadPreset('valid_arithmetic');
                }
              }}
              className="w-4 h-4 text-[#006768] rounded focus:ring-0 cursor-pointer"
            />
            <span className="font-medium text-gray-800">Simulate Conflicting Grammar</span>
            <span className="font-mono text-gray-500 bg-gray-100 px-1 rounded">(E → E+E)</span>
          </label>
        </div>
      </div>

      {/* TOP PROMINENT CRIMSON BANNER (WHEN CONFLICTS EXIST) */}
      {isConflicting && conflictList.length > 0 && (
        <div className="w-full bg-[#ffdad6] text-[#93000a] rounded-xl border border-[#ba1a1a]/30 shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start justify-between relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[24px]">gpp_maybe</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Bricolage_Grotesque'] text-lg text-[#93000a] font-bold tracking-tight">
                  Precedence Ambiguity Detected
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#93000a] font-mono text-xs font-bold border border-[#ba1a1a]/30">
                  {conflictList.map((c) => `M[${c.row}, ${c.col}]`).join(', ')}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-800 font-medium leading-relaxed">
                Conflict detected at{' '}
                <code className="font-mono font-bold text-red-700 bg-white/80 px-1.5 py-0.5 rounded border border-red-200">
                  M[{activeConflict?.row || conflictList[0].row}, {activeConflict?.col || conflictList[0].col}]
                </code>
                : Relations{' '}
                <span className="font-mono font-bold text-red-700">
                  {'{ ' + (activeConflict?.relations || conflictList[0].relations).join(', ') + ' }'}
                </span>
                . This grammar is <strong className="text-red-700 font-bold uppercase">NOT</strong> an operator-precedence grammar.
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-gray-500">info</span>
                <span>
                  In practice, tools like Yacc settle these shift/reduce conflicts using declared operator associativity and precedence levels.
                </span>
              </p>
            </div>
          </div>
          {activeConflict && (
            <button
              onClick={() => setSelectedConflictKey(`${activeConflict.row}-${activeConflict.col}`)}
              className="shrink-0 px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
              <span>Examine M[{activeConflict.row}, {activeConflict.col}]</span>
            </button>
          )}
        </div>
      )}

      {/* Operational Toolbar (Stepwise Stepper vs Show All) */}
      <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-3 flex flex-wrap items-center justify-between gap-3">
        {!isConflicting ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs">
              <button
                onClick={() => setTableMode('step')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  tableMode === 'step' ? 'bg-white text-[#006768] font-bold shadow-xs' : 'text-gray-600'
                }`}
              >
                Step-by-step
              </button>
              <button
                onClick={() => {
                  setTableMode('all');
                  setCurrentTraceStep(maxTraceSteps);
                }}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  tableMode === 'all' ? 'bg-white text-[#006768] font-bold shadow-xs' : 'text-gray-600'
                }`}
              >
                Show all matrix
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentTraceStep(Math.max(1, currentTraceStep - 1))}
                disabled={currentTraceStep <= 1}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Previous step"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#006768] hover:bg-[#004f51] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause' : 'Auto-Step'}</span>
              </button>

              <button
                onClick={() => setCurrentTraceStep(Math.min(maxTraceSteps, currentTraceStep + 1))}
                disabled={currentTraceStep >= maxTraceSteps}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                title="Next step"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentTraceStep(1);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-700 flex items-center justify-center transition-colors ml-1 cursor-pointer"
                title="Reset steps"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg font-mono text-xs">
              <span className="text-gray-500 uppercase tracking-wider">Progress</span>
              <span className="font-bold text-[#006768]">
                Step {currentTraceStep} of {maxTraceSteps}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>{conflictList.length} Shift/Reduce Precedence Conflicts identified in current matrix</span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onProceed}
            className="px-4 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Proceed to Parse String</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: The Matrix Grid (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex flex-col">
                <h2 className="font-['Bricolage_Grotesque'] text-base md:text-lg font-bold text-gray-900">
                  Terminal Precedence Matrix <span className="font-mono text-[#006768] font-normal">M[row, col]</span>
                </h2>
                <span className="text-xs text-gray-500">
                  Row: <strong className="text-gray-800">Top stack terminal (a)</strong> · Column:{' '}
                  <strong className="text-gray-800">Lookahead terminal (b)</strong>
                </span>
              </div>
              <span className="font-mono text-xs text-gray-500">
                |Σ| = {matrixData.terminals.length} terminals ({matrixData.stats.total} relations)
              </span>
            </div>

            {/* Legend Badge Strip */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-[#E3EBFA] text-[#3B6FD8] font-bold flex items-center gap-1 border border-blue-200">
                <span>⋖</span>
                <span className="font-sans font-normal text-gray-700 text-[11px]">Yields (Shift)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#EDE4FA] text-[#8E5BD9] font-bold flex items-center gap-1 border border-purple-200">
                <span>≐</span>
                <span className="font-sans font-normal text-gray-700 text-[11px]">Equal (Shift)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FBE3DA] text-[#E8603C] font-bold flex items-center gap-1 border border-orange-200">
                <span>⋗</span>
                <span className="font-sans font-normal text-gray-700 text-[11px]">Takes (Reduce)</span>
              </span>
              {isConflicting && (
                <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-bold flex items-center gap-1 border border-red-300">
                  <span>⋖ / ⋗</span>
                  <span className="font-sans font-normal text-red-700 text-[11px]">Conflict</span>
                </span>
              )}
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50/50 p-1">
              <table className="w-full text-center border-collapse select-none font-mono">
                <thead>
                  <tr>
                    <th className="p-2 font-mono text-xs text-gray-500 bg-gray-100 text-left rounded-tl">
                      <span className="text-[10px] uppercase tracking-wider block">a \ b</span>
                    </th>
                    {matrixData.terminals.map((term) => {
                      const isColActive = !isConflicting && activeLogItem?.col === term;
                      return (
                        <th
                          key={term}
                          className={`p-2 font-mono font-bold text-sm transition-colors ${
                            isColActive ? 'bg-[#ffddb5] text-[#835400] ring-1 ring-[#F2A93B]' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {term}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white font-mono text-sm">
                  {matrixData.terminals.map((rowTerm) => {
                    const isRowActive = !isConflicting && activeLogItem?.row === rowTerm;

                    return (
                      <tr key={rowTerm} className="hover:bg-gray-50/70 transition-colors">
                        <td
                          className={`p-2 font-mono font-bold text-left transition-colors ${
                            isRowActive ? 'bg-[#ffddb5] text-[#835400] ring-1 ring-[#F2A93B]' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rowTerm}
                        </td>
                        {matrixData.terminals.map((colTerm) => {
                          const cell = visibleMatrix[rowTerm]?.[colTerm];
                          const isTargetCell = !isConflicting && activeLogItem?.row === rowTerm && activeLogItem?.col === colTerm;
                          const conflictKey = `${rowTerm}-${colTerm}`;
                          const isSelectedConflict = conflictKey === selectedConflictKey;

                          if (cell?.isConflict) {
                            return (
                              <td key={colTerm} className="p-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedConflictKey(conflictKey)}
                                  className={`w-full h-12 rounded-lg diagonal-stripes border-2 border-red-500 text-red-700 font-bold flex flex-col items-center justify-center shadow-xs transition-transform cursor-pointer ${
                                    isSelectedConflict ? 'conflict-cell-active scale-105' : 'hover:scale-105'
                                  }`}
                                  title={`Shift/Reduce Conflict: { ${cell.relations.join(', ')} }`}
                                >
                                  <span className="font-bold text-xs leading-none">{cell.displaySymbol}</span>
                                  <span className="text-[9px] font-mono uppercase font-bold text-red-800">
                                    Conflict
                                  </span>
                                </button>
                              </td>
                            );
                          }

                          if (rowTerm === '$' && colTerm === '$') {
                            return (
                              <td key={colTerm} className="p-1">
                                <div className="w-full h-12 rounded-lg bg-[#006768] text-white font-mono font-semibold text-xs flex items-center justify-center shadow-xs">
                                  ACCEPT
                                </div>
                              </td>
                            );
                          }

                          if (cell?.primaryRelation === 'yields') {
                            return (
                              <td key={colTerm} className="p-1">
                                <div
                                  className={`w-full h-12 rounded-lg font-bold text-base flex items-center justify-center shadow-xs transition-all ${
                                    isTargetCell
                                      ? 'bg-[#ffddb5] text-[#835400] ring-2 ring-[#F2A93B] shadow-sm animate-pulse'
                                      : 'bg-[#E3EBFA] text-[#3B6FD8] border border-blue-200'
                                  }`}
                                >
                                  ⋖
                                </div>
                              </td>
                            );
                          }

                          if (cell?.primaryRelation === 'takes') {
                            return (
                              <td key={colTerm} className="p-1">
                                <div
                                  className={`w-full h-12 rounded-lg font-bold text-base flex items-center justify-center shadow-xs transition-all ${
                                    isTargetCell
                                      ? 'bg-[#ffddb5] text-[#835400] ring-2 ring-[#F2A93B] shadow-sm animate-pulse'
                                      : 'bg-[#FBE3DA] text-[#E8603C] border border-orange-200'
                                  }`}
                                >
                                  ⋗
                                </div>
                              </td>
                            );
                          }

                          if (cell?.primaryRelation === 'equals') {
                            return (
                              <td key={colTerm} className="p-1">
                                <div className="w-full h-12 rounded-lg bg-[#EDE4FA] text-[#8E5BD9] border border-purple-200 font-bold text-base flex items-center justify-center shadow-xs">
                                  ≐
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={colTerm} className="p-1">
                              <div className="w-full h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-gray-400 font-mono text-xs flex items-center justify-center">
                                —
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footnote */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[15px] text-[#006768]">info</span>
                <span>Cell highlights reflect exact rule derivations</span>
              </span>
              <span className="font-mono">
                {matrixData.conflicts.length > 0
                  ? `${matrixData.conflicts.length} conflicting cells detected`
                  : 'Conflict-free operator precedence matrix'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Derivation Inspector or Conflict Inspector (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* IF CONFLICTING: Conflict Proof Inspector */}
          {isConflicting && activeConflict ? (
            <div className="w-full bg-white rounded-xl border border-red-300 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#ba1a1a] px-4 py-2.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
                  <h3 className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold tracking-tight">
                    Conflict Details: Cell M[{activeConflict.row}, {activeConflict.col}]
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-white text-red-700 font-mono text-xs font-bold uppercase">
                  {activeConflict.conflictBadge || 'Precedence Conflict'}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3 bg-white">
                {/* Derivation 1 (Yields) */}
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#3B6FD8] uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B6FD8]"></span>
                      {activeConflict.derivation1?.rule || 'Derivation 1 (Yields ⋖)'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#3B6FD8] bg-white border border-blue-200 px-2 py-0.5 rounded">
                      {activeConflict.row} ⋖ {activeConflict.col}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed mt-0.5">
                    {activeConflict.derivation1?.text ||
                      `From grammar rules: terminal '${activeConflict.row}' precedes a variable deriving leading '${activeConflict.col}'.`}
                  </p>
                  <div className="font-mono text-xs text-gray-600 bg-white p-1.5 rounded border border-blue-100">
                    {activeConflict.derivation1?.proof || `Proof: ${activeConflict.row} ⋖ ${activeConflict.col}`}
                  </div>
                </div>

                {/* Derivation 2 (Takes) */}
                <div className="p-3 rounded-lg bg-orange-50/70 border border-orange-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#E8603C] uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E8603C]"></span>
                      {activeConflict.derivation2?.rule || 'Derivation 2 (Takes ⋗)'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#E8603C] bg-white border border-orange-200 px-2 py-0.5 rounded">
                      {activeConflict.row} ⋗ {activeConflict.col}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed mt-0.5">
                    {activeConflict.derivation2?.text ||
                      `From grammar rules: variable trailing '${activeConflict.row}' precedes terminal '${activeConflict.col}'.`}
                  </p>
                  <div className="font-mono text-xs text-gray-600 bg-white p-1.5 rounded border border-orange-100">
                    {activeConflict.derivation2?.proof || `Proof: ${activeConflict.row} ⋗ ${activeConflict.col}`}
                  </div>
                </div>

                {/* Ambiguity Result Box */}
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-950 flex flex-col gap-1">
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-red-700 uppercase">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Parser Ambiguity Result</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {activeConflict.resultSummary ||
                      `Resulting relation set is { ${activeConflict.relations.join(', ')} }. Shift/reduce conflict blocks deterministic parsing.`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* IF VALID: Active Derivation Step Card */
            <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F2A93B]"></div>
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 pl-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#835400] text-[18px]">science</span>
                  <span className="font-['Bricolage_Grotesque'] text-sm md:text-base font-bold text-gray-900">
                    Active Derivation Step
                  </span>
                </div>
                <span className="font-mono text-xs bg-[#ffddb5] text-[#835400] font-bold px-2 py-0.5 rounded">
                  {activeLogItem?.ruleName || 'Rule 2'}
                </span>
              </div>

              <div className="bg-[#FEF6E9] p-3 rounded-lg flex flex-col gap-1 border border-[#F2A93B]/30">
                <span className="font-['Bricolage_Grotesque'] text-xs font-bold text-[#835400] uppercase tracking-wider">
                  {activeLogItem?.ruleName}
                </span>
                <p className="text-xs text-gray-800 leading-relaxed font-mono">
                  {activeLogItem?.reason ||
                    'Whenever terminal a directly precedes non-terminal B, a ⋖ b for all b ∈ Leading(B).'}
                </p>
              </div>

              {/* Micro Key-Value Grid */}
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex items-center justify-between py-1 bg-gray-50 px-2.5 rounded border border-gray-200">
                  <span className="text-gray-500">Origin Production:</span>
                  <span className="font-bold text-gray-900">{activeLogItem?.originProd || 'E → E + T'}</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-gray-50 px-2.5 rounded border border-gray-200">
                  <span className="text-gray-500">Anchor Terminal a:</span>
                  <span className="font-bold text-[#006768]">'{activeLogItem?.row}'</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-gray-50 px-2.5 rounded border border-gray-200">
                  <span className="text-gray-500">Target Non-Terminal:</span>
                  <span className="font-bold text-gray-900">{activeLogItem?.targetNT || 'T'}</span>
                </div>
                <div className="flex items-center justify-between py-1 bg-[#E3EBFA] px-2.5 rounded border border-blue-200">
                  <span className="text-gray-600 font-bold">Computed Cell:</span>
                  <span className="font-bold text-[#3B6FD8] flex items-center gap-1.5">
                    <span>
                      M[{activeLogItem?.row}, {activeLogItem?.col}] =
                    </span>
                    <span className="bg-[#3B6FD8] text-white px-1.5 py-0.2 rounded text-xs">
                      {activeLogItem?.symbol}
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-start gap-1.5 border border-gray-200">
                <span className="material-symbols-outlined text-[16px] text-[#835400] shrink-0 mt-0.5">lightbulb</span>
                <span>
                  Intuition: Operators lower in the grammar bind tighter, causing the parser to yield (⋖) to shift them
                  first.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOWER REFERENCE & LOG SECTION (Shifted Downwards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN (LOWER): Trace Log or Conflict Ledger */}
        {isConflicting ? (
          <div className="w-full bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <h3 className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">
                Conflict Ledger <span className="text-red-600 font-mono text-xs font-bold">({conflictList.length} items)</span>
              </h3>
              <span className="text-[11px] font-mono text-gray-400">Click to examine</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto pr-1">
              {conflictList.map((c) => {
                const key = `${c.row}-${c.col}`;
                const isSelected = key === selectedConflictKey;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedConflictKey(key)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 border-red-300 text-red-900 font-bold shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-white text-red-700 border border-red-200">
                        M[{c.row}, {c.col}]
                      </span>
                      <span className="font-sans text-xs">{c.conflictBadge || 'Shift/Reduce Conflict'}</span>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">chevron_right</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006768] text-[18px]">list_alt</span>
                <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">
                  Derivation Trace Log
                </span>
              </div>
              <span className="font-mono text-xs text-gray-400">Click step to focus</span>
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1 font-mono text-xs">
              {traceLog.map((log) => {
                const isSelected = log.step === currentTraceStep;

                return (
                  <div
                    key={log.step}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentTraceStep(log.step);
                    }}
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FEF6E9] border border-[#F2A93B]/50 font-bold shadow-2xs'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-gray-400 font-medium">#{String(log.step).padStart(2, '0')}</span>
                    <span className="text-gray-800">{log.source}</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded ${
                        log.symbol === '⋖'
                          ? 'text-[#3B6FD8] bg-blue-50'
                          : log.symbol === '⋗'
                          ? 'text-[#E8603C] bg-orange-50'
                          : 'text-[#8E5BD9] bg-purple-50'
                      }`}
                    >
                      {log.cellKey} = {log.symbol}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN (LOWER): Boundary Sets Reference & Suggested Fix */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900">
                Boundary Sets Reference
              </span>
              <span className="font-mono text-xs text-gray-500">Computed from Step ②</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-col gap-1 font-mono text-xs">
                <span className="text-[10px] font-bold uppercase text-[#006768]">
                  LEADING(A)
                </span>
                {validation.nonTerminals.map((nt) => (
                  <div key={nt} className="flex justify-between">
                    <span className="text-gray-600">Leading({nt})</span>
                    <span className="font-bold text-[#006768]">
                      {'{ ' + (setsData.leading[nt] || []).join(', ') + ' }'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-col gap-1 font-mono text-xs">
                <span className="text-[10px] font-bold uppercase text-[#835400]">
                  TRAILING(A)
                </span>
                {validation.nonTerminals.map((nt) => (
                  <div key={nt} className="flex justify-between">
                    <span className="text-gray-600">Trailing({nt})</span>
                    <span className="font-bold text-[#835400]">
                      {'{ ' + (setsData.trailing[nt] || []).join(', ') + ' }'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isConflicting && (
            <div className="bg-[#F0F7F7] rounded-xl border border-[#006768]/30 shadow-xs p-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[#006768] font-['Bricolage_Grotesque'] text-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                <span>Suggested Grammar Fix</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Disambiguate the grammar by introducing hierarchical non-terminals for addition and multiplication:
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-[#006768]/20 font-mono text-xs text-gray-900 leading-relaxed shadow-2xs">
                <span className="text-[#006768] font-bold">E</span> → E + T | T<br />
                <span className="text-[#006768] font-bold">T</span> → T * F | F<br />
                <span className="text-[#006768] font-bold">F</span> → ( E ) | id
              </div>
              <button
                type="button"
                onClick={() => onLoadPreset('valid_arithmetic')}
                className="w-full py-2 px-3 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                <span>Load this fixed grammar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CARD: Global Blocked or Back Action */}
      <div className="mt-2 bg-white rounded-xl border border-[#DDD6C5] shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {isConflicting ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">block</span>
            </div>
            <div>
              <span className="font-['Bricolage_Grotesque'] text-sm font-bold text-gray-900 block">
                Parsing is not possible with this grammar
              </span>
              <span className="text-xs text-gray-500">
                Shift/reduce decisions cannot be made until precedence conflicts are resolved.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#006768]"></span>
            <span>Precedence matrix generated without shift/reduce ambiguities.</span>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Grammar Input</span>
          </button>

          {isConflicting ? (
            <button
              onClick={onProceed}
              className="px-5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Proceed to Parse String (Inspect Conflicts)</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={onProceed}
              className="px-5 py-2 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Proceed to Parse String</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

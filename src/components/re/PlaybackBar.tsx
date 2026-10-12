import React from 'react';
import { StepPlayer } from './useStepPlayer';

interface PlaybackBarProps {
  player: StepPlayer;
  unitLabel?: string; // e.g. "node", "rule", "transition"
  /** one-line description of the current step, always visible in the dock */
  narration?: React.ReactNode;
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({ player, unitLabel = 'step', narration }) => {
  const { viewMode, index, total, isPlaying, speed } = player;

  return (
    <div className="sticky top-[106px] z-30 w-full bg-gray-100/95 backdrop-blur rounded-xl border border-[#DDD6C5] shadow-sm flex flex-col">
    <div className="w-full px-3 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center bg-white rounded-lg p-0.5 border border-gray-200 text-xs shadow-2xs">
          <button
            onClick={() => player.setViewMode('step')}
            className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
              viewMode === 'step' ? 'bg-[#006768] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Step-by-step
          </button>
          <button
            onClick={() => player.showAll()}
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
            onClick={player.prev}
            disabled={index === 0}
            className="px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-800 rounded-lg border border-[#DDD6C5] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer text-xs font-medium"
            title="Previous (Left Arrow)"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Prev</span>
          </button>

          <button
            onClick={() => player.setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 font-medium text-xs rounded-lg border border-[#DDD6C5] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Auto-play (Space)"
          >
            <span className="material-symbols-outlined text-[16px] text-[#835400]">{isPlaying ? 'pause' : 'play_arrow'}</span>
            <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
          </button>

          <button
            onClick={player.next}
            disabled={index >= total - 1}
            className="px-3.5 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            title="Next (Right Arrow)"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>

          <button
            onClick={player.reset}
            className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-black rounded-lg border border-[#DDD6C5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Reset (R)"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>

          <button
            onClick={player.showAll}
            className="p-1.5 bg-white hover:bg-gray-50 text-gray-600 hover:text-black rounded-lg border border-[#DDD6C5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Skip to end"
          >
            <span className="material-symbols-outlined text-[16px]">fast_forward</span>
          </button>
        </div>

        <span className="font-mono text-[11px] px-2 py-1 rounded bg-[#ffddb5] text-[#835400] font-bold">
          {unitLabel} {String(index + 1).padStart(2, '0')} / {String(Math.max(total, 1)).padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-gray-500 font-bold">Speed</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.25"
            value={speed}
            onChange={(e) => player.setSpeed(parseFloat(e.target.value))}
            className="w-20 accent-[#006768] cursor-pointer"
          />
          <span className="font-mono text-xs text-gray-700 font-semibold">{speed.toFixed(1)}x</span>
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
    {narration && (
      <div className="px-3 py-2 border-t border-[#DDD6C5] bg-white/80 rounded-b-xl flex items-start gap-2 font-mono text-xs text-gray-800 min-h-[34px]">
        <span className="w-2 h-2 rounded-full bg-[#F2A93B] mt-1 shrink-0 animate-pulse"></span>
        <div className="leading-relaxed">{narration}</div>
      </div>
    )}
    </div>
  );
};

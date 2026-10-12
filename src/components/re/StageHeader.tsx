import React from 'react';

interface StageHeaderProps {
  stage: string;
  subtitle: string;
  title: string;
  description?: React.ReactNode;
  metrics: { label: string; value: React.ReactNode; tone?: 'teal' | 'amber' | 'red' }[];
}

/** Compact one-row stage header so the workspace fits on one screen. */
export const StageHeader: React.FC<StageHeaderProps> = ({ stage, subtitle, title, description, metrics }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#835400] font-bold px-2 py-0.5 rounded bg-[#ffddb5]">{stage}</span>
        <h1 className="font-['Bricolage_Grotesque'] text-xl md:text-2xl font-extrabold tracking-tight">{title}</h1>
        <span className="font-mono text-xs text-gray-500 truncate">{subtitle}</span>
      </div>
      {description && <p className="text-xs text-gray-600">{description}</p>}
    </div>
    <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white border border-[#DDD6C5] px-3 py-1.5 rounded-lg shadow-2xs flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] uppercase text-gray-500">{m.label}</span>
          <span className={`font-mono text-xs font-bold ${m.tone === 'amber' ? 'text-[#835400]' : m.tone === 'red' ? 'text-red-700' : 'text-[#006768]'}`}>
            {m.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const StageNav: React.FC<{
  backLabel: string;
  onBack: () => void;
  nextLabel?: string;
  onNext?: () => void;
  extra?: React.ReactNode;
}> = ({ backLabel, onBack, nextLabel, onNext, extra }) => (
  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
    <button
      onClick={onBack}
      className="px-4 py-2 bg-white border border-[#DDD6C5] hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
    >
      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
      <span>{backLabel}</span>
    </button>
    <div className="flex items-center gap-2">
      {extra}
      {nextLabel && onNext && (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-[#006768] hover:bg-[#004f51] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>{nextLabel}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      )}
    </div>
  </div>
);

/** Height of the main workspace row so canvas + side panel fit in the viewport together. */
export const WORKSPACE_H = 'lg:h-[calc(100vh-335px)] lg:min-h-[440px]';

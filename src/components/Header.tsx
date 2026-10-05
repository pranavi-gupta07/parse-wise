import React from 'react';

interface HeaderProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  viewMode: 'step' | 'all';
  onToggleViewMode: (mode: 'step' | 'all') => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenHelp: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeNav,
  onSelectNav,
  viewMode,
  onToggleViewMode,
  isDark,
  onToggleDark,
  onOpenHelp,
  onOpenShortcuts,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#14161F] text-[#B8BBC8] shadow-md select-none">
      <div className="h-[60px] w-full px-4 md:px-8 flex items-center justify-between">
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectNav('bottom-up')}>
            <div className="w-8 h-8 rounded-lg bg-[#006768] flex items-center justify-center font-mono text-base font-bold text-[#F2A93B] shadow-inner">
              ⋖
            </div>
            <span className="font-['Bricolage_Grotesque'] text-xl tracking-tight flex items-baseline">
              <span className="text-white font-bold">Parse</span>
              <span className="text-[#F2A93B] font-bold italic ml-0.5">wise</span>
            </span>
          </div>

          <div className="h-5 w-px bg-[#2B3147] hidden md:block"></div>

          <nav className="hidden md:flex items-center gap-6 font-['IBM_Plex_Sans'] text-sm">
            <button
              onClick={() => onSelectNav('lexical')}
              className={`transition-colors py-2 ${
                activeNav === 'lexical' ? 'text-white border-b-2 border-[#F2A93B] font-medium' : 'hover:text-white'
              }`}
            >
              Lexical
            </button>
            <button
              onClick={() => onSelectNav('top-down')}
              className={`transition-colors py-2 ${
                activeNav === 'top-down' ? 'text-white border-b-2 border-[#F2A93B] font-medium' : 'hover:text-white'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => onSelectNav('bottom-up')}
              className={`transition-colors py-2 ${
                activeNav === 'bottom-up' ? 'text-white border-b-2 border-[#F2A93B] font-semibold pb-4 -mb-4' : 'hover:text-white'
              }`}
            >
              Bottom-Up
            </button>
            <button
              onClick={() => onSelectNav('automata')}
              className={`transition-colors py-2 ${
                activeNav === 'automata' ? 'text-white border-b-2 border-[#F2A93B] font-medium' : 'hover:text-white'
              }`}
            >
              Automata
            </button>
          </nav>
        </div>

        {/* View Mode & Utility Icons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#1F2333] rounded-lg p-0.5 border border-[#2E354B]">
            <button
              onClick={() => onToggleViewMode('step')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'step' ? 'bg-[#2B3147] text-white shadow-xs' : 'text-[#B8BBC8] hover:text-white'
              }`}
            >
              Step-by-step
            </button>
            <button
              onClick={() => onToggleViewMode('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'all' ? 'bg-[#2B3147] text-white shadow-xs' : 'text-[#B8BBC8] hover:text-white'
              }`}
            >
              Show all
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleDark}
              className="p-1.5 rounded hover:bg-[#1F2333] hover:text-white transition-colors"
              title={isDark ? 'Switch to light paper' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded hover:bg-[#1F2333] hover:text-white transition-colors"
              title="Documentation & Theory Primer"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
            </button>
            <button
              onClick={onOpenShortcuts}
              className="p-1.5 rounded hover:bg-[#1F2333] hover:text-white transition-colors"
              title="Keyboard Shortcuts"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard</span>
            </button>
            <div className="w-7 h-7 rounded-full bg-[#006768] text-white flex items-center justify-center font-bold text-xs ml-1 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

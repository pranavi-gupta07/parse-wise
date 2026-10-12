import React from 'react';

export type ToolId = 'opp' | 're';

interface ToolSwitcherProps {
  tool: ToolId;
  onChange: (tool: ToolId) => void;
}

/** Lets the user pick which compiler-design operation to run. */
export const ToolSwitcher: React.FC<ToolSwitcherProps> = ({ tool, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-wider text-gray-500 font-bold">Operation</span>
    <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#DDD6C5] shadow-2xs text-xs">
      <button
        onClick={() => onChange('opp')}
        className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer flex items-center gap-1.5 ${
          tool === 'opp' ? 'bg-[#006768] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Operator Precedence Parsing"
      >
        <span className="font-mono font-bold text-[#F2A93B]">⋖</span>
        <span>Operator Precedence</span>
      </button>
      <button
        onClick={() => onChange('re')}
        className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer flex items-center gap-1.5 ${
          tool === 're' ? 'bg-[#006768] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Regular Expression to DFA (direct method)"
      >
        <span className="material-symbols-outlined text-[15px] text-[#F2A93B]">hub</span>
        <span>RE → DFA</span>
      </button>
    </div>
  </div>
);

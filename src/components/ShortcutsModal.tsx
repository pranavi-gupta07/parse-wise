import React from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl border border-[#DDD6C5] shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 font-['IBM_Plex_Sans'] relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-[#F2A93B]/20 text-[#835400] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">keyboard</span>
          </div>
          <div>
            <h2 className="font-['Bricolage_Grotesque'] text-lg font-bold text-gray-900">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-gray-500">Quick controls for stepping and parser traces</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-gray-700">Next step in trace</span>
            <kbd className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-900 font-bold shadow-2xs">
              → / Right Arrow
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-gray-700">Previous step in trace</span>
            <kbd className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-900 font-bold shadow-2xs">
              ← / Left Arrow
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-gray-700">Toggle Auto-Play</span>
            <kbd className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-900 font-bold shadow-2xs">
              Spacebar
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-gray-700">Reset Stepper</span>
            <kbd className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-900 font-bold shadow-2xs">
              R
            </kbd>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#006768] hover:bg-[#004f51] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

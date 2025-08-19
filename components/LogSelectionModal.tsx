import React from 'react';
import type { TranslationKey } from '../translations';
import { FileHeartIcon, PillIcon, UtensilsIcon } from './IconComponents';

interface LogSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (logType: 'symptom' | 'medication' | 'diet') => void;
  selectedDate: Date | null;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const LogSelectionModal: React.FC<LogSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedDate, t }) => {
  if (!isOpen || !selectedDate) return null;

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(selectedDate);

  const options = [
    { type: 'symptom' as const, key: 'symptomCheckinTitle' as const, Icon: FileHeartIcon, color: 'text-red-400', hover: 'hover:bg-red-900/50' },
    { type: 'medication' as const, key: 'medicationLogTitle' as const, Icon: PillIcon, color: 'text-sky-400', hover: 'hover:bg-sky-900/50' },
    { type: 'diet' as const, key: 'dietLogTitle' as const, Icon: UtensilsIcon, color: 'text-amber-400', hover: 'hover:bg-amber-900/50' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900/80 border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-200 mb-1 text-center">{t('logEntryFor')}</h2>
        <p className="text-center text-teal-400 mb-6">{formattedDate}</p>
        
        <div className="space-y-3">
          {options.map(({ type, key, Icon, color, hover }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border border-slate-700 bg-slate-900/50 transition-colors ${hover}`}
            >
              <Icon className={`w-8 h-8 flex-shrink-0 ${color}`} />
              <span className="text-lg font-semibold text-slate-200">{t(key)}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default LogSelectionModal;
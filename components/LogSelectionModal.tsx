import React from 'react';
import type { TranslationKey } from '../translations';
import { FileHeartIcon, PillIcon, UtensilsIcon } from './IconComponents';

interface LogSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (logType: 'symptom' | 'medication' | 'diet' | 'water' | 'uricacid' | 'medical') => void;
  selectedDate: Date | null;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const LogSelectionModal: React.FC<LogSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedDate, t }) => {
  if (!isOpen || !selectedDate) return null;

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(selectedDate);

  const options = [
    { type: 'symptom' as const, key: 'symptomCheckinTitle' as const, icon: '🤕', color: 'text-red-400', hover: 'hover:bg-red-900/50' },
    { type: 'medication' as const, key: 'medicationLogTitle' as const, icon: '💊', color: 'text-sky-400', hover: 'hover:bg-sky-900/50' },
    { type: 'diet' as const, key: 'dietLogTitle' as const, icon: '🍽️', color: 'text-amber-400', hover: 'hover:bg-amber-900/50' },
    { type: 'water' as const, key: 'waterIntakeTitle' as const, icon: '💧', color: 'text-cyan-400', hover: 'hover:bg-cyan-900/50' },
    { type: 'uricacid' as const, key: 'uricAcidTitle' as const, icon: '🔬', color: 'text-purple-400', hover: 'hover:bg-purple-900/50' },
    { type: 'medical' as const, key: 'medicalRecordTitle' as const, icon: '🏥', color: 'text-emerald-400', hover: 'hover:bg-emerald-900/50' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-zinc-200 mb-1 text-center">{t('logEntryFor')}</h2>
        <p className="text-center text-teal-400 mb-6">{formattedDate}</p>
        
        <div className="grid grid-cols-2 gap-3">
          {options.map(({ type, key, icon, color, hover }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border border-zinc-700 bg-zinc-900/50 transition-all ${hover}`}
            >
              <span className={`text-3xl ${color}`}>{icon}</span>
              <span className="text-sm font-semibold text-zinc-200">{t(key)}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-600 rounded-md hover:bg-zinc-500 transition-colors">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default LogSelectionModal;

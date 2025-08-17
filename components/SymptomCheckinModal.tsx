import React, { useState } from 'react';
import type { TranslationKey } from '../translations';

interface SymptomCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (summary: string | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
}

const symptomOptions = [
  { value: 'Swelling', key: 'symptomSwelling' as const },
  { value: 'Redness', key: 'symptomRedness' as const },
  { value: 'Warmth/Heat', key: 'symptomWarmth' as const },
];


const SymptomCheckinModal: React.FC<SymptomCheckinModalProps> = ({ isOpen, onClose, onComplete, t, selectedDate }) => {
  const [painLocation, setPainLocation] = useState('');
  const [painLevel, setPainLevel] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    if (!painLocation.trim()) {
        alert(t('alertPainLocation'));
        return;
    }
    
    const logDate = selectedDate || new Date();
    const timestamp = logDate.toISOString(); 

    let summary = `[${t('symptomCheckinTitle')} - ${timestamp}]\n`;
    summary += `- ${t('painLocationLabel')}: ${painLocation}\n`;
    summary += `- ${t('painLevelLabel', { painLevel: '' }).replace(': ', '').replace(':', '')}: ${painLevel}/10\n`;
    if (symptoms.length > 0) {
      const translatedSymptoms = symptoms.map(symptom => {
            const option = symptomOptions.find(opt => opt.value === symptom);
            return option ? t(option.key) : symptom;
        }).join(', ');
      summary += `- ${t('otherSymptomsLabel')}: ${translatedSymptoms}\n`;
    }
    if (notes.trim()) {
      summary += `- ${t('notesLabel').replace(' (optional)', '').replace(' (선택 사항)', '')}: ${notes}`;
    }
    onComplete(summary.trim());
    resetState();
  };

  const resetState = () => {
    setPainLocation('');
    setPainLevel(5);
    setSymptoms([]);
    setNotes('');
  }

  const handleClose = () => {
    resetState();
    onClose();
  }
  
  const formattedDate = selectedDate ? new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
  }).format(selectedDate) : null;


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-2 text-center">{t('symptomCheckinTitle')}</h2>
        {formattedDate && <p className="text-center text-slate-400 mb-4">{formattedDate}</p>}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="painLocation" className="block text-sm font-medium text-slate-300 mb-1">{t('painLocationLabel')}</label>
            <input
              type="text"
              id="painLocation"
              value={painLocation}
              onChange={e => setPainLocation(e.target.value)}
              placeholder={t('painLocationPlaceholder')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label htmlFor="painLevel" className="block text-sm font-medium text-slate-300 mb-1">{t('painLevelLabel', { painLevel })}</label>
            <input
              type="range"
              id="painLevel"
              min="0"
              max="10"
              value={painLevel}
              onChange={e => setPainLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('otherSymptomsLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map(symptom => (
                <button
                  key={symptom.value}
                  onClick={() => handleSymptomToggle(symptom.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    symptoms.includes(symptom.value)
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {t(symptom.key)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">{t('notesLabel')}</label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={t('notesPlaceholder')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={handleClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('cancel')}</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-500 transition-colors">{t('completeCheckin')}</button>
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckinModal;
import React, { useState, useRef } from 'react';
import type { TranslationKey } from '../translations';
import { fileToBase64 } from '../utils/imageUtils';
import { CameraIcon } from './IconComponents';

type TimeOfDay = 'Morning' | 'Lunch' | 'Dinner' | 'Bedtime';

interface MedicationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (log: { summary: string, image?: { mimeType: string, data: string } } | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
}

const MedicationLogModal: React.FC<MedicationLogModalProps> = ({ isOpen, onClose, onComplete, t, selectedDate }) => {
  const [medicationName, setMedicationName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning');
  const [intakeTime, setIntakeTime] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setMedicationName('');
    setTimeOfDay('Morning');
    setIntakeTime('');
    setNotes('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };
  
  const handleSubmit = async () => {
    if (!medicationName.trim()) {
        alert(t('alertMedicationName'));
        return;
    }
    
    const logDate = selectedDate || new Date();
    const timestamp = logDate.toISOString();
    
    const timeOfDayKeyMap: Record<TimeOfDay, TranslationKey> = {
      'Morning': 'timeOfDayMorning',
      'Lunch': 'timeOfDayLunch',
      'Dinner': 'timeOfDayDinner',
      'Bedtime': 'timeOfDayBedtime',
    };

    let summary = `[${t('medicationLogTitle')} - ${timestamp}]\n`;
    summary += `- ${t('medicationNameLabel')}: ${medicationName}\n`;
    summary += `- ${t('timeOfDayLabel')}: ${t(timeOfDayKeyMap[timeOfDay])}\n`;
    if (intakeTime) {
      summary += `- ${t('intakeTimeLabel')}: ${intakeTime}\n`;
    }
    if (notes.trim()) {
      summary += `- ${t('notesLabel').replace(/ \(.+\)/, '')}: ${notes}`;
    }

    let imagePayload;
    if (imageFile) {
        try {
            const base64String = await fileToBase64(imageFile);
            imagePayload = { mimeType: imageFile.type, data: base64String };
        } catch (error) {
            console.error("Error converting image to base64:", error);
            alert("Failed to process image file.");
            return;
        }
    }
    
    onComplete({ summary: summary.trim(), image: imagePayload });
    resetState();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formattedDate = selectedDate ? new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
  }).format(selectedDate) : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-2 text-center">{t('medicationLogTitle')}</h2>
        {formattedDate && <p className="text-center text-zinc-400 mb-4">{formattedDate}</p>}
        
        <div className="space-y-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">{t('medicationNameLabel')}</label>
            <input type="text" value={medicationName} onChange={e => setMedicationName(e.target.value)} placeholder={t('medicationNamePlaceholder')} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">{t('timeOfDayLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Morning', 'Lunch', 'Dinner', 'Bedtime'] as TimeOfDay[]).map(tod => (
                <button key={tod} onClick={() => setTimeOfDay(tod)} className={`px-3 py-2 rounded-md text-sm transition-colors ${timeOfDay === tod ? 'bg-sky-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600'}`}>
                  {t(`timeOfDay${tod}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">{t('intakeTimeLabel')}</label>
            <input type="time" value={intakeTime} onChange={e => setIntakeTime(e.target.value)} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">{t('notesLabel')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('notesPlaceholder')} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
          </div>

          <div>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md hover:bg-zinc-600 transition-colors">
              <CameraIcon className="w-5 h-5"/> {t('addPhoto')}
            </button>
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-md max-h-32 w-auto mx-auto"/>}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={handleClose} className="px-4 py-2 bg-zinc-600 rounded-md hover:bg-zinc-500 transition-colors">{t('cancel')}</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-500 transition-colors">{t('completeCheckin')}</button>
        </div>
      </div>
    </div>
  );
};

export default MedicationLogModal;

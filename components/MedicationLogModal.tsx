import React, { useState, useRef, useEffect } from 'react';
import type { TranslationKey } from '../translations';
import { fileToBase64 } from '../utils/imageUtils';
import { CameraIcon, ImageIcon, XIcon, ChevronLeftIcon } from './IconComponents';

type TimeOfDay = 'Morning' | 'Lunch' | 'Dinner' | 'Bedtime';

interface MedicationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (log: { summary: string, image?: { mimeType: string, data: string } } | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
  recentMedications: string[];
}

const Progress: React.FC<{step: number, totalSteps: number, colorClass: string}> = ({ step, totalSteps, colorClass }) => (
    <div className="w-full bg-zinc-700 rounded-full h-1.5 mb-6">
        <div className={`${colorClass} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
    </div>
);

const MedicationLogModal: React.FC<MedicationLogModalProps> = ({ isOpen, onClose, onComplete, t, selectedDate, recentMedications }) => {
  const [step, setStep] = useState(1);
  const [medicationName, setMedicationName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning');
  const [intakeTime, setIntakeTime] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 2;
  
  useEffect(() => {
    if (isOpen) {
        resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setMedicationName('');
    setTimeOfDay('Morning');
    setIntakeTime('');
    setNotes('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    onClose();
  };
  
  const handleSubmit = async () => {
    const logDate = selectedDate || new Date();
    const timestamp = logDate.toISOString();
    
    const timeOfDayKeyMap: Record<TimeOfDay, TranslationKey> = { 'Morning': 'timeOfDayMorning', 'Lunch': 'timeOfDayLunch', 'Dinner': 'timeOfDayDinner', 'Bedtime': 'timeOfDayBedtime' };

    let summary = `[${t('medicationLogTitle')} - ${timestamp}]\n`;
    summary += `- ${t('medicationNameLabel')}: ${medicationName}\n`;
    summary += `- ${t('timeOfDayLabel')}: ${t(timeOfDayKeyMap[timeOfDay])}\n`;
    if (intakeTime) {
      summary += `- ${t('intakeTimeLabel').replace(' (optional)', '').replace(' (선택 사항)', '')}: ${intakeTime}\n`;
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
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
        setImageFile(file); 
        const reader = new FileReader(); 
        reader.onloadend = () => { setImagePreview(reader.result as string); }; 
        reader.readAsDataURL(file); 
    }
    // Reset capture attribute after selection
    if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
    }
  };

  const handleTakePhotoClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
          fileInputRef.current.click();
      }
  };

  const handleChooseFromAlbumClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('capture');
          fileInputRef.current.click();
      }
  };

  const removeImage = () => {
      setImageFile(null); setImagePreview(null);
      if (fileInputRef.current) { fileInputRef.current.value = ""; }
  }

  const formattedDate = selectedDate ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate) : null;

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div key={1}>
            <h3 className="text-xl font-semibold text-zinc-100 mb-4 text-center">{t('medicationNameLabel')}?</h3>
            <input type="text" value={medicationName} onChange={e => setMedicationName(e.target.value)} placeholder={t('medicationNamePlaceholder')} className="w-full text-center text-lg px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
            {recentMedications.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs text-zinc-400 mb-2 text-center">{t('recentMedications')}:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {recentMedications.map(med => (<button key={med} onClick={() => setMedicationName(med)} className="px-3 py-1 bg-zinc-700 text-zinc-200 rounded-full text-sm hover:bg-zinc-600 transition-colors">{med}</button>))}
                    </div>
                </div>
            )}
          </div>
        );
      case 2:
        return (
          <div key={2} className="w-full flex flex-col gap-3">
              <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 text-center">{t('timeOfDayLabel')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Morning', 'Lunch', 'Dinner', 'Bedtime'] as TimeOfDay[]).map(tod => (<button key={tod} onClick={() => setTimeOfDay(tod)} className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${timeOfDay === tod ? 'bg-sky-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'}`}>{t(`timeOfDay${tod}` as TranslationKey)}</button>))}
                  </div>
              </div>
              
              {imagePreview ? (
                  <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-32 rounded-lg object-contain bg-zinc-900" />
                      <button onClick={removeImage} className="absolute top-2 right-2 bg-zinc-900/70 rounded-full p-1 text-zinc-300 hover:text-white hover:bg-red-600 transition-all">
                          <XIcon className="w-4 h-4" />
                      </button>
                  </div>
              ) : (
                <div className="w-full grid grid-cols-2 gap-3">
                    <button
                        onClick={handleTakePhotoClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-zinc-700/50 border-2 border-dashed border-zinc-600 rounded-lg hover:bg-zinc-700 hover:border-sky-500 transition-colors text-zinc-400 hover:text-sky-400"
                    >
                        <CameraIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('takePhoto')}</span>
                    </button>
                    <button
                        onClick={handleChooseFromAlbumClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-zinc-700/50 border-2 border-dashed border-zinc-600 rounded-lg hover:bg-zinc-700 hover:border-sky-500 transition-colors text-zinc-400 hover:text-sky-400"
                    >
                        <ImageIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('chooseFromAlbum')}</span>
                    </button>
                </div>
              )}
              
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('medicationNotesPlaceholder')} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
          </div>
        );
      default: return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-1 text-center">{t('medicationLogTitle')}</h2>
        {formattedDate && <p className="text-center text-zinc-400 mb-4">{formattedDate}</p>}
        <Progress step={step} totalSteps={totalSteps} colorClass="bg-sky-500" />
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <div className="min-h-[280px] flex flex-col justify-center items-center">
            {renderStepContent()}
        </div>

        <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 bg-zinc-600 rounded-lg hover:bg-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" /> {t('back')}
            </button>
            {step < totalSteps ? (
                <button onClick={() => setStep(s => Math.min(totalSteps, s + 1))} disabled={step === 1 && !medicationName.trim()} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                    {t('next')}
                </button>
            ) : (
                <button onClick={handleSubmit} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-colors">
                    {t('completeCheckin')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MedicationLogModal;
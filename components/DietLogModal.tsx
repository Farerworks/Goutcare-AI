import React, { useState, useRef, useEffect } from 'react';
import type { TranslationKey } from '../translations';
import { fileToBase64 } from '../utils/imageUtils';
import { CameraIcon, ImageIcon, XIcon, ChevronLeftIcon } from './IconComponents';

type TimeOfDay = 'Breakfast' | 'Lunch' | 'Dinner' | 'After Dinner';

interface DietLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (log: { summary: string, image?: { mimeType: string, data: string } } | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
  recentFoods: string[];
}

const Progress: React.FC<{step: number, totalSteps: number, colorClass: string}> = ({ step, totalSteps, colorClass }) => (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
        <div className={`${colorClass} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
    </div>
);

const DietLogModal: React.FC<DietLogModalProps> = ({ isOpen, onClose, onComplete, t, selectedDate, recentFoods }) => {
  const [step, setStep] = useState(1);
  const [foodDescription, setFoodDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Breakfast');
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
    setFoodDescription('');
    setTimeOfDay('Breakfast');
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

    const timeOfDayKeyMap: Record<TimeOfDay, TranslationKey> = { 'Breakfast': 'timeOfDayBreakfast', 'Lunch': 'timeOfDayLunch', 'Dinner': 'timeOfDayDinner', 'After Dinner': 'timeOfDayAfterDinner' };
    
    let summary = `[${t('dietLogTitle')} - ${timestamp}]\n`;
    if (foodDescription.trim()) {
        summary += `- ${t('foodDescriptionLabel').replace(':', '')}: ${foodDescription.trim()}\n`;
    }
    summary += `- ${t('timeOfDayLabel')}: ${t(timeOfDayKeyMap[timeOfDay])}\n`;
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
          <div key={1} className="w-full flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-slate-100 mb-2 text-center">{t('dietLogStep1Title')}</h3>
             {imagePreview ? (
                <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-32 rounded-lg object-contain bg-slate-900" />
                    <button onClick={removeImage} className="absolute top-2 right-2 bg-slate-900/70 rounded-full p-1 text-slate-300 hover:text-white hover:bg-red-600 transition-all">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="w-full grid grid-cols-2 gap-3">
                    <button
                        onClick={handleTakePhotoClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-700 hover:border-amber-500 transition-colors text-slate-400 hover:text-amber-400"
                    >
                        <CameraIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('takePhoto')}</span>
                    </button>
                    <button
                        onClick={handleChooseFromAlbumClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-700 hover:border-amber-500 transition-colors text-slate-400 hover:text-amber-400"
                    >
                        <ImageIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('chooseFromAlbum')}</span>
                    </button>
                </div>
            )}
            <textarea value={foodDescription} onChange={e => setFoodDescription(e.target.value)} rows={3} placeholder={t('foodDescriptionPlaceholder')} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>
        );
      case 2:
        return (
          <div key={2} className="w-full flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-slate-100 mb-0 text-center">{t('dietLogStep2Title')}</h3>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">{t('timeOfDayLabel')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Breakfast', 'Lunch', 'Dinner', 'After Dinner'] as TimeOfDay[]).map(tod => (<button key={tod} onClick={() => setTimeOfDay(tod)} className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${timeOfDay === tod ? 'bg-amber-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>{t(`timeOfDay${tod}` as TranslationKey)}</button>))}
                </div>
            </div>
            
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t('dietNotesPlaceholder')} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>
        );
      default: return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-400 mb-1 text-center">{t('dietLogTitle')}</h2>
        {formattedDate && <p className="text-center text-slate-400 mb-4">{formattedDate}</p>}
        <Progress step={step} totalSteps={totalSteps} colorClass="bg-amber-500" />
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        
        <div className="min-h-[280px] flex flex-col justify-center items-center">
            {renderStepContent()}
        </div>

        <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" /> {t('back')}
            </button>
            {step < totalSteps ? (
                <button onClick={() => setStep(s => Math.min(totalSteps, s + 1))} disabled={step === 1 && !foodDescription.trim() && !imageFile} className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {t('next')}
                </button>
            ) : (
                <button onClick={handleSubmit} className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 transition-colors">
                    {t('completeCheckin')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default DietLogModal;
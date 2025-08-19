import React, { useState, useEffect, useRef } from 'react';
import type { TranslationKey } from '../translations';
import { ChevronLeftIcon, CameraIcon, ImageIcon, XIcon } from './IconComponents';
import { fileToBase64 } from '../utils/imageUtils';

interface SymptomCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (log: { summary: string, image?: { mimeType: string, data: string } } | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
  recentPainLocations: string[];
}

const symptomOptions = [
  { value: 'Swelling', key: 'symptomSwelling' as const },
  { value: 'Redness', key: 'symptomRedness' as const },
  { value: 'Warmth/Heat', key: 'symptomWarmth' as const },
];

const PainLevelSelector: React.FC<{ painLevel: number; setPainLevel: (level: number) => void;}> = ({ painLevel, setPainLevel }) => {
    const painLevelClasses = [ 'bg-teal-800/50 hover:bg-teal-700 border-teal-700', 'bg-teal-800/60 hover:bg-teal-700 border-teal-700', 'bg-teal-800/80 hover:bg-teal-700 border-teal-700', 'bg-teal-800/90 hover:bg-teal-700 border-teal-700', 'bg-amber-800/60 hover:bg-amber-700 border-amber-700', 'bg-amber-800/80 hover:bg-amber-700 border-amber-700', 'bg-amber-800/90 hover:bg-amber-700 border-amber-700', 'bg-red-800/60 hover:bg-red-700 border-red-700', 'bg-red-800/70 hover:bg-red-700 border-red-700', 'bg-red-800/80 hover:bg-red-700 border-red-700', 'bg-red-800/90 hover:bg-red-700 border-red-700' ];
    const selectedPainLevelClasses = [ 'bg-teal-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-teal-400 text-white', 'bg-teal-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-teal-400 text-white', 'bg-teal-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-teal-400 text-white', 'bg-teal-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-teal-400 text-white', 'bg-amber-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-400 text-slate-900', 'bg-amber-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-400 text-slate-900', 'bg-amber-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-amber-400 text-slate-900', 'bg-red-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-red-400 text-white', 'bg-red-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-red-400 text-white', 'bg-red-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-red-400 text-white', 'bg-red-500 ring-2 ring-offset-2 ring-offset-slate-900 ring-red-400 text-white' ];
    return ( <div className="flex justify-center items-center flex-wrap gap-2"> {Array.from({ length: 11 }, (_, i) => ( <button key={i} onClick={() => setPainLevel(i)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150 text-sm font-bold border ${painLevel === i ? selectedPainLevelClasses[i] : painLevelClasses[i] + ' text-slate-300'}`} aria-label={`Pain level ${i}`}> {i} </button> ))} </div> );
};

const Progress: React.FC<{step: number, totalSteps: number, colorClass: string}> = ({ step, totalSteps, colorClass }) => (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-6">
        <div className={`${colorClass} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
    </div>
);

const SymptomCheckinModal: React.FC<SymptomCheckinModalProps> = ({ isOpen, onClose, onComplete, t, selectedDate, recentPainLocations }) => {
  const [step, setStep] = useState(1);
  const [painLocation, setPainLocation] = useState('');
  const [painLevel, setPainLevel] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 3;
  
  useEffect(() => {
    if (isOpen) {
        resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setPainLocation('');
    setPainLevel(5);
    setSymptoms([]);
    setNotes('');
    setImageFile(null);
    setImagePreview(null);
  }

  const handleClose = () => {
    onClose();
  }

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const handleSubmit = async () => {
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
    
    let imagePayload;
    if (imageFile) {
        try {
            const base64String = await fileToBase64(imageFile);
            imagePayload = { mimeType: imageFile.type, data: base64String };
        } catch (error) {
            console.error("Error converting image to base64:", error);
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
    switch (step) {
      case 1:
        return (
          <div key={1}>
            <h3 className="text-xl font-semibold text-slate-100 mb-4 text-center">{t('painLocationLabel')}?</h3>
            <input type="text" value={painLocation} onChange={e => setPainLocation(e.target.value)} placeholder={t('painLocationPlaceholder')} className="w-full text-center text-lg px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {recentPainLocations.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2 text-center">{t('recentLocations')}:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {recentPainLocations.map(loc => (<button key={loc} onClick={() => setPainLocation(loc)} className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm hover:bg-slate-600 transition-colors">{loc}</button>))}
                    </div>
                </div>
            )}
          </div>
        );
      case 2:
        return (
          <div key={2}>
            <h3 className="text-xl font-semibold text-slate-100 mb-4 text-center">{t('painLevelLabel', { painLevel: '' }).replace(':{painLevel}', '')}?</h3>
            <PainLevelSelector painLevel={painLevel} setPainLevel={setPainLevel} />
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                <span>{t('painLevelNone')}</span>
                <span>{t('painLevelModerate')}</span>
                <span>{t('painLevelSevere')}</span>
            </div>
          </div>
        );
      case 3:
        return (
          <div key={3} className="w-full flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-slate-100 mb-2 text-center">{t('otherSymptomsLabel')}</h3>
             <div className="flex flex-wrap gap-2 justify-center">
              {symptomOptions.map(symptom => (<button key={symptom.value} onClick={() => handleSymptomToggle(symptom.value)} className={`px-4 py-2 rounded-full text-sm transition-colors ${symptoms.includes(symptom.value) ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-700 hover:bg-slate-600'}`}>{t(symptom.key)}</button>))}
            </div>

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
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-700 hover:border-teal-500 transition-colors text-slate-400 hover:text-teal-400"
                    >
                        <CameraIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('takePhoto')}</span>
                    </button>
                    <button
                        onClick={handleChooseFromAlbumClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-700 hover:border-teal-500 transition-colors text-slate-400 hover:text-teal-400"
                    >
                        <ImageIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('chooseFromAlbum')}</span>
                    </button>
                </div>
            )}
            
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('notesPlaceholder')} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
          </div>
        );
      default: return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-teal-400 mb-1 text-center">{t('symptomCheckinTitle')}</h2>
        {formattedDate && <p className="text-center text-slate-400 mb-4">{formattedDate}</p>}
        <Progress step={step} totalSteps={totalSteps} colorClass="bg-teal-500" />
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        
        <div className="min-h-[280px] flex flex-col justify-center items-center">
            {renderStepContent()}
        </div>

        <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" /> {t('back')}
            </button>
            {step < totalSteps ? (
                <button onClick={() => setStep(s => Math.min(totalSteps, s + 1))} disabled={step === 1 && !painLocation.trim()} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {t('next')}
                </button>
            ) : (
                <button onClick={handleSubmit} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors">
                    {t('completeCheckin')}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default SymptomCheckinModal;
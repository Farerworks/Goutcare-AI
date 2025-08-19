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
    <div className="w-full bg-zinc-700 rounded-full h-1.5 mb-6">
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
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzedFoodData, setAnalyzedFoodData] = useState<{
    foods: string[];
    totalPurine: number;
    analysis: string;
  } | null>(null);
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
    setIsAnalyzingImage(false);
    setAnalyzedFoodData(null);
  };

  // Purine content database (mg per 100g)
  const purineDatabase: Record<string, number> = {
    // Very High (>200mg/100g)
    '간': 400, 'liver': 400, '신장': 400, 'kidney': 400,
    '멸치': 410, 'anchovy': 410, 'anchovies': 410,
    '정어리': 345, 'sardine': 345, 'sardines': 345,
    '청어': 378, 'herring': 378,
    
    // High (150-200mg/100g)
    '소고기': 180, 'beef': 180, '돼지고기': 160, 'pork': 160,
    '양고기': 180, 'lamb': 180, '홍합': 195, 'mussel': 195, 'mussels': 195,
    '가리비': 155, 'scallop': 155, 'scallops': 155,
    '참치': 200, 'tuna': 200,
    
    // Moderate (50-150mg/100g)
    '닭고기': 140, 'chicken': 140, '오리': 130, 'duck': 130,
    '연어': 140, 'salmon': 140, '대구': 110, 'cod': 110,
    '새우': 145, 'shrimp': 145, 'prawns': 145,
    '콩': 120, 'beans': 120, '렌틸콩': 127, 'lentils': 127,
    '시금치': 57, 'spinach': 57, '아스파라거스': 55, 'asparagus': 55,
    '버섯': 90, 'mushroom': 90, 'mushrooms': 90,
    '오트밀': 95, 'oatmeal': 95, '통밀빵': 70, 'whole wheat bread': 70,
    
    // Low (<50mg/100g)
    '우유': 0, 'milk': 0, '요거트': 0, 'yogurt': 0, '치즈': 5, 'cheese': 5,
    '계란': 5, 'egg': 5, 'eggs': 5,
    '쌀': 18, 'rice': 18, '파스타': 15, 'pasta': 15,
    '브로콜리': 25, 'broccoli': 25, '당근': 8, 'carrot': 8, 'carrots': 8,
    '감자': 16, 'potato': 16, 'potatoes': 16,
    '사과': 0, 'apple': 0, '바나나': 7, 'banana': 7,
    '토마토': 11, 'tomato': 11, 'tomatoes': 11
  };

  const analyzeFoodImage = async (imageData: string) => {
    setIsAnalyzingImage(true);
    try {
      // Use existing Gemini service directly
      const { generateChatResponseStream } = await import('../services/geminiOptimized');
      
      const analysisPrompt = `이 음식 사진을 분석해주세요. 다음 JSON 형식으로 정확히 답변해주세요:

{
  "foods": ["음식1", "음식2", "음식3"],
  "totalPurine": 예상_퓨린_함량_숫자,
  "analysis": "음식 구성 요소와 퓨린 분석에 대한 상세 설명"
}

이미지에서 보이는 모든 음식들을 정확히 식별하고, 각 음식의 퓨린 함량을 계산해서 총 퓨린 함량(mg)을 추정해주세요. 통풍 환자에게 도움이 되는 조언도 포함해주세요.

퓨린 함량 참고:
- 매우 높음(>200mg/100g): 간, 신장, 멸치, 정어리 등
- 높음(150-200mg/100g): 소고기, 돼지고기, 참치, 홍합 등  
- 보통(50-150mg/100g): 닭고기, 연어, 콩류, 버섯 등
- 낮음(<50mg/100g): 채소, 과일, 유제품, 계란 등

JSON 형식만 답변해주세요.`;

      const history = [{
        role: 'user' as const,
        parts: [
          { text: analysisPrompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageData } }
        ]
      }];

      const stream = await generateChatResponseStream(history, 'ko');
      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      console.log('Full analysis response:', fullResponse);
      
      // Try to parse JSON from response
      let parsedResult;
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        // Fallback to simple estimation based on response text
        parsedResult = estimateFoodFromImage(fullResponse);
      }

      setAnalyzedFoodData(parsedResult);
      
      // Auto-fill food description if it was empty
      if (!foodDescription && parsedResult.foods && parsedResult.foods.length > 0) {
        setFoodDescription(parsedResult.foods.join(', '));
      }
      
    } catch (error) {
      console.error('Food analysis error:', error);
      // Fallback to simple pattern matching
      const fallbackResult = {
        foods: ['이미지 분석 중...'],
        totalPurine: 0,
        analysis: '이미지를 분석하고 있습니다. 잠시만 기다려주세요.'
      };
      setAnalyzedFoodData(fallbackResult);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const estimateFoodFromImage = (description: string): typeof analyzedFoodData => {
    const words = description.toLowerCase().split(' ');
    const detectedFoods: string[] = [];
    let totalPurine = 0;

    Object.entries(purineDatabase).forEach(([food, purine]) => {
      if (words.some(word => word.includes(food.toLowerCase()) || food.toLowerCase().includes(word))) {
        detectedFoods.push(food);
        totalPurine += purine * 0.5; // Assume 50g serving
      }
    });

    return {
      foods: detectedFoods.length > 0 ? detectedFoods : ['인식된 음식 없음'],
      totalPurine: Math.round(totalPurine),
      analysis: `감지된 음식: ${detectedFoods.join(', ')}. 예상 퓨린 함량: ${Math.round(totalPurine)}mg`
    };
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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
        setImageFile(file); 
        const reader = new FileReader(); 
        reader.onloadend = async () => { 
            const dataUrl = reader.result as string;
            setImagePreview(dataUrl);
            
            // Automatically analyze the image
            if (dataUrl) {
                try {
                    const base64Data = dataUrl.split(',')[1]; // Remove data:image/...;base64, prefix
                    await analyzeFoodImage(base64Data);
                } catch (error) {
                    console.error('Auto-analysis failed:', error);
                }
            }
        }; 
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
      setImageFile(null); 
      setImagePreview(null);
      setAnalyzedFoodData(null);
      setIsAnalyzingImage(false);
      if (fileInputRef.current) { fileInputRef.current.value = ""; }
  }

  const formattedDate = selectedDate ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate) : null;

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div key={1} className="w-full flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-zinc-100 mb-2 text-center">{t('dietLogStep1Title')}</h3>
             {imagePreview ? (
                <div className="space-y-3">
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-32 rounded-lg object-contain bg-zinc-900" />
                        <button onClick={removeImage} className="absolute top-2 right-2 bg-zinc-900/70 rounded-full p-1 text-zinc-300 hover:text-white hover:bg-red-600 transition-all">
                            <XIcon className="w-4 h-4" />
                        </button>
                        {isAnalyzingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <div className="text-white text-sm font-semibold flex items-center gap-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    분석 중...
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Food Analysis Results */}
                    {analyzedFoodData && (
                        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-amber-300 mb-2">🔍 분석 결과</h4>
                            
                            {analyzedFoodData.foods && analyzedFoodData.foods.length > 0 && (
                                <div className="mb-2">
                                    <span className="text-xs text-amber-200">감지된 음식:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {analyzedFoodData.foods.map((food, idx) => (
                                            <span key={idx} className="text-xs bg-amber-800/50 text-amber-100 px-2 py-1 rounded">
                                                {food}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {analyzedFoodData.totalPurine > 0 && (
                                <div className="mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-amber-200">예상 퓨린 함량:</span>
                                        <span className={`text-sm font-bold ${
                                            analyzedFoodData.totalPurine > 100 ? 'text-red-400' :
                                            analyzedFoodData.totalPurine > 50 ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                            {analyzedFoodData.totalPurine}mg
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            analyzedFoodData.totalPurine > 100 ? 'bg-red-900/50 text-red-300' :
                                            analyzedFoodData.totalPurine > 50 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'
                                        }`}>
                                            {analyzedFoodData.totalPurine > 100 ? '높음' :
                                             analyzedFoodData.totalPurine > 50 ? '보통' : '낮음'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {analyzedFoodData.analysis && (
                                <p className="text-xs text-amber-200 opacity-90">
                                    {analyzedFoodData.analysis}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full grid grid-cols-2 gap-3">
                    <button
                        onClick={handleTakePhotoClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-zinc-700/50 border-2 border-dashed border-zinc-600 rounded-lg hover:bg-zinc-700 hover:border-amber-500 transition-colors text-zinc-400 hover:text-amber-400"
                    >
                        <CameraIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('takePhoto')}</span>
                    </button>
                    <button
                        onClick={handleChooseFromAlbumClick}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-zinc-700/50 border-2 border-dashed border-zinc-600 rounded-lg hover:bg-zinc-700 hover:border-amber-500 transition-colors text-zinc-400 hover:text-amber-400"
                    >
                        <ImageIcon className="w-6 h-6"/>
                        <span className="text-sm font-semibold">{t('chooseFromAlbum')}</span>
                    </button>
                </div>
            )}
            <textarea value={foodDescription} onChange={e => setFoodDescription(e.target.value)} rows={3} placeholder={t('foodDescriptionPlaceholder')} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>
        );
      case 2:
        return (
          <div key={2} className="w-full flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-zinc-100 mb-0 text-center">{t('dietLogStep2Title')}</h3>
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 text-center">{t('timeOfDayLabel')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Breakfast', 'Lunch', 'Dinner', 'After Dinner'] as TimeOfDay[]).map(tod => {
                  const translationKey = `timeOfDay${tod.replace(' ', '')}` as TranslationKey;
                  return (
                    <button 
                      key={tod} 
                      onClick={() => setTimeOfDay(tod)} 
                      className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        timeOfDay === tod ? 'bg-amber-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                      }`}
                    >
                      {t(translationKey)}
                    </button>
                  )
                })}
                </div>
            </div>
            
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t('dietNotesPlaceholder')} className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          </div>
        );
      default: return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-400 mb-1 text-center">{t('dietLogTitle')}</h2>
        {formattedDate && <p className="text-center text-zinc-400 mb-4">{formattedDate}</p>}
        <Progress step={step} totalSteps={totalSteps} colorClass="bg-amber-500" />
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        
        <div className="min-h-[280px] flex flex-col justify-center items-center">
            {renderStepContent()}
        </div>

        <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 bg-zinc-600 rounded-lg hover:bg-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" /> {t('back')}
            </button>
            {step < totalSteps ? (
                <button onClick={() => setStep(s => Math.min(totalSteps, s + 1))} disabled={step === 1 && !foodDescription.trim() && !imageFile} className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
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
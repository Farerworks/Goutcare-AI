

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Content } from '@google/genai';
import type { ChatMessage, GroundingChunk } from './types';
import { generateChatResponseStream, summarizeHealthInfo } from './services/geminiService';
import { parseMedicationMessages, parseDietMessages, parseSymptomMessages } from './utils/parsers';
import ChatWindow from './components/ChatWindow';
import SymptomCheckinModal from './components/SymptomCheckinModal';
import MedicationLogModal from './components/MedicationLogModal';
import DietLogModal from './components/DietLogModal';
import DashboardPanel from './components/DashboardPanel';
import CalendarPanel from './components/CalendarPanel';
import HealthSummaryModal from './components/HealthSummaryModal';
import SettingsModal from './components/SettingsModal';
import LogSelectionModal from './components/LogSelectionModal';
import getTranslator, { type Language, type TranslationKey } from './translations';

// Detect language once and get the translator function
const lang: Language = navigator.language.split('-')[0] === 'ko' ? 'ko' : 'en';
const t = getTranslator(lang);

const getInitialMessages = (lang: Language, t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string): ChatMessage[] => {
  try {
    const savedMessages = localStorage.getItem('goutChatMessages');
    if (savedMessages) {
      return JSON.parse(savedMessages);
    }
  } catch (error) {
    console.error("Failed to parse messages from localStorage", error);
    // Fall through to generate default messages
  }
  
  // No saved data, generate welcome message + mock data
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const createLogDate = (day: number, hour: number, minute: number): string => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const validDay = day > lastDayOfMonth ? lastDayOfMonth : day;
    return new Date(year, month, validDay, hour, minute).toISOString();
  }

  // Use the translator function `t` to generate logs in the correct language.
  const mockLogs: ChatMessage[] = [
    // --- Symptom Logs ---
    {
      role: 'user',
      content: `[${t('symptomCheckinTitle')} - ${createLogDate(5, 22, 0)}]\n- ${t('painLocationLabel')}: ${lang === 'ko' ? '왼쪽 발목' : 'Left ankle'}\n- ${t('painLevelLabel', { painLevel: '' }).replace(': ', '').replace(':', '')}: 4/10\n- ${t('otherSymptomsLabel')}: ${t('symptomSwelling')}`
    },
    {
      role: 'user',
      content: `[${t('symptomCheckinTitle')} - ${createLogDate(12, 8, 30)}]\n- ${t('painLocationLabel')}: ${lang === 'ko' ? '오른쪽 엄지발가락' : 'Right big toe'}\n- ${t('painLevelLabel', { painLevel: '' }).replace(': ', '').replace(':', '')}: 8/10\n- ${t('otherSymptomsLabel')}: ${t('symptomSwelling')}, ${t('symptomRedness')}`
    },
    {
      role: 'user',
      content: `[${t('symptomCheckinTitle')} - ${createLogDate(18, 18, 0)}]\n- ${t('painLocationLabel')}: ${lang === 'ko' ? '오른쪽 무릎' : 'Right knee'}\n- ${t('painLevelLabel', { painLevel: '' }).replace(': ', '').replace(':', '')}: 6/10`
    },
    // --- Medication Logs ---
    {
      role: 'user',
      content: `[${t('medicationLogTitle')} - ${createLogDate(12, 8, 35)}]\n- ${t('medicationNameLabel')}: ${lang === 'ko' ? '콜히친' : 'Colchicine'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayMorning')}`
    },
    {
      role: 'user',
      content: `[${t('medicationLogTitle')} - ${createLogDate(13, 9, 0)}]\n- ${t('medicationNameLabel')}: ${lang === 'ko' ? '알로푸리놀 100mg' : 'Allopurinol 100mg'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayMorning')}`
    },
    {
      role: 'user',
      content: `[${t('medicationLogTitle')} - ${createLogDate(18, 9, 5)}]\n- ${t('medicationNameLabel')}: ${lang === 'ko' ? '페북소스타트 40mg' : 'Febuxostat 40mg'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayMorning')}`
    },
    // --- Diet Logs ---
    {
      role: 'user',
      content: `[${t('dietLogTitle')} - ${createLogDate(8, 9, 0)}]\n- ${t('foodDescriptionLabel').replace(':', '')}: ${lang === 'ko' ? '저지방 요거트와 체리' : 'Low-fat yogurt and cherries'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayBreakfast')}`
    },
    {
      role: 'user',
      content: `[${t('dietLogTitle')} - ${createLogDate(11, 19, 0)}]\n- ${t('foodDescriptionLabel').replace(':', '')}: ${lang === 'ko' ? '저녁 회식으로 삼겹살과 소주' : 'Pork belly and soju for a company dinner'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayDinner')}`
    },
    {
      role: 'user',
      content: `[${t('dietLogTitle')} - ${createLogDate(17, 12, 30)}]\n- ${t('foodDescriptionLabel').replace(':', '')}: ${lang === 'ko' ? '닭가슴살 샐러드' : 'Chicken breast salad'}\n- ${t('timeOfDayLabel')}: ${t('timeOfDayLunch')}`
    },
  ];

  return [{ role: 'model', content: t('welcomeMessage') }, ...mockLogs];
};

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24" stroke="url(#paint0_linear_404_2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 4C29.5228 4 34 8.47715 34 14" stroke="#0D9488" strokeWidth="4" strokeLinecap="round"/>
    <path d="M30 24L24 30L18 24L24 18L30 24Z" fill="#34D399" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="paint0_linear_404_2" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2DD4BF"/>
        <stop offset="1" stopColor="#0D9488"/>
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(lang, t));
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<Date | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [healthSummary, setHealthSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [healthProfileSummary, setHealthProfileSummary] = useState<string>('');
  const [isLogSelectionModalOpen, setIsLogSelectionModalOpen] = useState(false);
  const [summaryCache, setSummaryCache] = useState<{ key: string, summary: string } | null>(null);
  const healthSummaryUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const showSuggestedPrompts = messages.length <= 1;

  const Panel: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden min-h-0 ${className}`}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
        {children}
    </div>
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('goutChatMessages', JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save messages to localStorage", error);
        setAppError("Could not save your conversation. Your browser's storage might be full or disabled.");
    }
  }, [messages]);

  const updateHealthSummary = useCallback(async () => {
    if (messages.length < 2) {
        setHealthProfileSummary('');
        return;
    }
    try {
        const history: Content[] = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        const summary = await summarizeHealthInfo(history, lang);
        setHealthProfileSummary(summary);
    } catch (e: any) {
        console.error("Failed to update health summary in background", e);
        const errorMessage = e.toString();
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn("Health summary update was rate-limited.");
        }
    }
  }, [messages, lang]);

  useEffect(() => {
    if (healthSummaryUpdateTimeout.current) {
        clearTimeout(healthSummaryUpdateTimeout.current);
    }

    if (!isAiLoading) {
        healthSummaryUpdateTimeout.current = setTimeout(() => {
            updateHealthSummary();
        }, 120000);
    }

    return () => {
        if (healthSummaryUpdateTimeout.current) {
            clearTimeout(healthSummaryUpdateTimeout.current);
        }
    };
  }, [isAiLoading, messages, updateHealthSummary]);

  const handleSendMessage = useCallback(async (message: { text: string, image?: { mimeType: string, data: string } }) => {
    if (isAiLoading) return;

    setIsAiLoading(true);
    setAppError(null);
    const userMessage: ChatMessage = { role: 'user', content: message.text, image: message.image };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    try {
      const history: Content[] = currentMessages
        .filter(msg => msg.content)
        .map(msg => {
            const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [{ text: msg.content }];
            if (msg.image) {
                parts.push({
                    inlineData: {
                        mimeType: msg.image.mimeType,
                        data: msg.image.data
                    }
                });
            }
            return {
                role: msg.role,
                parts: parts
            };
        });
      
      const stream = await generateChatResponseStream(history, lang);
      
      let modelResponseText = '';
      const modelResponseSources: GroundingChunk[] = [];
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponseText += chunk.text;
        
        const newSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.web) || [];
        if (newSources.length > 0) {
            newSources.forEach(source => {
                if (!modelResponseSources.some(s => s.web.uri === source.web.uri)) {
                    modelResponseSources.push(source as GroundingChunk);
                }
            });
        }
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if(lastMessage.role === 'model') {
             lastMessage.content = modelResponseText;
             lastMessage.sources = modelResponseSources.length > 0 ? modelResponseSources : undefined;
          }
          return newMessages;
        });
      }

    } catch (e: any) {
      const errorMessage = `An error occurred: ${e.message}`;
      setAppError(errorMessage);
      setMessages(prev => {
          const newMessages = prev.slice(0, -2);
          return [...newMessages, {role: 'model', content: `Sorry, I encountered an error. ${errorMessage}`}];
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [messages, isAiLoading, lang]);

  const handleClear = () => {
    if (window.confirm(t('resetConfirmation'))) {
        setMessages([
            {
                role: 'model',
                content: t('historyCleared')
            }
        ]);
        setAppError(null);
        setIsSettingsModalOpen(false);
    }
  };

  const handleSymptomCheckComplete = (log: { summary: string, image?: { mimeType: string, data: string } } | null) => {
    setIsSymptomModalOpen(false);
    setSelectedLogDate(null);
    if (log) {
      handleSendMessage({ text: log.summary, image: log.image });
    }
  };

  const recentPainLocations = useMemo(() => {
    const allLogs = parseSymptomMessages(messages);
    const locationCounts: Record<string, number> = {};
    allLogs.forEach(log => {
        const location = log.painLocation.trim();
        if (location) {
            locationCounts[location] = (locationCounts[location] || 0) + 1;
        }
    });
    return Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
  }, [messages]);

  const recentMedications = useMemo(() => {
    const allLogs = parseMedicationMessages(messages);
    const medNames = new Set<string>();
    [...allLogs].reverse().forEach(log => {
      if (medNames.size >= 5) return;
      medNames.add(log.medicationName.trim());
    });
    return Array.from(medNames);
  }, [messages]);

  const recentFoods = useMemo(() => {
    const allLogs = parseDietMessages(messages);
    const foodDescs = new Set<string>();
     [...allLogs].reverse().forEach(log => {
        if (foodDescs.size >= 5) return;
        foodDescs.add(log.foodDescription.trim());
    });
    return Array.from(foodDescs);
  }, [messages]);


  const handleMedicationLogComplete = (log: { summary: string, image?: { mimeType: string, data: string } } | null) => {
      setIsMedicationModalOpen(false);
      setSelectedLogDate(null);
      if (log) {
          handleSendMessage({ text: log.summary, image: log.image });
      }
  };
  
  const handleDietLogComplete = (log: { summary: string, image?: { mimeType: string, data: string } } | null) => {
      setIsDietModalOpen(false);
      setSelectedLogDate(null);
      if (log) {
          handleSendMessage({ text: log.summary, image: log.image });
      }
  };

  const openLogModal = (type: 'symptom' | 'medication' | 'diet', date: Date | null) => {
    setSelectedLogDate(date || new Date());
    if (type === 'symptom') setIsSymptomModalOpen(true);
    if (type === 'medication') setIsMedicationModalOpen(true);
    if (type === 'diet') setIsDietModalOpen(true);
  };
  
  const handleDateSelection = (date: Date) => {
    setSelectedLogDate(date);
    setIsLogSelectionModalOpen(true);
  };

  const handleLogTypeSelected = (type: 'symptom' | 'medication' | 'diet') => {
      setIsLogSelectionModalOpen(false);
      if (selectedLogDate) {
          openLogModal(type, selectedLogDate);
      }
  };

  const handleShowSummary = useCallback(async () => {
    setIsSummaryModalOpen(true);
    const cacheKey = `${messages.length}-${messages[messages.length - 1]?.content}`;

    if (summaryCache && summaryCache.key === cacheKey) {
        setHealthSummary(summaryCache.summary);
        setIsSummaryLoading(false);
        return;
    }

    setIsSummaryLoading(true);
    setHealthSummary(null);
    try {
        const history: Content[] = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        const summary = await summarizeHealthInfo(history, lang);
        const finalSummary = summary || t('noSummaryFound');
        setHealthSummary(finalSummary);
        setSummaryCache({ key: cacheKey, summary: finalSummary });
    } catch (e: any) {
        setHealthSummary(`Error generating summary: ${e.message}`);
    } finally {
        setIsSummaryLoading(false);
    }
  }, [messages, lang, t, summaryCache]);

  const handleExportHistory = () => {
    const dataToExport = {
        version: "1.1", // Mark version for potential future import logic changes
        messages: messages
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `GoutCareAI-ChatHistory-v1.1-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportHistory = (file: File) => {
    if (!window.confirm(t('importConfirmation'))) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
            try {
                const data = JSON.parse(text);
                const importedMessages: ChatMessage[] = data.messages || [];

                if (importedMessages.length > 0) {
                    setMessages(importedMessages);
                    alert(t('importSuccess'));
                    setIsSettingsModalOpen(false);
                } else {
                    throw new Error("No valid messages found in file.");
                }
            } catch (error) {
                console.error("Failed to parse imported file", error);
                alert(t('importError'));
            }
        }
    };
    reader.onerror = () => {
         alert(t('importError'));
    };
    reader.readAsText(file);
  };

  return (
    <>
      <SymptomCheckinModal 
        isOpen={isSymptomModalOpen}
        onClose={() => {
          setIsSymptomModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={handleSymptomCheckComplete}
        t={t}
        selectedDate={selectedLogDate}
        recentPainLocations={recentPainLocations}
      />
      <MedicationLogModal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={handleMedicationLogComplete}
        t={t}
        selectedDate={selectedLogDate}
        recentMedications={recentMedications}
      />
      <DietLogModal
        isOpen={isDietModalOpen}
        onClose={() => {
          setIsDietModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={handleDietLogComplete}
        t={t}
        selectedDate={selectedLogDate}
        recentFoods={recentFoods}
      />
      <HealthSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={healthSummary}
        isLoading={isSummaryLoading}
        t={t}
      />
       <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onImport={handleImportHistory}
          onExport={() => {
              handleExportHistory();
              setIsSettingsModalOpen(false);
          }}
          onReset={handleClear}
          t={t}
      />
      <LogSelectionModal
        isOpen={isLogSelectionModalOpen}
        onClose={() => {
          setIsLogSelectionModalOpen(false);
          setSelectedLogDate(null);
        }}
        onSelect={handleLogTypeSelected}
        selectedDate={selectedLogDate}
        t={t}
       />
      <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-zinc-950">
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
          <header className="text-center mb-6 flex-shrink-0 flex items-center justify-center gap-3">
            <Logo />
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  GoutCare AI
                </h1>
                <p className="mt-1 text-zinc-400 text-sm">{t('appSubtitle')}</p>
            </div>
          </header>

          <main className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-8 min-h-0 lg:grid-rows-1 grid-rows-[auto_auto_1fr]">
            <Panel className="lg:col-span-2">
              <DashboardPanel
                messages={messages}
                t={t}
                lang={lang}
                healthProfileSummary={healthProfileSummary}
              />
            </Panel>
            
            <Panel className="lg:col-span-2">
                <CalendarPanel 
                    messages={messages}
                    onLogRequest={handleDateSelection}
                    t={t}
                />
            </Panel>

            <Panel className="lg:col-span-3">
              {appError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative m-4 flex-shrink-0" role="alert">
                  <strong className="font-bold">{t('errorPrefix')}</strong>
                  <span className="block sm:inline">{appError}</span>
                  <button onClick={() => { setAppError(null); }} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-2xl">{t('closeError')}</span>
                  </button>
                </div>
              )}

              <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isAiLoading}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenLogModal={(type) => openLogModal(type, null)}
                onShowSummary={handleShowSummary}
                t={t}
                showSuggestedPrompts={showSuggestedPrompts}
              />
            </Panel>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
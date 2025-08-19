

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Content } from '@google/genai';
import type { ChatMessage, GroundingChunk } from './types';
import { generateChatResponseStream, summarizeHealthInfo } from './services/geminiOptimized';
import { parseMedicationMessages, parseDietMessages, parseSymptomMessages } from './utils/parsers';
import ChatWindow from './components/ChatWindow';
import SymptomCheckinModal from './components/SymptomCheckinModal';
import MedicationLogModal from './components/MedicationLogModal';
import DietLogModal from './components/DietLogModal';
import DashboardPanel from './components/DashboardPanel';
import CalendarPanel from './components/CalendarPanel';
import ComprehensiveDashboard from './components/ComprehensiveDashboard';
import OptimizedDashboard from './components/OptimizedDashboard';
import UnifiedDashboard from './components/UnifiedDashboard';
import ChatCalendarPanel from './components/ChatCalendarPanel';
import HealthSummaryModal from './components/HealthSummaryModal';
import SettingsModal from './components/SettingsModal';
import LogSelectionModal from './components/LogSelectionModal';
import MainNavigation, { type NavigationSection } from './components/MainNavigation';
import SimpleDashboard from './components/SimpleDashboard';
import SmartHomeDashboard from './components/SmartHomeDashboard';
import AdvancedSettings from './components/AdvancedSettings';
import WaterIntakeTracker from './components/WaterIntakeTracker';
import UricAcidTracker from './components/UricAcidTracker';
import MedicalRecordManager from './components/MedicalRecordManager';
import { UsageMonitor } from './components/UsageMonitor';
import getTranslator, { type Language, type TranslationKey } from './translations';

// Detect language once and get the translator function
const lang: Language = navigator.language.split('-')[0] === 'ko' ? 'ko' : 'en';
const t = getTranslator(lang);

const getInitialMessages = (lang: Language, t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string): ChatMessage[] => {
  // Clear all localStorage data for fresh start
  localStorage.clear();
  
  // Always return only welcome message
  return [{ role: 'model', content: t('welcomeMessage') }];
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
  // 새로운 단순한 네비게이션 상태
  const [activeSection, setActiveSection] = useState<NavigationSection>('home');
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [isUricAcidModalOpen, setIsUricAcidModalOpen] = useState(false);
  const [isMedicalRecordModalOpen, setIsMedicalRecordModalOpen] = useState(false);
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
    <div className={`bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 rounded-2xl relative overflow-hidden min-h-0 shadow-xl ${className}`}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full blur-xl"></div>
        {children}
    </div>
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    // Clear any layout preferences from localStorage
    localStorage.removeItem('layoutMode');
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
        if (chunk.text && typeof chunk.text === 'string') {
          modelResponseText += chunk.text;
        }
        
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

  const openLogModal = (type: 'symptom' | 'medication' | 'diet' | 'water' | 'uricacid' | 'medical', date: Date | null) => {
    setSelectedLogDate(date || new Date());
    if (type === 'symptom') setIsSymptomModalOpen(true);
    if (type === 'medication') setIsMedicationModalOpen(true);
    if (type === 'diet') setIsDietModalOpen(true);
    if (type === 'water') setIsWaterModalOpen(true);
    if (type === 'uricacid') setIsUricAcidModalOpen(true);
    if (type === 'medical') setIsMedicalRecordModalOpen(true);
  };
  
  const handleDateSelection = (date: Date) => {
    setSelectedLogDate(date);
    setIsLogSelectionModalOpen(true);
  };

  const handleLogTypeSelected = (type: 'symptom' | 'medication' | 'diet' | 'water' | 'uricacid' | 'medical') => {
      setIsLogSelectionModalOpen(false);
      if (selectedLogDate) {
          openLogModal(type, selectedLogDate);
      }
  };

  const handleQuickAction = (action: 'symptom' | 'medication' | 'diet' | 'water' | 'ai-chat') => {
    if (action === 'ai-chat') {
      setActiveSection('chat');
    } else {
      setSelectedLogDate(new Date());
      openLogModal(action, new Date());
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
      <WaterIntakeTracker
        isOpen={isWaterModalOpen}
        onClose={() => {
          setIsWaterModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={(entry) => {
          setIsWaterModalOpen(false);
          if (entry) {
            const summary = `[수분 섭취 기록] ${entry.amount}ml의 ${entry.type === 'water' ? '물' : entry.type}을 마셨습니다.`;
            handleSendMessage({ text: summary });
          }
        }}
        t={t}
        selectedDate={selectedLogDate}
      />
      <UricAcidTracker
        isOpen={isUricAcidModalOpen}
        onClose={() => {
          setIsUricAcidModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={(entry) => {
          setIsUricAcidModalOpen(false);
          if (entry) {
            const summary = `[요산 수치 기록] ${entry.level} mg/dL${entry.labName ? ` (${entry.labName})` : ''}${entry.notes ? ` - ${entry.notes}` : ''}`;
            handleSendMessage({ text: summary });
          }
        }}
        t={t}
        selectedDate={selectedLogDate}
      />
      <MedicalRecordManager
        isOpen={isMedicalRecordModalOpen}
        onClose={() => {
          setIsMedicalRecordModalOpen(false);
          setSelectedLogDate(null);
        }}
        onComplete={(entry) => {
          setIsMedicalRecordModalOpen(false);
          if (entry) {
            const summary = `[의료 기록] ${entry.type} ${entry.hospitalName ? `at ${entry.hospitalName}` : ''}${entry.diagnosis ? ` - ${entry.diagnosis}` : ''}`;
            handleSendMessage({ text: summary });
          }
        }}
        t={t}
        selectedDate={selectedLogDate}
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
      <div className="h-screen flex flex-col bg-zinc-950">
        {/* New Main Navigation */}
        <MainNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          t={t}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {activeSection === 'home' && (
            <div className="h-full overflow-y-auto">
              <SmartHomeDashboard
                messages={messages}
                t={t}
                lang={lang}
                onQuickAction={handleQuickAction}
              />
            </div>
          )}

          {activeSection === 'chat' && (
            <div className="h-full flex">
              <div className="flex-1">
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
              </div>
            </div>
          )}

          {activeSection === 'records' && (
            <div className="h-full overflow-y-auto">
              <CalendarPanel 
                messages={messages}
                onLogRequest={handleDateSelection}
                t={t}
              />
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="h-full overflow-y-auto">
              <AdvancedSettings
                messages={messages}
                t={t}
                lang={lang}
                healthProfileSummary={healthProfileSummary}
                onExport={handleExportHistory}
                onImport={handleImportHistory}
                onReset={handleClear}
              />
            </div>
          )}
        </main>
      </div>
      
      {/* 사용량 모니터 */}
      <UsageMonitor />
    </>
  );
};

export default App;
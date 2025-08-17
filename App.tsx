import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Content } from '@google/genai';
import type { ChatMessage, GroundingChunk } from './types';
import { generateChatResponseStream, summarizeHealthInfo } from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import SymptomCheckinModal from './components/SymptomCheckinModal';
import MedicationLogModal from './components/MedicationLogModal';
import DietLogModal from './components/DietLogModal';
import DashboardPanel from './components/DashboardPanel';
import HealthSummaryModal from './components/HealthSummaryModal';
import SettingsModal from './components/SettingsModal';
import getTranslator, { type Language } from './translations';

// Detect language once and get the translator function
const lang: Language = navigator.language.split('-')[0] === 'ko' ? 'ko' : 'en';
const t = getTranslator(lang);

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem('goutChatMessages');
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
      return [{ role: 'model', content: t('welcomeMessage') }];
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      return [{ role: 'model', content: t('welcomeMessage') }];
    }
  });
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
  const healthSummaryUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        }, 3000);
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

  const handleSymptomCheckComplete = (summary: string | null) => {
    setIsSymptomModalOpen(false);
    setSelectedLogDate(null);
    if (summary) {
      handleSendMessage({ text: summary });
    }
  };

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
  
  const handleShowSummary = useCallback(async () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    setHealthSummary(null);
    try {
        const history: Content[] = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        const summary = await summarizeHealthInfo(history, lang);
        setHealthSummary(summary || t('noSummaryFound'));
    } catch (e: any) {
        setHealthSummary(`Error generating summary: ${e.message}`);
    } finally {
        setIsSummaryLoading(false);
    }
  }, [messages, lang]);

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
      <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 bg-zinc-900">
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
          <header className="text-center mb-6 flex-shrink-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              GoutCare AI
            </h1>
            <p className="mt-2 text-zinc-400">{t('appSubtitle')}</p>
          </header>

          <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-h-0 lg:grid-rows-1 grid-rows-[auto_1fr]">
            <div className="lg:col-span-1 min-h-0">
              <DashboardPanel
                messages={messages}
                onLogRequest={openLogModal}
                t={t}
                lang={lang}
                healthProfileSummary={healthProfileSummary}
              />
            </div>

            <div className="lg:col-span-2 min-h-0 flex flex-col">
              {appError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-4 flex-shrink-0" role="alert">
                  <strong className="font-bold">{t('errorPrefix')}</strong>
                  <span className="block sm:inline">{appError}</span>
                  <button onClick={() => { setAppError(null); }} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <span className="text-2xl">{t('closeError')}</span>
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0">
                  <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isAiLoading}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    onStartSymptomCheck={() => openLogModal('symptom', null)}
                    onShowSummary={handleShowSummary}
                    t={t}
                  />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
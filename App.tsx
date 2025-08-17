import React, { useState, useEffect, useCallback } from 'react';
import type { Content } from '@google/genai';
import type { ChatMessage, GroundingChunk } from './types';
import { generateChatResponseStream, summarizeHealthInfo } from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import SymptomCheckinModal from './components/SymptomCheckinModal';
import DashboardPanel from './components/DashboardPanel';
import HealthSummaryModal from './components/HealthSummaryModal';
import getTranslator, { type Language } from './translations';


// Detect language once and get the translator function
const lang: Language = navigator.language.split('-')[0] === 'ko' ? 'ko' : 'en';
const t = getTranslator(lang);


const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Lazy initializer: Load messages from localStorage on initial render
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
  const [selectedSymptomDate, setSelectedSymptomDate] = useState<Date | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [healthSummary, setHealthSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);


  // Effect to set html lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, []);

  // Effect to save messages to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('goutChatMessages', JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save messages to localStorage", error);
        setAppError("Could not save your conversation. Your browser's storage might be full or disabled.");
    }
  }, [messages]);


  const handleSendMessage = useCallback(async (message: string) => {
    if (isAiLoading) return;

    setIsAiLoading(true);
    setAppError(null);
    const userMessage: ChatMessage = { role: 'user', content: message };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    try {
      const history: Content[] = currentMessages
        .filter(msg => msg.content) // Don't include empty messages in history
        .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      const stream = await generateChatResponseStream(history, lang);
      
      let modelResponseText = '';
      const modelResponseSources: GroundingChunk[] = [];
      // Add a placeholder for the model's response
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
      // On error, remove the optimistic user message and the empty model placeholder, then add an error message
      setMessages(prev => {
          const newMessages = prev.slice(0, -2);
          return [...newMessages, {role: 'model', content: `Sorry, I encountered an error. ${errorMessage}`}];
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [messages, isAiLoading, lang]);

  const handleClear = () => {
    setMessages([
        {
            role: 'model',
            content: t('historyCleared')
        }
    ]);
    setAppError(null);
  };

  const handleSymptomCheckComplete = (summary: string | null) => {
    setIsSymptomModalOpen(false);
    setSelectedSymptomDate(null);
    if (summary) {
      handleSendMessage(summary);
    }
  };

  const openSymptomModal = (date: Date | null) => {
    setSelectedSymptomDate(date || new Date());
    setIsSymptomModalOpen(true);
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
    const formattedHistory = messages.map(msg => {
        const role = msg.role === 'user' ? 'User' : 'GoutCare AI';
        return `[${role}]\n${msg.content}\n\n---------------------\n`;
    }).join('');

    const blob = new Blob([formattedHistory], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `GoutCareAI-ChatHistory-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <>
      <SymptomCheckinModal 
        isOpen={isSymptomModalOpen}
        onClose={() => {
          setIsSymptomModalOpen(false);
          setSelectedSymptomDate(null);
        }}
        onComplete={handleSymptomCheckComplete}
        t={t}
        selectedDate={selectedSymptomDate}
      />
      <HealthSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={healthSummary}
        isLoading={isSummaryLoading}
        onExport={handleExportHistory}
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
                onLogSymptom={(date) => openSymptomModal(date)}
                t={t}
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
                    onClear={handleClear}
                    onStartSymptomCheck={() => openSymptomModal(null)}
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
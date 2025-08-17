
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon, CogIcon, ClipboardIcon, LinkIcon, FileHeartIcon } from './IconComponents';
import type { TranslationKey } from '../translations';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
  onStartSymptomCheck: () => void;
  onShowSummary: () => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
  </div>
);

const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const Avatar = isUser ? UserIcon : BotIcon;
  
  // The model is instructed to end with `\n---\n*Disclaimer...*`
  const delimiter = "\n---\n";
  const hasDisclaimer = message.role === 'model' && message.content.includes(delimiter);

  let mainContent = message.content;
  let disclaimer: string | null = null;

  if (hasDisclaimer) {
    const lastIndex = message.content.lastIndexOf(delimiter);
    mainContent = message.content.substring(0, lastIndex).trim();
    let disclaimerText = message.content.substring(lastIndex + delimiter.length);
    if (disclaimerText.startsWith('*') && disclaimerText.endsWith('*')) {
        disclaimerText = disclaimerText.slice(1, -1);
    }
    disclaimer = disclaimerText;
  }

  const showFooter = disclaimer || (message.sources && message.sources.length > 0);

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-zinc-700 rounded-full flex items-center justify-center">
          <Avatar className="w-5 h-5 text-teal-400" />
        </div>
      )}
      <div 
        className={`max-w-xl p-4 rounded-xl shadow-md ${isUser ? 'bg-teal-600 rounded-br-none' : 'bg-zinc-700 rounded-bl-none'}`}
      >
        <div className="text-zinc-100">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 my-2" />,
                ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside space-y-1 my-2" />,
                a: ({node, ...props}) => <a {...props} className="text-teal-300 hover:underline" target="_blank" rel="noopener noreferrer" />,
                h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />,
                h4: ({node, ...props}) => <h4 {...props} className="text-md font-semibold mt-3 mb-1" />,
                strong: ({node, ...props}) => <strong {...props} className="font-semibold" />,
              }}
            >
              {mainContent}
            </ReactMarkdown>
        </div>

        {showFooter && (
            <div className="mt-4 pt-3 border-t border-zinc-600">
                {disclaimer && (
                    <p className={`text-xs text-zinc-400 italic ${message.sources && message.sources.length > 0 ? 'mb-3' : ''}`}>
                        {disclaimer}
                    </p>
                )}
                {message.sources && message.sources.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">Sources:</h4>
                    <ul className="space-y-2">
                      {message.sources.map((source, index) => (
                        <li key={index} className="text-sm">
                          <a
                            href={source.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 hover:underline"
                            title={source.web.title || source.web.uri}
                          >
                            <LinkIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{source.web.title || source.web.uri}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-zinc-700 rounded-full flex items-center justify-center">
          <Avatar className="w-5 h-5 text-zinc-300" />
        </div>
      )}
    </div>
  );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, onOpenSettings, onStartSymptomCheck, onShowSummary, t }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-800/50 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
         <div className="text-sm">
           <p className="font-bold text-zinc-200">{t('chatWindowTitle')}</p>
           <p className="text-zinc-400">{t('chatWindowSubtitle')}</p>
         </div>
        <div className="flex items-center gap-2">
            <button onClick={onShowSummary} className="flex items-center gap-2 px-3 py-1.5 text-sm text-sky-300 bg-sky-900/50 rounded-md hover:bg-sky-900 transition-colors" title={t('myHealthSummaryAria')}>
                <FileHeartIcon className="w-4 h-4" />
                {t('myHealthSummary')}
            </button>
            <button onClick={onOpenSettings} className="flex items-center justify-center w-8 h-8 text-zinc-400 bg-zinc-700/50 rounded-full hover:bg-zinc-700 hover:text-zinc-200 transition-colors" title={t('settingsAria')}>
                <CogIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessageItem key={index} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
            <div className="flex items-start gap-3 my-4 justify-start">
              <div className="w-8 h-8 flex-shrink-0 bg-zinc-700 rounded-full flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-teal-400" />
              </div>
              <div className="max-w-xl p-4 rounded-xl shadow-md bg-zinc-700 rounded-bl-none">
                <LoadingIndicator />
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-zinc-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
           <button
            type="button"
            onClick={onStartSymptomCheck}
            disabled={isLoading}
            className="flex-shrink-0 w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 transition-colors duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed hover:bg-zinc-600"
            aria-label={t('symptomCheckinAria')}
          >
            <ClipboardIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="flex-1 w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-zinc-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed hover:bg-teal-500"
            aria-label={t('sendMessageAria')}
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

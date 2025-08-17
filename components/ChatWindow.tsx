
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon, TrashIcon, ClipboardIcon, LinkIcon } from './IconComponents';
import type { TranslationKey } from '../translations';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onClear: () => void;
  onStartSymptomCheck: () => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
  </div>
);

const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const Avatar = isUser ? UserIcon : BotIcon;
  
  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
          <Avatar className="w-5 h-5 text-sky-400" />
        </div>
      )}
      <div 
        className={`max-w-xl p-4 rounded-xl shadow-md ${isUser ? 'bg-sky-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}
      >
        <div className="text-slate-50">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 my-2" />,
                ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside space-y-1 my-2" />,
                a: ({node, ...props}) => <a {...props} className="text-sky-300 hover:underline" target="_blank" rel="noopener noreferrer" />,
                h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />,
                h4: ({node, ...props}) => <h4 {...props} className="text-md font-semibold mt-3 mb-1" />,
                strong: ({node, ...props}) => <strong {...props} className="font-semibold" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-600">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Sources:</h4>
            <ul className="space-y-2">
              {message.sources.map((source, index) => (
                <li key={index} className="text-sm">
                  <a
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sky-400 hover:text-sky-300 hover:underline"
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
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
          <Avatar className="w-5 h-5 text-slate-300" />
        </div>
      )}
    </div>
  );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, onClear, onStartSymptomCheck, t }) => {
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
    <div className="flex flex-col h-full bg-slate-800/50 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
         <div className="text-sm">
           <p className="font-bold text-slate-200">{t('chatWindowTitle')}</p>
           <p className="text-slate-400">{t('chatWindowSubtitle')}</p>
         </div>
        <button onClick={onClear} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 bg-red-900/50 rounded-md hover:bg-red-900 transition-colors">
            <TrashIcon className="w-4 h-4" />
            {t('resetChat')}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessageItem key={index} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
            <div className="flex items-start gap-3 my-4 justify-start">
              <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-sky-400" />
              </div>
              <div className="max-w-xl p-4 rounded-xl shadow-md bg-slate-700 rounded-bl-none">
                <LoadingIndicator />
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
           <button
            type="button"
            onClick={onStartSymptomCheck}
            disabled={isLoading}
            className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-slate-600"
            aria-label={t('symptomCheckinAria')}
          >
            <ClipboardIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="flex-1 w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-sky-500"
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
import React, { useState } from 'react';
import type { ChatMessage } from '../types';
import type { TranslationKey } from '../translations';
import ChatWindow from './ChatWindow';
import CalendarPanel from './CalendarPanel';
import CompactCalendar from './CompactCalendar';

interface ChatCalendarPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: { text: string; image?: { mimeType: string; data: string } }) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
  onOpenLogModal: (type: string) => void;
  onShowSummary: () => void;
  onLogRequest: (date: Date | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  showSuggestedPrompts: boolean;
  appError?: string | null;
}

const ChatCalendarPanel: React.FC<ChatCalendarPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onOpenSettings,
  onOpenLogModal,
  onShowSummary,
  onLogRequest,
  t,
  showSuggestedPrompts,
  appError
}) => {
  const [layoutMode, setLayoutMode] = useState<'tabs' | 'vertical'>('vertical');
  const [isCompact, setIsCompact] = useState(false);

  // Move activePanel state outside function to prevent reset
  const [activePanel, setActivePanel] = useState<'chat' | 'calendar'>('calendar');
  
  const renderTabLayout = () => {

    return (
      <div className="h-full flex flex-col">
        {/* Panel Navigation */}
        <div className="flex-shrink-0 p-3 border-b border-zinc-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActivePanel('calendar');
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePanel === 'calendar'
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                📅 캘린더
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActivePanel('chat');
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activePanel === 'chat'
                    ? 'bg-teal-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                💬 AI 채팅
              </button>
            </div>
          </div>

          {!isCompact && (
            <div className="text-xs text-zinc-400">
              {activePanel === 'calendar' 
                ? '날짜별 기록을 확인하고 새로운 로그를 추가하세요' 
                : 'AI와 대화하며 건강 관리 상담을 받아보세요'
              }
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {activePanel === 'calendar' ? (
            <div className="h-full p-3">
              <CompactCalendar 
                messages={messages}
                onLogRequest={onLogRequest}
                t={t}
              />
            </div>
          ) : (
            <div className="h-full">
              {appError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg mx-3 mt-3 text-sm">
                  <strong className="font-bold">오류: </strong>
                  <span>{appError}</span>
                </div>
              )}
              <ChatWindow
                messages={messages}
                onSendMessage={onSendMessage}
                isLoading={isLoading}
                onOpenSettings={onOpenSettings}
                onOpenLogModal={onOpenLogModal}
                onShowSummary={onShowSummary}
                t={t}
                showSuggestedPrompts={showSuggestedPrompts}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVerticalLayout = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">📅 캘린더 & 💬 AI 채팅</h2>
        </div>
      </div>

      {/* Calendar Section - Reduced Height */}
      <div className="flex-shrink-0 bg-zinc-800/30 border-b border-zinc-700/50" style={{ height: '220px' }}>
        <div className="p-1">
          <CompactCalendar 
            messages={messages}
            onLogRequest={onLogRequest}
            t={t}
            isCompact={isCompact}
          />
        </div>
      </div>

      {/* Chat Section - Takes remaining space */}
      <div className="flex-1 min-h-0 bg-zinc-900/30" style={{ minHeight: '400px' }}>
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-2 border-b border-zinc-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-300">💬 AI 상담</h3>
              {messages.length > 0 && (
                <span className="text-xs text-zinc-500">{messages.length}회</span>
              )}
            </div>
          </div>
          
          {appError && (
            <div className="flex-shrink-0 bg-red-900/50 border border-red-700 text-red-300 px-2 py-1 rounded mx-2 my-1 text-xs">
              <strong className="font-bold">오류: </strong>
              <span>{appError}</span>
            </div>
          )}
          
          <div className="flex-1 min-h-0">
            <ChatWindow
              messages={messages}
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              onOpenSettings={onOpenSettings}
              onOpenLogModal={onOpenLogModal}
              onShowSummary={onShowSummary}
              t={t}
              showSuggestedPrompts={showSuggestedPrompts}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Layout Toggle */}
      <div className="flex-shrink-0 p-2 border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLayoutMode('vertical');
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                layoutMode === 'vertical'
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="세로 배치: 캘린더 위, 채팅 아래"
            >
              📋
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLayoutMode('tabs');
              }}
              className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                layoutMode === 'tabs'
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title="탭 배치: 캘린더/채팅 전환"
            >
              📄
            </button>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCompact(!isCompact);
            }}
            className="p-1 bg-zinc-700/50 hover:bg-zinc-600 border border-zinc-600 rounded transition-all duration-200 text-xs"
          >
            {isCompact ? '🔍' : '📐'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {layoutMode === 'vertical' ? renderVerticalLayout() : renderTabLayout()}
      </div>

      {/* Footer Stats */}
      {!isCompact && (
        <div className="flex-shrink-0 p-2 border-t border-zinc-700/50">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>시스템 정상</span>
            </div>
            <div>{new Date().toLocaleDateString('ko-KR')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatCalendarPanel;
import React, { useState } from 'react';
import type { ChatMessage, TranslationKey, Language } from '../types';
import UnifiedDashboard from './UnifiedDashboard';
import OptimizedDashboard from './OptimizedDashboard';
import ComprehensiveDashboard from './ComprehensiveDashboard';

interface AdvancedSettingsProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  messages,
  t,
  lang,
  healthProfileSummary,
  onExport,
  onImport,
  onReset
}) => {
  const [selectedAdvancedView, setSelectedAdvancedView] = useState<'unified' | 'optimized' | 'comprehensive' | null>(null);

  const advancedViews = [
    {
      id: 'unified' as const,
      name: '통합 대시보드',
      description: '3가지 모드로 전환 가능한 통합 뷰',
      icon: '📊'
    },
    {
      id: 'optimized' as const,
      name: '최적화 대시보드',
      description: '고급 분석과 시각화',
      icon: '🔬'
    },
    {
      id: 'comprehensive' as const,
      name: '종합 대시보드',
      description: '모든 데이터를 포함한 완전한 뷰',
      icon: '📈'
    }
  ];

  if (selectedAdvancedView) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedAdvancedView(null)}
                className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold text-zinc-200">
                {advancedViews.find(v => v.id === selectedAdvancedView)?.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Advanced Dashboard Content */}
        <div className="flex-1 min-h-0">
          {selectedAdvancedView === 'unified' && (
            <UnifiedDashboard
              messages={messages}
              t={t}
              lang={lang}
              healthProfileSummary={healthProfileSummary}
            />
          )}
          {selectedAdvancedView === 'optimized' && (
            <OptimizedDashboard
              messages={messages}
              t={t}
            />
          )}
          {selectedAdvancedView === 'comprehensive' && (
            <ComprehensiveDashboard
              messages={messages}
              t={t}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* 기본 설정 */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-zinc-200">앱 설정</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={onExport}
            className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📤</div>
              <div className="font-semibold">데이터 내보내기</div>
              <div className="text-xs text-zinc-400">채팅 기록을 백업</div>
            </div>
          </button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
              }}
              className="hidden"
            />
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 transition-colors">
              <div className="text-center">
                <div className="text-2xl mb-2">📥</div>
                <div className="font-semibold">데이터 가져오기</div>
                <div className="text-xs text-zinc-400">백업 파일 복원</div>
              </div>
            </div>
          </label>

          <button
            onClick={onReset}
            className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg hover:bg-red-900/30 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🗑️</div>
              <div className="font-semibold text-red-300">데이터 초기화</div>
              <div className="text-xs text-red-400">모든 데이터 삭제</div>
            </div>
          </button>
        </div>
      </div>

      {/* 고급 대시보드 */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-zinc-200">고급 대시보드</h3>
        <p className="text-zinc-400 mb-6 text-sm">
          상세한 분석과 다양한 시각화를 원하는 사용자를 위한 고급 기능들입니다.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {advancedViews.map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedAdvancedView(view.id)}
              className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 transition-colors text-left"
            >
              <div className="text-3xl mb-3">{view.icon}</div>
              <div className="font-semibold mb-2">{view.name}</div>
              <div className="text-sm text-zinc-400">{view.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 개발자 정보 */}
      <div className="border-t border-zinc-700 pt-6">
        <h3 className="text-lg font-semibold mb-3 text-zinc-200">앱 정보</h3>
        <div className="text-sm text-zinc-400 space-y-1">
          <div>GoutCare AI v2.0</div>
          <div>Privacy-first gout management assistant</div>
          <div>All data stored locally on your device</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
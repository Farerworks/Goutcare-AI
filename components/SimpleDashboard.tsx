import React, { useMemo } from 'react';
import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseDietMessages, parseMedicationMessages, parseSymptomMessages } from '../utils/parsers';
import type { TranslationKey, Language } from '../translations';

interface SimpleDashboardProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  onQuickAction: (action: 'symptom' | 'medication' | 'diet' | 'water' | 'ai-chat') => void;
}

interface HealthAlert {
  level: 'safe' | 'warning' | 'danger';
  message: string;
  action?: string;
}

const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ 
  messages, 
  t, 
  lang, 
  onQuickAction 
}) => {
  // 핵심 건강 상태만 계산
  const healthStatus = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    
    // 최근 데이터 가져오기
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const recentSymptoms = parseSymptomMessages(messages).filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      return entryDate > threeDaysAgo;
    });

    // 위험도 계산
    const latestUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const todayWater = waterEntries
      .filter(entry => new Date(entry.date).toDateString() === today)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // 알림 생성
    const alerts: HealthAlert[] = [];
    
    if (recentSymptoms.length >= 2) {
      alerts.push({
        level: 'danger',
        message: '최근 3일간 증상이 자주 발생했습니다',
        action: '의사와 상담을 권장합니다'
      });
    } else if (recentSymptoms.length === 1) {
      alerts.push({
        level: 'warning',
        message: '최근 증상이 있었습니다',
        action: '수분 섭취와 식단을 주의하세요'
      });
    }

    if (latestUricAcid && latestUricAcid.level > 7.0) {
      alerts.push({
        level: 'warning',
        message: `요산 수치가 높습니다 (${latestUricAcid.level.toFixed(1)} mg/dL)`,
        action: '약물 복용과 식단 관리가 필요합니다'
      });
    }

    if (todayWater < 1500) {
      alerts.push({
        level: 'warning',
        message: '오늘 수분 섭취가 부족합니다',
        action: '물을 더 마시세요'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        level: 'safe',
        message: '현재 상태가 양호합니다',
        action: '꾸준한 관리를 계속하세요'
      });
    }

    return {
      uricAcid: latestUricAcid?.level || null,
      todayWater,
      recentSymptoms: recentSymptoms.length,
      alerts: alerts[0] // 가장 중요한 알림만
    };
  }, [messages]);

  const getAlertStyle = (level: HealthAlert['level']) => {
    switch (level) {
      case 'danger':
        return 'bg-red-900/20 border-red-600/50 text-red-300';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-600/50 text-yellow-300';
      default:
        return 'bg-green-900/20 border-green-600/50 text-green-300';
    }
  };

  const quickActions = [
    { 
      id: 'symptom' as const, 
      icon: '🔥', 
      label: '증상 기록', 
      description: '통증이나 발작 증상',
      urgent: true 
    },
    { 
      id: 'medication' as const, 
      icon: '💊', 
      label: '약물 기록', 
      description: '복용한 약물 기록' 
    },
    { 
      id: 'diet' as const, 
      icon: '🍽️', 
      label: '식단 기록', 
      description: '먹은 음식 기록' 
    },
    { 
      id: 'water' as const, 
      icon: '💧', 
      label: '수분 기록', 
      description: '물이나 음료 섭취' 
    },
    { 
      id: 'ai-chat' as const, 
      icon: '🤖', 
      label: 'AI 상담', 
      description: '궁금한 점 질문하기',
      highlight: true 
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 메인 상태 카드 */}
      <div className={`
        rounded-xl border-2 p-6 ${getAlertStyle(healthStatus.alerts.level)}
      `}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">현재 상태</h2>
            <p className="text-lg mb-1">{healthStatus.alerts.message}</p>
            {healthStatus.alerts.action && (
              <p className="text-sm opacity-80">{healthStatus.alerts.action}</p>
            )}
          </div>
          <div className="text-4xl">
            {healthStatus.alerts.level === 'safe' ? '✅' : 
             healthStatus.alerts.level === 'warning' ? '⚠️' : '🚨'}
          </div>
        </div>
      </div>

      {/* 오늘의 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-center">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-lg font-semibold text-blue-300">
              {healthStatus.todayWater}ml
            </div>
            <div className="text-xs text-zinc-400">오늘 수분 섭취</div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-center">
            <div className="text-2xl mb-1">🩺</div>
            <div className="text-lg font-semibold text-teal-300">
              {healthStatus.uricAcid ? `${healthStatus.uricAcid.toFixed(1)}` : '미측정'}
            </div>
            <div className="text-xs text-zinc-400">최근 요산 수치 (mg/dL)</div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-lg font-semibold text-orange-300">
              {healthStatus.recentSymptoms}회
            </div>
            <div className="text-xs text-zinc-400">최근 3일 증상</div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-zinc-200">빠른 기록</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.id)}
              className={`
                p-4 rounded-xl border transition-all duration-200 text-center
                ${action.urgent 
                  ? 'bg-red-900/20 border-red-600/50 hover:bg-red-900/30' 
                  : action.highlight
                    ? 'bg-teal-900/20 border-teal-600/50 hover:bg-teal-900/30'
                    : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50'
                }
                hover:scale-105 hover:shadow-lg
              `}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="font-semibold text-sm mb-1">{action.label}</div>
              <div className="text-xs text-zinc-400">{action.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
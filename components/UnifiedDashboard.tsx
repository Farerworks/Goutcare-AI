import React, { useState, useMemo, useEffect } from 'react';
import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseDietMessages, parseMedicationMessages, parseSymptomMessages } from '../utils/parsers';
import type { TranslationKey, Language } from '../translations';

// Import components
import GoutFlareRiskPrediction from './GoutFlareRiskPrediction';
import HealthScoreSystem from './HealthScoreSystem';
import UricAcidTrendChart from './UricAcidTrendChart';
import DailyPurineTracker from './DailyPurineTracker';

interface UnifiedDashboardProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
}

interface HealthStatus {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  uricAcid: { level: number | null; status: string; color: string };
  symptoms: { count: number; status: string; color: string };  
  hydration: { amount: number; status: string; color: string };
  medication: { compliance: number; status: string; color: string };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface DashboardMode {
  id: 'summary' | 'tracking' | 'analysis';
  name: string;
  icon: string;
  description: string;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ messages, t, lang, healthProfileSummary }) => {
  const [activeMode, setActiveMode] = useState<DashboardMode['id']>('summary');
  const [compactView, setCompactView] = useState(false);

  const modes: DashboardMode[] = [
    { 
      id: 'summary', 
      name: '건강 요약', 
      icon: '🏥', 
      description: '핵심 건강 지표 한눈에' 
    },
    { 
      id: 'tracking', 
      name: '일일 추적', 
      icon: '📝', 
      description: '오늘의 기록과 진행상황' 
    },
    { 
      id: 'analysis', 
      name: '심화 분석', 
      icon: '📊', 
      description: '트렌드와 예측 분석' 
    }
  ];

  // Comprehensive health status calculation
  const healthStatus = useMemo((): HealthStatus => {
    const now = new Date();
    const today = now.toDateString();
    
    // Get data
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const symptomEntries = parseSymptomMessages(messages);
    const medicationEntries = parseMedicationMessages(messages);

    // Uric acid analysis
    const recentUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    let uricAcidStatus = { level: recentUricAcid?.level || null, status: '미기록', color: 'text-zinc-400' };
    if (recentUricAcid?.level) {
      if (recentUricAcid.level <= 6.0) {
        uricAcidStatus = { level: recentUricAcid.level, status: '목표 달성', color: 'text-green-400' };
      } else if (recentUricAcid.level <= 7.0) {
        uricAcidStatus = { level: recentUricAcid.level, status: '약간 높음', color: 'text-yellow-400' };
      } else if (recentUricAcid.level <= 8.0) {
        uricAcidStatus = { level: recentUricAcid.level, status: '높음', color: 'text-orange-400' };
      } else {
        uricAcidStatus = { level: recentUricAcid.level, status: '매우 높음', color: 'text-red-400' };
      }
    }

    // Symptoms analysis
    const recentSymptoms = symptomEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });

    let symptomStatus = { count: recentSymptoms.length, status: '증상 없음', color: 'text-green-400' };
    if (recentSymptoms.length >= 3) {
      symptomStatus = { count: recentSymptoms.length, status: '빈발', color: 'text-red-400' };
    } else if (recentSymptoms.length >= 2) {
      symptomStatus = { count: recentSymptoms.length, status: '주의 필요', color: 'text-orange-400' };
    } else if (recentSymptoms.length === 1) {
      symptomStatus = { count: recentSymptoms.length, status: '경미', color: 'text-yellow-400' };
    }

    // Hydration analysis
    const todayWater = waterEntries
      .filter(entry => new Date(entry.date).toDateString() === today)
      .reduce((sum, entry) => sum + entry.amount, 0);

    let hydrationStatus = { amount: todayWater, status: '충분', color: 'text-green-400' };
    if (todayWater < 1000) {
      hydrationStatus = { amount: todayWater, status: '부족', color: 'text-red-400' };
    } else if (todayWater < 1500) {
      hydrationStatus = { amount: todayWater, status: '보통', color: 'text-yellow-400' };
    }

    // Medication compliance
    const recentMeds = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      return entryDate > threeDaysAgo;
    }).length;

    let medStatus = { compliance: recentMeds, status: '우수', color: 'text-green-400' };
    if (recentMeds === 0) {
      medStatus = { compliance: recentMeds, status: '미복용', color: 'text-red-400' };
    } else if (recentMeds < 3) {
      medStatus = { compliance: recentMeds, status: '불규칙', color: 'text-orange-400' };
    }

    // Overall risk assessment
    let riskLevel: HealthStatus['riskLevel'] = 'low';
    let overall: HealthStatus['overall'] = 'excellent';

    if (uricAcidStatus.level && uricAcidStatus.level > 8.0 || recentSymptoms.length >= 3) {
      riskLevel = 'critical';
      overall = 'critical';
    } else if (uricAcidStatus.level && uricAcidStatus.level > 7.0 || recentSymptoms.length >= 2 || todayWater < 1000) {
      riskLevel = 'high';
      overall = 'warning';
    } else if (uricAcidStatus.level && uricAcidStatus.level > 6.0 || recentSymptoms.length === 1) {
      riskLevel = 'medium';
      overall = 'good';
    }

    return {
      overall,
      uricAcid: uricAcidStatus,
      symptoms: symptomStatus,
      hydration: hydrationStatus,
      medication: medStatus,
      riskLevel
    };
  }, [messages]);

  const getRiskBadge = (risk: HealthStatus['riskLevel']) => {
    const badges = {
      low: { text: '낮음', bg: 'bg-green-900/30', border: 'border-green-600', color: 'text-green-300' },
      medium: { text: '보통', bg: 'bg-yellow-900/30', border: 'border-yellow-600', color: 'text-yellow-300' },
      high: { text: '높음', bg: 'bg-orange-900/30', border: 'border-orange-600', color: 'text-orange-300' },
      critical: { text: '위험', bg: 'bg-red-900/30', border: 'border-red-600', color: 'text-red-300' }
    };
    const badge = badges[risk];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.color}`}>
        위험도: {badge.text}
      </span>
    );
  };

  const renderSummaryMode = () => (
    <div className="space-y-4">
      {/* Critical Status Bar */}
      <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900/30 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
            🏥 건강 상태 요약
          </h2>
          {getRiskBadge(healthStatus.riskLevel)}
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-zinc-500 mb-1">요산 수치</div>
            <div className={`text-sm font-bold ${healthStatus.uricAcid.color}`}>
              {healthStatus.uricAcid.level ? `${healthStatus.uricAcid.level.toFixed(1)} mg/dL` : '미측정'}
            </div>
            <div className="text-xs text-zinc-400">{healthStatus.uricAcid.status}</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-zinc-500 mb-1">주간 증상</div>
            <div className={`text-sm font-bold ${healthStatus.symptoms.color}`}>
              {healthStatus.symptoms.count}회
            </div>
            <div className="text-xs text-zinc-400">{healthStatus.symptoms.status}</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-zinc-500 mb-1">오늘 수분</div>
            <div className={`text-sm font-bold ${healthStatus.hydration.color}`}>
              {healthStatus.hydration.amount}ml
            </div>
            <div className="text-xs text-zinc-400">{healthStatus.hydration.status}</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-zinc-500 mb-1">복용 준수</div>
            <div className={`text-sm font-bold ${healthStatus.medication.color}`}>
              {healthStatus.medication.compliance}회/3일
            </div>
            <div className="text-xs text-zinc-400">{healthStatus.medication.status}</div>
          </div>
        </div>
      </div>

      {/* Risk Prediction - Compact */}
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="p-4">
          <h3 className="text-md font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            🔮 위험 예측
            <span className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded-full">실시간</span>
          </h3>
          <GoutFlareRiskPrediction messages={messages} t={t} />
        </div>
      </div>

      {/* Health Score - Compact */}
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
        <HealthScoreSystem messages={messages} t={t} />
      </div>
    </div>
  );

  const renderTrackingMode = () => (
    <div className="space-y-4">
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="p-4">
          <h3 className="text-md font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            📝 일일 추적 현황
          </h3>
          <DailyPurineTracker messages={messages} t={t} />
        </div>
      </div>
      
      {/* Additional tracking widgets can go here */}
    </div>
  );

  const renderAnalysisMode = () => (
    <div className="space-y-4">
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
        <UricAcidTrendChart t={t} />
      </div>
      
      {/* Additional analysis widgets can go here */}
    </div>
  );

  const renderContent = () => {
    switch (activeMode) {
      case 'summary': return renderSummaryMode();
      case 'tracking': return renderTrackingMode();
      case 'analysis': return renderAnalysisMode();
      default: return renderSummaryMode();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Mode Navigation */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-700/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-zinc-100">통합 건강 대시보드</h1>
          <button
            onClick={() => setCompactView(!compactView)}
            className="p-2 bg-zinc-700/50 hover:bg-zinc-600 border border-zinc-600 rounded-lg transition-all duration-200 text-xs"
          >
            {compactView ? '📋' : '⊡'}
          </button>
        </div>
        
        <div className="flex gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 p-3 rounded-lg transition-all duration-200 ${
                activeMode === mode.id
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{mode.icon}</div>
                <div className="text-sm font-semibold">{mode.name}</div>
                {!compactView && (
                  <div className="text-xs opacity-80">{mode.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default UnifiedDashboard;
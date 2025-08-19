import React, { useState, useMemo, useEffect } from 'react';
import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseDietMessages, parseMedicationMessages, parseSymptomMessages } from '../utils/parsers';
import type { TranslationKey } from '../translations';

// Import existing components
import DailyPurineTracker from './DailyPurineTracker';
import HealthScoreSystem from './HealthScoreSystem';
import UricAcidTrendChart from './UricAcidTrendChart';
import GoutFlareRiskPrediction from './GoutFlareRiskPrediction';
import DashboardSettings from './DashboardSettings';

interface OptimizedDashboardProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

interface HealthAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  priority: number;
}

interface QuickMetric {
  id: string;
  label: string;
  value: string;
  status: 'excellent' | 'good' | 'warning' | 'danger' | 'unknown';
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  importance: 'high' | 'medium' | 'low';
}

const OptimizedDashboard: React.FC<OptimizedDashboardProps> = ({ messages, t }) => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['critical-metrics']));

  // Comprehensive health metrics calculation
  const healthMetrics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });
    
    // Get all data sources
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const symptomEntries = parseSymptomMessages(messages);
    const dietEntries = parseDietMessages(messages);
    const medicationEntries = parseMedicationMessages(messages);

    const recentUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const todayWater = waterEntries
      .filter(entry => new Date(entry.date).toDateString() === today)
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const weeklyWater = last7Days.reduce((acc, day) => {
      const dayEntries = waterEntries.filter(entry => 
        new Date(entry.date).toDateString() === day
      );
      return acc + dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    }, 0) / 7;
    
    const recentSymptoms = symptomEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });

    const todayMeals = dietEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    ).length;

    const recentMedications = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      return entryDate > threeDaysAgo;
    }).length;

    return {
      uricAcidLevel: recentUricAcid?.level || null,
      uricAcidDate: recentUricAcid?.date || null,
      todayWater,
      weeklyWaterAvg: Math.round(weeklyWater),
      recentSymptoms: recentSymptoms.length,
      todayMeals,
      medicationCompliance: recentMedications,
      totalConversations: messages.length,
      lastSymptomDate: recentSymptoms.length > 0 ? recentSymptoms[0].date : null
    };
  }, [messages]);

  // Generate prioritized quick metrics
  const quickMetrics = useMemo((): QuickMetric[] => {
    const metrics: QuickMetric[] = [];

    // Uric Acid - Highest Priority
    if (healthMetrics.uricAcidLevel !== null) {
      let status: QuickMetric['status'] = 'excellent';
      let trend: QuickMetric['trend'] = 'stable';
      
      if (healthMetrics.uricAcidLevel > 8.0) status = 'danger';
      else if (healthMetrics.uricAcidLevel > 7.0) status = 'warning';
      else if (healthMetrics.uricAcidLevel > 6.0) status = 'good';
      
      metrics.push({
        id: 'uric-acid',
        label: '요산 수치',
        value: `${healthMetrics.uricAcidLevel.toFixed(1)} mg/dL`,
        status,
        trend,
        icon: '🩸',
        importance: 'high'
      });
    }

    // Recent Symptoms - High Priority
    let symptomStatus: QuickMetric['status'] = 'excellent';
    if (healthMetrics.recentSymptoms >= 3) symptomStatus = 'danger';
    else if (healthMetrics.recentSymptoms >= 2) symptomStatus = 'warning';
    else if (healthMetrics.recentSymptoms === 1) symptomStatus = 'good';

    metrics.push({
      id: 'symptoms',
      label: '주간 증상',
      value: `${healthMetrics.recentSymptoms}회`,
      status: symptomStatus,
      icon: '⚡',
      importance: 'high'
    });

    // Water Intake - Medium Priority
    let waterStatus: QuickMetric['status'] = 'excellent';
    if (healthMetrics.todayWater < 1000) waterStatus = 'danger';
    else if (healthMetrics.todayWater < 1500) waterStatus = 'warning';
    else if (healthMetrics.todayWater < 2000) waterStatus = 'good';

    metrics.push({
      id: 'water',
      label: '오늘 수분',
      value: `${healthMetrics.todayWater}ml`,
      status: waterStatus,
      trend: healthMetrics.weeklyWaterAvg > healthMetrics.todayWater ? 'down' : 
             healthMetrics.weeklyWaterAvg < healthMetrics.todayWater ? 'up' : 'stable',
      icon: '💧',
      importance: 'medium'
    });

    // Medication Compliance - Medium Priority  
    let medStatus: QuickMetric['status'] = 'excellent';
    if (healthMetrics.medicationCompliance === 0) medStatus = 'danger';
    else if (healthMetrics.medicationCompliance < 3) medStatus = 'warning';
    else if (healthMetrics.medicationCompliance < 5) medStatus = 'good';

    metrics.push({
      id: 'medication',
      label: '약물 복용',
      value: `${healthMetrics.medicationCompliance}회/3일`,
      status: medStatus,
      icon: '💊',
      importance: 'medium'
    });

    // Meals Logged - Low Priority
    let mealStatus: QuickMetric['status'] = 'excellent';
    if (healthMetrics.todayMeals === 0) mealStatus = 'warning';
    else if (healthMetrics.todayMeals < 2) mealStatus = 'good';

    metrics.push({
      id: 'meals',
      label: '식사 기록',
      value: `${healthMetrics.todayMeals}회`,
      status: mealStatus,
      icon: '🍽️',
      importance: 'low'
    });

    return metrics.sort((a, b) => {
      // Sort by importance, then by status severity
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      const statusOrder = { danger: 4, warning: 3, good: 2, excellent: 1, unknown: 0 };
      
      if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      }
      return statusOrder[b.status] - statusOrder[a.status];
    });
  }, [healthMetrics]);

  // Generate smart alerts with priority
  useEffect(() => {
    const newAlerts: HealthAlert[] = [];
    const currentTime = new Date();

    // Critical: Very high uric acid
    if (healthMetrics.uricAcidLevel !== null && healthMetrics.uricAcidLevel > 9.0) {
      newAlerts.push({
        id: 'critical-uric-acid',
        type: 'critical',
        title: '긴급 주의',
        message: `요산 수치 ${healthMetrics.uricAcidLevel.toFixed(1)}mg/dL - 즉시 의료진 상담 필요`,
        timestamp: currentTime,
        dismissed: false,
        priority: 1
      });
    }

    // High: Frequent symptoms
    if (healthMetrics.recentSymptoms >= 3) {
      newAlerts.push({
        id: 'frequent-symptoms',
        type: 'high',
        title: '증상 빈발',
        message: `최근 7일간 ${healthMetrics.recentSymptoms}회 증상 발생 - 관리 방법 재검토 필요`,
        timestamp: currentTime,
        dismissed: false,
        priority: 2
      });
    }

    // Medium: Dehydration risk
    if (healthMetrics.todayWater < 1000) {
      newAlerts.push({
        id: 'dehydration-risk',
        type: 'medium',
        title: '탈수 위험',
        message: `오늘 수분 섭취 ${healthMetrics.todayWater}ml - 추가 수분 섭취 권장`,
        timestamp: currentTime,
        dismissed: false,
        priority: 3
      });
    }

    // Update alerts
    setAlerts(prevAlerts => {
      const existingIds = new Set(prevAlerts.map(alert => alert.id));
      const filteredNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
      return [...prevAlerts, ...filteredNewAlerts].sort((a, b) => a.priority - b.priority);
    });
  }, [healthMetrics]);

  const getStatusColor = (status: QuickMetric['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-900/20 border-green-700/50';
      case 'good': return 'text-blue-400 bg-blue-900/20 border-blue-700/50';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50';
      case 'danger': return 'text-red-400 bg-red-900/20 border-red-700/50';
      case 'unknown': return 'text-zinc-400 bg-zinc-900/20 border-zinc-700/50';
    }
  };

  const getAlertStyle = (type: HealthAlert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-900/30 border-red-500 text-red-200 shadow-lg shadow-red-900/20';
      case 'high': return 'bg-orange-900/30 border-orange-500 text-orange-200 shadow-lg shadow-orange-900/20';
      case 'medium': return 'bg-yellow-900/30 border-yellow-500 text-yellow-200 shadow-lg shadow-yellow-900/20';
      case 'info': return 'bg-blue-900/30 border-blue-500 text-blue-200 shadow-lg shadow-blue-900/20';
    }
  };

  const getTrendIcon = (trend?: QuickMetric['trend']) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed && !dismissedAlerts.has(alert.id));
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header with Smart Summary */}
      <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">🎯</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">스마트 건강 대시보드</h1>
              <p className="text-sm text-zinc-400">AI 기반 통풍 관리 시스템</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-zinc-700/50 hover:bg-zinc-600 border border-zinc-600 rounded-lg transition-all duration-200"
          >
            <span className="text-zinc-300">⚙️</span>
          </button>
        </div>
      </div>

      {/* Critical Alerts - Always Visible */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-xl p-3 transition-all duration-300 ${getAlertStyle(alert.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">
                    {alert.type === 'critical' ? '🚨' : alert.type === 'high' ? '⚠️' : alert.type === 'medium' ? '⚡' : 'ℹ️'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                    <p className="text-xs opacity-90">{alert.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Metrics Grid - Prioritized */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {quickMetrics.slice(0, 6).map((metric) => (
          <div
            key={metric.id}
            className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{metric.icon}</span>
              <span className="text-xs">{getTrendIcon(metric.trend)}</span>
            </div>
            <div className="text-xs opacity-80 mb-1">{metric.label}</div>
            <div className="text-sm font-bold">{metric.value}</div>
            {metric.importance === 'high' && (
              <div className="w-full bg-current opacity-20 h-0.5 rounded-full mt-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Expandable Sections */}
      <div className="space-y-3">
        {/* Risk Prediction - Always Expanded */}
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => toggleSection('risk-prediction')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔮</span>
              <h2 className="font-semibold text-zinc-200">위험 예측 분석</h2>
              <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-full">실시간</span>
            </div>
            <span className={`transition-transform ${expandedSections.has('risk-prediction') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.has('risk-prediction') && (
            <div className="border-t border-zinc-700 p-1">
              <GoutFlareRiskPrediction messages={messages} t={t} />
            </div>
          )}
        </div>

        {/* Health Score */}
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => toggleSection('health-score')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📊</span>
              <h2 className="font-semibold text-zinc-200">종합 건강 점수</h2>
            </div>
            <span className={`transition-transform ${expandedSections.has('health-score') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.has('health-score') && (
            <div className="border-t border-zinc-700 p-1">
              <HealthScoreSystem messages={messages} t={t} />
            </div>
          )}
        </div>

        {/* Daily Tracking */}
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => toggleSection('daily-tracking')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📝</span>
              <h2 className="font-semibold text-zinc-200">일일 추적</h2>
            </div>
            <span className={`transition-transform ${expandedSections.has('daily-tracking') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.has('daily-tracking') && (
            <div className="border-t border-zinc-700 p-1">
              <DailyPurineTracker messages={messages} t={t} />
            </div>
          )}
        </div>

        {/* Trend Analysis */}
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => toggleSection('trend-analysis')}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📈</span>
              <h2 className="font-semibold text-zinc-200">추세 분석</h2>
            </div>
            <span className={`transition-transform ${expandedSections.has('trend-analysis') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.has('trend-analysis') && (
            <div className="border-t border-zinc-700 p-1">
              <UricAcidTrendChart t={t} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-gradient-to-r from-zinc-800/30 to-zinc-900/30 rounded-xl p-4 border border-zinc-700/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-zinc-400">시스템 정상</span>
            </div>
            <div className="text-zinc-500">마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="text-zinc-500">총 {healthMetrics.totalConversations}회 상호작용</div>
        </div>
      </div>

      <DashboardSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {}}
        t={t}
      />
    </div>
  );
};

export default OptimizedDashboard;
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

interface ComprehensiveDashboardProps {
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
}

interface DashboardWidget {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
  position: number;
}

const ComprehensiveDashboard: React.FC<ComprehensiveDashboardProps> = ({ messages, t }) => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [widgetLayout, setWidgetLayout] = useState<'grid' | 'list'>('grid');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Load widgets from localStorage or use defaults
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch {
        // Use default widgets if parsing fails
        setDefaultWidgets();
      }
    } else {
      setDefaultWidgets();
    }

    // Load layout setting
    const savedLayout = localStorage.getItem('dashboardLayout') as 'grid' | 'list';
    if (savedLayout) {
      setWidgetLayout(savedLayout);
    }
  }, []);

  const setDefaultWidgets = () => {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'risk-prediction',
        name: '통풍 발작 위험 예측',
        size: 'large',
        enabled: true,
        position: 1
      },
      {
        id: 'health-score',
        name: '건강 관리 점수',
        size: 'medium',
        enabled: true,
        position: 2
      },
      {
        id: 'purine-tracker',
        name: '일일 퓨린 추적',
        size: 'medium',
        enabled: true,
        position: 3
      },
      {
        id: 'uric-acid-trend',
        name: '요산 수치 추이',
        size: 'large',
        enabled: true,
        position: 4
      }
    ];
    setWidgets(defaultWidgets);
  };

  // Get component for widget ID
  const getWidgetComponent = (widgetId: string) => {
    switch (widgetId) {
      case 'risk-prediction': return GoutFlareRiskPrediction;
      case 'health-score': return HealthScoreSystem;
      case 'purine-tracker': return DailyPurineTracker;
      case 'uric-acid-trend': return UricAcidTrendChart;
      default: return null;
    }
  };

  const handleSettingsSave = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
  };

  // Generate real-time health alerts
  const healthMetrics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    
    // Get recent data
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const symptomEntries = parseSymptomMessages(messages);
    const dietEntries = parseDietMessages(messages);
    const medicationEntries = parseMedicationMessages(messages);

    // Calculate metrics
    const recentUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const todayWater = waterEntries
      .filter(entry => new Date(entry.date).toDateString() === today)
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const recentSymptoms = symptomEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });

    const todayDiet = dietEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const recentMedications = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      return entryDate > threeDaysAgo;
    });

    return {
      uricAcidLevel: recentUricAcid?.level || 0,
      waterIntake: todayWater,
      recentSymptoms: recentSymptoms.length,
      todayMeals: todayDiet.length,
      medicationCompliance: recentMedications.length
    };
  }, [messages]);

  // Generate alerts based on health metrics
  useEffect(() => {
    const newAlerts: HealthAlert[] = [];
    const currentTime = new Date();

    // Critical: Very high uric acid
    if (healthMetrics.uricAcidLevel > 9.0) {
      newAlerts.push({
        id: 'critical-uric-acid',
        type: 'critical',
        title: '🚨 긴급 주의 필요',
        message: `요산 수치가 ${healthMetrics.uricAcidLevel.toFixed(1)}mg/dL로 매우 높습니다. 즉시 의료진과 상담하세요.`,
        timestamp: currentTime,
        dismissed: false
      });
    }

    // High: Frequent symptoms
    if (healthMetrics.recentSymptoms >= 3) {
      newAlerts.push({
        id: 'frequent-symptoms',
        type: 'high',
        title: '⚠️ 증상 빈발 경고',
        message: `최근 일주일간 ${healthMetrics.recentSymptoms}회 증상이 발생했습니다. 관리 방법을 재검토하세요.`,
        timestamp: currentTime,
        dismissed: false
      });
    }

    // Medium: Low water intake
    if (healthMetrics.waterIntake < 1000) {
      newAlerts.push({
        id: 'low-hydration',
        type: 'medium',
        title: '💧 수분 섭취 부족',
        message: `오늘 수분 섭취량이 ${healthMetrics.waterIntake}ml입니다. 더 많은 물을 마시세요.`,
        timestamp: currentTime,
        dismissed: false
      });
    }

    // Info: No medication records
    if (healthMetrics.medicationCompliance === 0) {
      newAlerts.push({
        id: 'no-medication',
        type: 'info',
        title: '💊 복용 기록 없음',
        message: '최근 3일간 약물 복용 기록이 없습니다. 꾸준한 기록이 중요합니다.',
        timestamp: currentTime,
        dismissed: false
      });
    }

    // Update alerts, avoiding duplicates
    setAlerts(prevAlerts => {
      const existingIds = new Set(prevAlerts.map(alert => alert.id));
      const filteredNewAlerts = newAlerts.filter(alert => !existingIds.has(alert.id));
      return [...prevAlerts, ...filteredNewAlerts];
    });
  }, [healthMetrics]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setDismissedAlerts(new Set());
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-900/30 border-red-700 text-red-300';
      case 'high': return 'bg-orange-900/30 border-orange-700 text-orange-300';
      case 'medium': return 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      case 'info': return 'bg-blue-900/30 border-blue-700 text-blue-300';
      default: return 'bg-zinc-900/30 border-zinc-700 text-zinc-300';
    }
  };

  // Quick stats summary
  const quickStats = useMemo(() => {
    return [
      {
        label: '요산 수치',
        value: healthMetrics.uricAcidLevel ? `${healthMetrics.uricAcidLevel.toFixed(1)} mg/dL` : '미기록',
        status: healthMetrics.uricAcidLevel <= 6.0 ? 'good' : healthMetrics.uricAcidLevel <= 7.0 ? 'warning' : 'danger'
      },
      {
        label: '오늘 수분 섭취',
        value: `${healthMetrics.waterIntake}ml`,
        status: healthMetrics.waterIntake >= 2000 ? 'good' : healthMetrics.waterIntake >= 1500 ? 'warning' : 'danger'
      },
      {
        label: '주간 증상',
        value: `${healthMetrics.recentSymptoms}회`,
        status: healthMetrics.recentSymptoms === 0 ? 'good' : healthMetrics.recentSymptoms <= 1 ? 'warning' : 'danger'
      },
      {
        label: '오늘 식사 기록',
        value: `${healthMetrics.todayMeals}회`,
        status: healthMetrics.todayMeals >= 3 ? 'good' : healthMetrics.todayMeals >= 1 ? 'warning' : 'danger'
      }
    ];
  }, [healthMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed && !dismissedAlerts.has(alert.id));

  return (
    <div className="p-4 lg:p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">📊 종합 건강 대시보드</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-1 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-zinc-200"
          >
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
          <button
            onClick={() => setWidgetLayout(widgetLayout === 'grid' ? 'list' : 'grid')}
            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-sm text-zinc-200"
          >
            {widgetLayout === 'grid' ? '📋' : '⊞'} 
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-sm text-zinc-200"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
            <div className={`text-lg font-bold ${getStatusColor(stat.status)}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">🔔 실시간 알림</h2>
            <button
              onClick={clearAllAlerts}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              모든 알림 지우기
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 ${getAlertColors(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getAlertIcon(alert.type)}</span>
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                    </div>
                    <p className="text-xs opacity-90">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {alert.timestamp.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-xs opacity-60 hover:opacity-100 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widget Layout */}
      <div className={`${
        widgetLayout === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
          : 'space-y-6'
      }`}>
        {widgets
          .filter(widget => widget.enabled)
          .sort((a, b) => a.position - b.position)
          .map((widget) => {
            const WidgetComponent = getWidgetComponent(widget.id);
            if (!WidgetComponent) return null;
            
            return (
              <div 
                key={widget.id} 
                className={`${
                  widgetLayout === 'grid' && widget.size === 'large' 
                    ? 'lg:col-span-2' 
                    : ''
                }`}
              >
                <WidgetComponent messages={messages} t={t} />
              </div>
            );
          })}
      </div>

      {/* Footer Stats */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">📈 전체 활동 요약</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-400">총 대화:</span>
            <span className="text-zinc-200 ml-1 font-semibold">{messages.length}회</span>
          </div>
          <div>
            <span className="text-zinc-400">활성 알림:</span>
            <span className="text-zinc-200 ml-1 font-semibold">{activeAlerts.length}개</span>
          </div>
          <div>
            <span className="text-zinc-400">데이터 저장:</span>
            <span className="text-green-400 ml-1 font-semibold">로컬</span>
          </div>
          <div>
            <span className="text-zinc-400">마지막 업데이트:</span>
            <span className="text-zinc-200 ml-1 font-semibold">
              {new Date().toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Settings Modal */}
      <DashboardSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        t={t}
      />
    </div>
  );
};

export default ComprehensiveDashboard;
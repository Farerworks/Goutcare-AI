import React, { useState, useEffect } from 'react';
import type { TranslationKey } from '../translations';

interface DashboardWidget {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
  position: number;
  category: 'tracking' | 'analysis' | 'prediction';
}

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgets: DashboardWidget[]) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  t 
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'dark' | 'auto'>('dark');
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [enableNotifications, setEnableNotifications] = useState<boolean>(true);

  // Initialize widgets from localStorage or defaults
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'risk-prediction',
        name: '통풍 발작 위험 예측',
        size: 'large',
        enabled: true,
        position: 1,
        category: 'prediction'
      },
      {
        id: 'health-score',
        name: '건강 관리 점수',
        size: 'medium',
        enabled: true,
        position: 2,
        category: 'analysis'
      },
      {
        id: 'purine-tracker',
        name: '일일 퓨린 추적',
        size: 'medium',
        enabled: true,
        position: 3,
        category: 'tracking'
      },
      {
        id: 'uric-acid-trend',
        name: '요산 수치 추이',
        size: 'large',
        enabled: true,
        position: 4,
        category: 'analysis'
      },
      {
        id: 'water-intake',
        name: '수분 섭취 현황',
        size: 'small',
        enabled: false,
        position: 5,
        category: 'tracking'
      },
      {
        id: 'medication-reminder',
        name: '복용 알림',
        size: 'small',
        enabled: false,
        position: 6,
        category: 'tracking'
      },
      {
        id: 'symptom-heatmap',
        name: '증상 히트맵',
        size: 'medium',
        enabled: false,
        position: 7,
        category: 'analysis'
      },
      {
        id: 'diet-insights',
        name: '식단 인사이트',
        size: 'medium',
        enabled: false,
        position: 8,
        category: 'analysis'
      }
    ];

    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets);
        setWidgets(parsed);
      } catch {
        setWidgets(defaultWidgets);
      }
    } else {
      setWidgets(defaultWidgets);
    }

    // Load other settings
    const savedLayout = localStorage.getItem('dashboardLayout') as 'grid' | 'list' || 'grid';
    const savedTheme = localStorage.getItem('dashboardTheme') as 'dark' | 'auto' || 'dark';
    const savedRefresh = parseInt(localStorage.getItem('dashboardRefresh') || '30');
    const savedNotifications = localStorage.getItem('dashboardNotifications') !== 'false';

    setLayout(savedLayout);
    setTheme(savedTheme);
    setRefreshInterval(savedRefresh);
    setEnableNotifications(savedNotifications);
  }, []);

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ));
  };

  const updateWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size }
        : widget
    ));
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const sortedWidgets = [...prev].sort((a, b) => a.position - b.position);
      const widgetIndex = sortedWidgets.findIndex(w => w.id === widgetId);
      
      if (widgetIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? widgetIndex - 1 : widgetIndex + 1;
      if (newIndex < 0 || newIndex >= sortedWidgets.length) return prev;
      
      // Swap positions
      const temp = sortedWidgets[widgetIndex].position;
      sortedWidgets[widgetIndex].position = sortedWidgets[newIndex].position;
      sortedWidgets[newIndex].position = temp;
      
      return sortedWidgets;
    });
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
    localStorage.setItem('dashboardLayout', layout);
    localStorage.setItem('dashboardTheme', theme);
    localStorage.setItem('dashboardRefresh', refreshInterval.toString());
    localStorage.setItem('dashboardNotifications', enableNotifications.toString());

    onSave(widgets);
    onClose();
  };

  const resetToDefaults = () => {
    if (window.confirm('대시보드 설정을 기본값으로 되돌리시겠습니까?')) {
      localStorage.removeItem('dashboardWidgets');
      localStorage.removeItem('dashboardLayout');
      localStorage.removeItem('dashboardTheme');
      localStorage.removeItem('dashboardRefresh');
      localStorage.removeItem('dashboardNotifications');
      
      // Reload default settings
      window.location.reload();
    }
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return '▫️';
      case 'medium': return '◾';
      case 'large': return '⬛';
      default: return '◾';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tracking': return '📝';
      case 'analysis': return '📊';
      case 'prediction': return '🔮';
      default: return '📋';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'tracking': return '추적';
      case 'analysis': return '분석';
      case 'prediction': return '예측';
      default: return '기타';
    }
  };

  const groupedWidgets = widgets.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-100">⚙️ 대시보드 설정</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Layout Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-3">🎨 레이아웃 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-2">레이아웃 스타일</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as 'grid' | 'list')}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-200"
              >
                <option value="grid">그리드 (⊞)</option>
                <option value="list">리스트 (☰)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-2">새로고침 간격 (초)</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-200"
              >
                <option value={15}>15초</option>
                <option value={30}>30초</option>
                <option value={60}>1분</option>
                <option value={300}>5분</option>
                <option value={0}>자동 새로고침 끄기</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-zinc-300">실시간 알림 활성화</span>
            </label>
          </div>
        </div>

        {/* Widget Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-3">🧩 위젯 구성</h3>
          
          {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
            <div key={category} className="mb-4">
              <h4 className="text-md font-medium text-zinc-300 mb-2 flex items-center gap-2">
                {getCategoryIcon(category)} {getCategoryName(category)}
              </h4>
              
              <div className="space-y-2">
                {categoryWidgets
                  .sort((a, b) => a.position - b.position)
                  .map((widget, index) => (
                  <div
                    key={widget.id}
                    className={`p-3 rounded-lg border transition-all ${
                      widget.enabled
                        ? 'bg-zinc-700 border-zinc-600'
                        : 'bg-zinc-800/50 border-zinc-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={widget.enabled}
                          onChange={() => toggleWidget(widget.id)}
                          className="rounded"
                        />
                        <div>
                          <span className="text-zinc-200 font-medium">{widget.name}</span>
                          <div className="text-xs text-zinc-400 mt-1">
                            크기: {getSizeIcon(widget.size)} {widget.size}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Size Selector */}
                        <select
                          value={widget.size}
                          onChange={(e) => updateWidgetSize(widget.id, e.target.value as any)}
                          disabled={!widget.enabled}
                          className="px-2 py-1 bg-zinc-600 border border-zinc-500 rounded text-xs text-zinc-200 disabled:opacity-50"
                        >
                          <option value="small">작음</option>
                          <option value="medium">보통</option>
                          <option value="large">큰</option>
                        </select>
                        
                        {/* Position Controls */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveWidget(widget.id, 'up')}
                            disabled={!widget.enabled || index === 0}
                            className="px-2 py-1 bg-zinc-600 hover:bg-zinc-500 border border-zinc-500 rounded text-xs text-zinc-200 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveWidget(widget.id, 'down')}
                            disabled={!widget.enabled || index === categoryWidgets.length - 1}
                            className="px-2 py-1 bg-zinc-600 hover:bg-zinc-500 border border-zinc-500 rounded text-xs text-zinc-200 disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-zinc-200 text-sm"
          >
            🔄 기본값으로 복원
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 rounded-lg text-zinc-200"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;
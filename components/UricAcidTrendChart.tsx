import React, { useMemo, useState } from 'react';
import type { UricAcidEntry } from '../types';
import type { TranslationKey } from '../translations';

interface UricAcidTrendChartProps {
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

interface ChartData {
  date: string;
  level: number;
  isTarget: boolean;
  labName?: string;
  displayDate: string;
}

const UricAcidTrendChart: React.FC<UricAcidTrendChartProps> = ({ t }) => {
  const [expanded, setExpanded] = useState(false);
  
  const chartData = useMemo((): ChartData[] => {
    const entries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    
    if (entries.length === 0) return [];
    
    return entries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10) // Show last 10 entries
      .map(entry => ({
        date: entry.date.toString(),
        level: entry.level,
        isTarget: entry.level <= 6.0,
        labName: entry.labName,
        displayDate: new Date(entry.date).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric'
        })
      }));
  }, []);
  
  const TARGET_LEVEL = 6.0;
  const MAX_CHART_VALUE = Math.max(12, Math.max(...chartData.map(d => d.level)) + 1);
  const MIN_CHART_VALUE = 0;
  
  const getStatusColor = (level: number): string => {
    if (level <= 6.0) return '#10b981'; // green
    if (level <= 7.0) return '#f59e0b'; // yellow
    if (level <= 8.0) return '#f97316'; // orange
    return '#ef4444'; // red
  };
  
  const getStatusText = (level: number): string => {
    if (level <= 6.0) return '목표 달성';
    if (level <= 7.0) return '약간 높음';
    if (level <= 8.0) return '높음';
    return '매우 높음';
  };
  
  const calculateTrend = (): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = chartData.slice(-2);
    const diff = recent[1].level - recent[0].level;
    const percentage = Math.abs((diff / recent[0].level) * 100);
    
    if (Math.abs(diff) < 0.2) return { direction: 'stable', percentage };
    return { direction: diff > 0 ? 'up' : 'down', percentage };
  };
  
  const trend = calculateTrend();
  const latestEntry = chartData[chartData.length - 1];

  if (chartData.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-3">
          📈 요산 수치 추이
        </h3>
        <div className="text-center py-8">
          <p className="text-zinc-400 text-sm mb-2">요산 수치 기록이 없습니다</p>
          <p className="text-xs text-zinc-500">요산 수치를 기록하여 변화 추이를 확인해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            📈 요산 수치 추이
            <span className="text-xs text-zinc-500">
              ({chartData.length}회 기록)
            </span>
          </h3>
          <div className="text-right">
            <div className={`text-lg font-bold`} style={{ color: getStatusColor(latestEntry.level) }}>
              {latestEntry.level.toFixed(1)} mg/dL
            </div>
            <div className="text-xs text-zinc-400">
              {getStatusText(latestEntry.level)}
            </div>
          </div>
        </div>
        
        {/* Mini Chart Preview */}
        <div className="mb-2">
          <div className="relative h-12 bg-zinc-900/50 rounded overflow-hidden">
            {/* Target line */}
            <div 
              className="absolute w-full border-t border-dashed border-green-400 opacity-50"
              style={{ 
                top: `${((MAX_CHART_VALUE - TARGET_LEVEL) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100}%` 
              }}
            />
            
            {/* Data points and lines */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Lines */}
              {chartData.map((point, idx) => {
                if (idx === 0) return null;
                const prevPoint = chartData[idx - 1];
                const x1 = (idx - 1) / (chartData.length - 1) * 100;
                const x2 = idx / (chartData.length - 1) * 100;
                const y1 = ((MAX_CHART_VALUE - prevPoint.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                const y2 = ((MAX_CHART_VALUE - point.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                
                return (
                  <line
                    key={`line-${idx}`}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke={getStatusColor(point.level)}
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Points */}
              {chartData.map((point, idx) => {
                const x = idx / (chartData.length - 1) * 100;
                const y = ((MAX_CHART_VALUE - point.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                
                return (
                  <circle
                    key={`point-${idx}`}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill={getStatusColor(point.level)}
                  />
                );
              })}
            </svg>
          </div>
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {trend.direction === 'up' && '📈 상승 중'}
            {trend.direction === 'down' && '📉 하락 중'}
            {trend.direction === 'stable' && '➡️ 안정적'}
            {trend.percentage > 0 && ` (${trend.percentage.toFixed(1)}%)`}
          </span>
          <span className="text-zinc-500">
            {expanded ? '접기 ▲' : '상세보기 ▼'}
          </span>
        </div>
      </div>
      
      {/* Expanded Chart */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
          {/* Full Chart */}
          <div className="relative h-48 bg-zinc-900/30 rounded p-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-zinc-500 pr-2">
              <span>{MAX_CHART_VALUE}</span>
              <span className="text-green-400 font-semibold">{TARGET_LEVEL}</span>
              <span>{MIN_CHART_VALUE}</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-8 relative h-full">
              {/* Target line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-green-400 opacity-30"
                style={{ 
                  top: `${((MAX_CHART_VALUE - TARGET_LEVEL) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100}%` 
                }}
              />
              <div 
                className="absolute left-0 text-xs text-green-400 font-semibold"
                style={{ 
                  top: `${((MAX_CHART_VALUE - TARGET_LEVEL) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100 - 2}%` 
                }}
              >
                목표선
              </div>
              
              {/* Chart SVG */}
              <svg className="w-full h-full">
                {/* Grid lines */}
                {[2, 4, 6, 8, 10].map(level => {
                  if (level > MAX_CHART_VALUE) return null;
                  const y = ((MAX_CHART_VALUE - level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                  return (
                    <line
                      key={`grid-${level}`}
                      x1="0"
                      y1={`${y}%`}
                      x2="100%"
                      y2={`${y}%`}
                      stroke="#3f3f46"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}
                
                {/* Data lines */}
                {chartData.map((point, idx) => {
                  if (idx === 0) return null;
                  const prevPoint = chartData[idx - 1];
                  const x1 = (idx - 1) / (chartData.length - 1) * 100;
                  const x2 = idx / (chartData.length - 1) * 100;
                  const y1 = ((MAX_CHART_VALUE - prevPoint.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                  const y2 = ((MAX_CHART_VALUE - point.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                  
                  return (
                    <line
                      key={`line-${idx}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={getStatusColor(point.level)}
                      strokeWidth="3"
                    />
                  );
                })}
                
                {/* Data points */}
                {chartData.map((point, idx) => {
                  const x = idx / (chartData.length - 1) * 100;
                  const y = ((MAX_CHART_VALUE - point.level) / (MAX_CHART_VALUE - MIN_CHART_VALUE)) * 100;
                  
                  return (
                    <g key={`point-${idx}`}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="5"
                        fill={getStatusColor(point.level)}
                        stroke="#18181b"
                        strokeWidth="2"
                      />
                      {/* Value label */}
                      <text
                        x={`${x}%`}
                        y={`${y - 3}%`}
                        textAnchor="middle"
                        className="text-xs fill-zinc-200"
                        dy="-5"
                      >
                        {point.level.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="ml-8 flex justify-between text-xs text-zinc-500 mt-2">
              {chartData.map((point, idx) => (
                <span key={idx} className="text-center" style={{
                  transform: `translateX(${idx === 0 ? '0' : idx === chartData.length - 1 ? '-100%' : '-50%'})`
                }}>
                  {point.displayDate}
                </span>
              ))}
            </div>
          </div>
          
          {/* Data Table */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">📋 기록 상세</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {chartData.slice().reverse().map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900/50 rounded px-2 py-2">
                  <div>
                    <span className="text-zinc-300">{entry.displayDate}</span>
                    {entry.labName && (
                      <span className="text-zinc-500 ml-2">({entry.labName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-bold"
                      style={{ color: getStatusColor(entry.level) }}
                    >
                      {entry.level.toFixed(1)} mg/dL
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      entry.isTarget ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                    }`}>
                      {entry.isTarget ? '목표달성' : '관리필요'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Analysis */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-300 mb-1">📊 분석 결과</h4>
            <p className="text-blue-200 text-xs">
              {chartData.length < 2 
                ? '더 많은 기록이 필요합니다.'
                : `최근 ${chartData.length}회 기록 중 ${chartData.filter(d => d.isTarget).length}회 목표 달성 (${((chartData.filter(d => d.isTarget).length / chartData.length) * 100).toFixed(0)}%)`
              }
            </p>
            {trend.direction !== 'stable' && (
              <p className="text-blue-200 text-xs mt-1">
                요산 수치가 {trend.direction === 'up' ? '상승' : '하락'} 추세입니다. 
                {trend.direction === 'up' ? ' 식단과 약물 복용을 점검해보세요.' : ' 좋은 관리를 유지하세요!'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UricAcidTrendChart;
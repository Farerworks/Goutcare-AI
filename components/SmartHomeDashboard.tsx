import React, { useMemo } from 'react';
import type { ChatMessage, TranslationKey, Language } from '../types';
import { calculateGoutRisk, generateWeeklyPrediction, generateDailyTip } from '../utils/riskCalculator';
import { 
  ShieldCheckIcon, 
  AlertTriangleIcon, 
  ZapIcon, 
  TrendingUpIcon, 
  StarIcon 
} from './IconComponents';

interface SmartHomeDashboardProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  onQuickAction: (action: 'symptom' | 'medication' | 'diet' | 'water' | 'ai-chat') => void;
}

const SmartHomeDashboard: React.FC<SmartHomeDashboardProps> = ({ 
  messages, 
  t, 
  lang, 
  onQuickAction 
}) => {
  const { riskScore, weeklyPrediction, dailyTip } = useMemo(() => {
    const risk = calculateGoutRisk(messages);
    const prediction = generateWeeklyPrediction(messages);
    const tip = generateDailyTip(risk);
    
    return {
      riskScore: risk,
      weeklyPrediction: prediction,
      dailyTip: tip
    };
  }, [messages]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'from-green-500 to-emerald-500';
      case 'moderate': return 'from-yellow-500 to-orange-500';
      case 'high': return 'from-orange-500 to-red-500';
      case 'critical': return 'from-red-500 to-red-700';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <ShieldCheckIcon className="w-16 h-16 text-white" />;
      case 'moderate': return <AlertTriangleIcon className="w-16 h-16 text-white" />;
      case 'high': return <AlertTriangleIcon className="w-16 h-16 text-white" />;
      case 'critical': return <ZapIcon className="w-16 h-16 text-white" />;
      default: return <ShieldCheckIcon className="w-16 h-16 text-white" />;
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'low': return '안전';
      case 'moderate': return '주의';
      case 'high': return '위험';
      case 'critical': return '매우 위험';
      default: return '알 수 없음';
    }
  };

  const getTipStyle = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-900/20 border-red-500/50 text-red-300';
      case 'important': return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300';
      default: return 'bg-blue-900/20 border-blue-500/50 text-blue-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return (
        <div className="flex items-center gap-2 text-green-400">
          <TrendingUpIcon className="w-4 h-4" />
          <span>개선중</span>
        </div>
      );
      case 'worsening': return (
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangleIcon className="w-4 h-4" />
          <span>악화중</span>
        </div>
      );
      default: return (
        <div className="flex items-center gap-2 text-zinc-400">
          <TrendingUpIcon className="w-4 h-4 rotate-90" />
          <span>안정적</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* 메인 정보 그리드 - 2x2 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 오늘 위험도 */}
          <div className={`
            bg-gradient-to-br ${getRiskColor(riskScore.level)} 
            rounded-2xl p-6 text-white shadow-xl border border-white/10
          `}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                {getRiskIcon(riskScore.level)}
              </div>
              <div>
                <h3 className="text-lg font-bold">오늘 위험도</h3>
                <div className="text-3xl font-bold">{riskScore.today}%</div>
              </div>
            </div>
            <div className="text-sm opacity-90">
              <span className="font-semibold">{getRiskText(riskScore.level)}</span> 상태입니다
            </div>
          </div>

          {/* 내일 예측 */}
          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
                <TrendingUpIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200">내일 예측</h3>
                <div className="text-3xl font-bold text-zinc-200">{riskScore.tomorrow}%</div>
              </div>
            </div>
            <div className="text-sm text-zinc-400">
              {riskScore.tomorrow < riskScore.today ? (
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUpIcon className="w-4 h-4" />
                  <span>개선 예상</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingUpIcon className="w-4 h-4 rotate-90" />
                  <span>현재 수준 유지</span>
                </div>
              )}
            </div>
          </div>

          {/* 주간 트렌드 */}
          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/20">
                <TrendingUpIcon className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200">주간 트렌드</h3>
                <div className="text-sm">{getTrendIcon(weeklyPrediction.trend)}</div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {weeklyPrediction.days.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-zinc-500 mb-1">
                    {index === 0 ? '오늘' : index === 1 ? '내일' : 
                     ['일', '월', '화', '수', '목', '금', '토'][day.date.getDay()]}
                  </div>
                  <div className={`
                    w-full h-8 rounded flex items-center justify-center text-xs font-bold text-white
                    ${day.level === 'low' ? 'bg-green-500' : 
                      day.level === 'moderate' ? 'bg-yellow-500' :
                      day.level === 'high' ? 'bg-orange-500' : 'bg-red-500'}
                  `}>
                    {day.risk}%
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-zinc-400 text-center">
              주간 평균: {weeklyPrediction.averageRisk.toFixed(0)}%
            </div>
          </div>

          {/* 오늘의 팁 */}
          <div className={`rounded-2xl p-6 border-2 ${getTipStyle(dailyTip.category)}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20">
                <StarIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{dailyTip.title}</h3>
                {dailyTip.category === 'urgent' && <ZapIcon className="w-4 h-4 text-red-400 inline ml-2" />}
              </div>
            </div>
            <p className="text-sm mb-3 opacity-90">{dailyTip.message}</p>
            {dailyTip.action && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs font-semibold opacity-80">추천 액션</div>
                <div className="text-sm mt-1">{dailyTip.action}</div>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 기록 - 전체 폭 */}
        <div className="bg-zinc-800/30 rounded-2xl p-6 border border-zinc-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/20">
              <ZapIcon className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">빠른 기록</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onQuickAction('symptom')}
              className="p-4 bg-gradient-to-br from-red-900/30 to-red-900/20 border border-red-500/50 rounded-xl hover:from-red-900/40 hover:to-red-900/30 transition-all duration-200 text-center group shadow-lg"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 group-hover:scale-110 transition-transform">
                <AlertTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-sm font-semibold text-red-300">증상 기록</div>
            </button>

            <button
              onClick={() => onQuickAction('medication')}
              className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-900/20 border border-blue-500/50 rounded-xl hover:from-blue-900/40 hover:to-blue-900/30 transition-all duration-200 text-center group shadow-lg"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-sm font-semibold text-blue-300">약물 기록</div>
            </button>

            <button
              onClick={() => onQuickAction('water')}
              className="p-4 bg-gradient-to-br from-cyan-900/30 to-cyan-900/20 border border-cyan-500/50 rounded-xl hover:from-cyan-900/40 hover:to-cyan-900/30 transition-all duration-200 text-center group shadow-lg"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/20 group-hover:scale-110 transition-transform">
                <StarIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-sm font-semibold text-cyan-300">수분 기록</div>
            </button>

            <button
              onClick={() => onQuickAction('ai-chat')}
              className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-900/20 border border-purple-500/50 rounded-xl hover:from-purple-900/40 hover:to-purple-900/30 transition-all duration-200 text-center group shadow-lg"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 group-hover:scale-110 transition-transform">
                <ZapIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-sm font-semibold text-purple-300">AI 상담</div>
            </button>
          </div>
        </div>

        {/* 격려 메시지 */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
            <StarIcon className="w-5 h-5 text-yellow-400" />
            <span>
              {riskScore.level === 'low' ? 
                '훌륭한 관리를 하고 계시네요! 이대로 계속 유지하세요.' :
                '꾸준한 관리로 더 건강한 내일을 만들어가요!'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeDashboard;
// 사용량 모니터링 컴포넌트
import React, { useState, useEffect } from 'react';
import { getUsageStats } from '../services/geminiOptimized';

interface UsageStats {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  dailyRemaining: number;
  monthlyRemaining: number;
}

export const UsageMonitor: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(getUsageStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const dailyPercent = (stats.dailyUsed / stats.dailyLimit) * 100;
  const monthlyPercent = (stats.monthlyUsed / stats.monthlyLimit) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
          monthlyPercent > 80 
            ? 'bg-red-500 text-white' 
            : monthlyPercent > 60 
            ? 'bg-yellow-500 text-white' 
            : 'bg-green-500 text-white'
        }`}
      >
        📊 {monthlyPercent.toFixed(0)}%
      </button>

      {/* 상세 패널 */}
      {isVisible && (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 w-80 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
            Gemini 사용량 모니터링
          </h3>
          
          {/* 일일 사용량 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">일일 사용량</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {stats.dailyUsed.toLocaleString()} / {stats.dailyLimit.toLocaleString()} 토큰
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  dailyPercent > 80 ? 'bg-red-500' : dailyPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyPercent, 100)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              남은 토큰: {stats.dailyRemaining.toLocaleString()}개
            </div>
          </div>

          {/* 월간 사용량 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">월간 사용량 (무료 한도)</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {stats.monthlyUsed.toLocaleString()} / {stats.monthlyLimit.toLocaleString()} 토큰
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  monthlyPercent > 80 ? 'bg-red-500' : monthlyPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              남은 토큰: {stats.monthlyRemaining.toLocaleString()}개
            </div>
          </div>

          {/* 경고 메시지 */}
          {monthlyPercent > 80 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-red-800 dark:text-red-200 text-sm">
                ⚠️ 월간 무료 한도의 80%를 사용했습니다. 사용량을 줄이거나 유료 플랜을 고려해보세요.
              </div>
            </div>
          )}

          {monthlyPercent > 95 && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mt-2">
              <div className="text-red-900 dark:text-red-100 text-sm font-medium">
                🚨 무료 한도가 거의 소진되었습니다! 추가 사용시 과금될 수 있습니다.
              </div>
            </div>
          )}

          {/* 최적화 팁 */}
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              💡 <strong>절약 팁:</strong> 짧은 질문, 간단한 답변 요청시 토큰을 절약할 수 있습니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// Gemini 서비스 비용 최적화 래퍼
import { generateChatResponseStream as originalGenerateChatResponseStream, summarizeHealthInfo as originalSummarizeHealthInfo, generateGoutForecast as originalGenerateGoutForecast } from './geminiService';
import type { ChatMessage } from '../types';

// 일일 사용량 추적
class UsageTracker {
  private dailyTokens: number = 0;
  private monthlyTokens: number = 0;
  private lastResetDate: string = new Date().toDateString();
  private readonly DAILY_LIMIT = 50000; // 일 5만 토큰
  private readonly MONTHLY_LIMIT = 1500000; // 월 150만 토큰 (무료 한도)
  
  constructor() {
    // localStorage에서 기존 사용량 로드
    this.loadUsage();
  }
  
  private loadUsage() {
    try {
      const saved = localStorage.getItem('gemini_usage');
      if (saved) {
        const usage = JSON.parse(saved);
        this.dailyTokens = usage.dailyTokens || 0;
        this.monthlyTokens = usage.monthlyTokens || 0;
        this.lastResetDate = usage.lastResetDate || new Date().toDateString();
        
        // 날짜가 바뀌면 일일 사용량 리셋
        if (this.lastResetDate !== new Date().toDateString()) {
          this.dailyTokens = 0;
          this.lastResetDate = new Date().toDateString();
          this.saveUsage();
        }
      }
    } catch (error) {
      console.warn('[Usage] Failed to load usage data:', error);
    }
  }
  
  private saveUsage() {
    try {
      localStorage.setItem('gemini_usage', JSON.stringify({
        dailyTokens: this.dailyTokens,
        monthlyTokens: this.monthlyTokens,
        lastResetDate: this.lastResetDate
      }));
    } catch (error) {
      console.warn('[Usage] Failed to save usage data:', error);
    }
  }
  
  addTokens(tokens: number) {
    this.dailyTokens += tokens;
    this.monthlyTokens += tokens;
    this.saveUsage();
    
    console.log(`[Gemini Usage] +${tokens} tokens (Daily: ${this.dailyTokens}/${this.DAILY_LIMIT}, Monthly: ${this.monthlyTokens}/${this.MONTHLY_LIMIT})`);
    
    // 경고 메시지
    if (this.monthlyTokens > this.MONTHLY_LIMIT * 0.8) {
      console.warn(`[Gemini] Warning: 80% of monthly free quota used (${this.monthlyTokens}/${this.MONTHLY_LIMIT})`);
    }
    
    if (this.monthlyTokens > this.MONTHLY_LIMIT * 0.95) {
      console.error(`[Gemini] Alert: 95% of monthly free quota used! Consider upgrading or optimizing.`);
    }
  }
  
  canUseTokens(estimatedTokens: number): boolean {
    return (this.dailyTokens + estimatedTokens <= this.DAILY_LIMIT) && 
           (this.monthlyTokens + estimatedTokens <= this.MONTHLY_LIMIT);
  }
  
  getUsageStats() {
    return {
      dailyUsed: this.dailyTokens,
      dailyLimit: this.DAILY_LIMIT,
      monthlyUsed: this.monthlyTokens,
      monthlyLimit: this.MONTHLY_LIMIT,
      dailyRemaining: Math.max(0, this.DAILY_LIMIT - this.dailyTokens),
      monthlyRemaining: Math.max(0, this.MONTHLY_LIMIT - this.monthlyTokens)
    };
  }
}

const usageTracker = new UsageTracker();

// 토큰 수 추정 함수
function estimateTokens(text: string): number {
  // 대략적인 토큰 추정 (1 토큰 ≈ 4 characters)
  return Math.ceil(text.length / 4);
}

// 메시지 최적화 함수
function optimizeHistory(history: any[]): any[] {
  // 최근 4개 메시지만 유지 (토큰 절약)
  const recentHistory = history.slice(-4);
  
  // 너무 긴 메시지는 요약
  return recentHistory.map(msg => {
    if (Array.isArray(msg.parts)) {
      const content = msg.parts.map(part => part.text).join(' ');
      if (content.length > 500) {
        return {
          ...msg,
          parts: [{ text: content.substring(0, 500) + '...(요약됨)' }]
        };
      }
    }
    return msg;
  });
}

// 최적화된 채팅 생성 함수
export const generateChatResponseStream = async (
  history: any[],
  lang: string = 'en'
): Promise<AsyncGenerator<any>> => {
  const lastMessage = history[history.length - 1];
  const messageContent = Array.isArray(lastMessage.parts) 
    ? lastMessage.parts.map(part => part.text).join(' ')
    : lastMessage.parts?.text || '';
  
  const estimatedTokens = estimateTokens(messageContent) + 1000; // 응답 토큰 추정
  
  // 사용량 체크
  if (!usageTracker.canUseTokens(estimatedTokens)) {
    const stats = usageTracker.getUsageStats();
    const errorMessage = lang === 'ko' 
      ? `일일 사용 한도를 초과했습니다. (${stats.dailyUsed}/${stats.dailyLimit} 토큰)\n내일 다시 시도해주세요.`
      : `Daily usage limit exceeded. (${stats.dailyUsed}/${stats.dailyLimit} tokens)\nPlease try again tomorrow.`;
    
    async function* errorStream() {
      yield {
        response: {
          text: () => errorMessage,
          candidates: [
            {
              content: { parts: [{ text: errorMessage }] },
              finishReason: 'STOP'
            }
          ]
        }
      };
    }
    return errorStream();
  }
  
  // 히스토리 최적화
  const optimizedHistory = optimizeHistory(history);
  
  console.log(`[Gemini Optimized] Processing with ${optimizedHistory.length} messages, estimated ${estimatedTokens} tokens`);
  
  try {
    const response = await originalGenerateChatResponseStream(optimizedHistory, lang);
    
    // 사용량 기록
    usageTracker.addTokens(estimatedTokens);
    
    return response;
  } catch (error) {
    console.error('[Gemini Optimized] Error:', error);
    throw error;
  }
};

// 최적화된 건강 요약 함수
export const summarizeHealthInfo = async (messages: ChatMessage[]): Promise<string> => {
  const estimatedTokens = 500; // 요약은 보통 500 토큰 내외
  
  if (!usageTracker.canUseTokens(estimatedTokens)) {
    return '사용량 한도로 인해 요약을 생성할 수 없습니다. 내일 다시 시도해주세요.';
  }
  
  try {
    const result = await originalSummarizeHealthInfo(messages);
    usageTracker.addTokens(estimatedTokens);
    return result;
  } catch (error) {
    console.error('[Gemini Optimized] Summarize error:', error);
    return '요약 생성 중 오류가 발생했습니다.';
  }
};

// 최적화된 예보 생성 함수
export const generateGoutForecast = async (
  location: string,
  healthProfile: string,
  lang: string = 'ko'
): Promise<any> => {
  const estimatedTokens = 800; // 예보 생성은 보통 800 토큰 내외
  
  if (!usageTracker.canUseTokens(estimatedTokens)) {
    // 사용량 초과시 간단한 정적 예보 반환
    return {
      locationName: location || (lang === 'ko' ? '일반 지역' : 'Generic Region'),
      forecast: [
        { day: 'Today', weather: 'Sunny', goutIndex: 'Good', goutIndexNumeric: 20, explanation: lang === 'ko' ? '좋은 날씨' : 'Good weather' }
      ],
      personalizedAlert: lang === 'ko' ? '사용량 한도로 인해 간단한 예보만 제공됩니다.' : 'Simple forecast due to usage limits.'
    };
  }
  
  try {
    const result = await originalGenerateGoutForecast(location, healthProfile, lang);
    usageTracker.addTokens(estimatedTokens);
    return result;
  } catch (error) {
    console.error('[Gemini Optimized] Forecast error:', error);
    throw error;
  }
};

// 사용량 통계 내보내기
export const getUsageStats = () => usageTracker.getUsageStats();
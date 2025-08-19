// 스마트 AI 라우터 - 개발vs운영 최적화
import type { ChatMessage } from '../types';

// 개발 환경: Gemini Flash (무료)
// 운영 환경: 비용 최적화 라우팅

interface AIConfig {
  development: {
    primary: 'gemini';
    reason: '월 150만 토큰 무료, 웹검색 내장';
  };
  production: {
    routing: 'smart';
    models: ['claude-haiku', 'gpt-4o-mini', 'gemini'];
  };
}

export class SmartAIRouter {
  private env: 'development' | 'production';
  
  constructor() {
    this.env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  
  async route(
    message: string,
    history: ChatMessage[]
  ): Promise<{
    provider: string;
    reasoning: string;
    estimatedCost: number;
  }> {
    
    // 개발 단계: 무조건 Gemini (무료)
    if (this.env === 'development') {
      return {
        provider: 'gemini',
        reasoning: '개발 환경 - 무료 한도 활용',
        estimatedCost: 0
      };
    }
    
    // 운영 단계: 스마트 라우팅
    return this.productionRouting(message, history);
  }
  
  private async productionRouting(
    message: string,
    history: ChatMessage[]
  ) {
    const analysis = this.analyzeQuery(message);
    
    // 1. 간단한 질문 → 캐시된 응답 (무료)
    if (analysis.complexity === 'simple') {
      return {
        provider: 'cache',
        reasoning: '간단한 질문 - 캐시 활용',
        estimatedCost: 0
      };
    }
    
    // 2. 복잡한 의료 질문 → Claude Haiku (고품질)
    if (analysis.type === 'medical' && analysis.complexity === 'complex') {
      return {
        provider: 'claude-haiku',
        reasoning: '복잡한 의료 질문 - 최고 품질 필요',
        estimatedCost: 0.003 // ~$0.003
      };
    }
    
    // 3. 웹 검색 필요 → Gemini (내장 검색)
    if (analysis.needsSearch) {
      return {
        provider: 'gemini',
        reasoning: '웹 검색 필요 - 내장 기능 활용',
        estimatedCost: 0.001 // ~$0.001
      };
    }
    
    // 4. 기본 질문 → GPT-4o mini (가성비)
    return {
      provider: 'gpt-4o-mini',
      reasoning: '일반 질문 - 가성비 최적',
      estimatedCost: 0.002 // ~$0.002
    };
  }
  
  private analyzeQuery(message: string) {
    const lowerMsg = message.toLowerCase();
    
    return {
      complexity: this.getComplexity(message),
      type: this.getType(lowerMsg),
      needsSearch: this.needsSearch(lowerMsg),
      language: /[가-힣]/.test(message) ? 'ko' : 'en'
    };
  }
  
  private getComplexity(message: string): 'simple' | 'complex' {
    // 간단한 질문 패턴
    const simplePatterns = [
      /안녕/,
      /음식/,
      /좋은.*음식/,
      /피해야.*음식/,
      /hello/i,
      /food/i
    ];
    
    return simplePatterns.some(pattern => pattern.test(message)) 
      ? 'simple' 
      : 'complex';
  }
  
  private getType(message: string): 'medical' | 'general' {
    const medicalKeywords = [
      '약물', '복용', '증상', '치료', '진단',
      'medication', 'treatment', 'symptoms', 'diagnosis'
    ];
    
    return medicalKeywords.some(keyword => message.includes(keyword))
      ? 'medical'
      : 'general';
  }
  
  private needsSearch(message: string): boolean {
    const searchKeywords = [
      '최신', '연구', '뉴스', '2024',
      'latest', 'recent', 'new', 'study'
    ];
    
    return searchKeywords.some(keyword => message.includes(keyword));
  }
}

// 비용 추적기
export class CostTracker {
  private dailyCost: number = 0;
  private monthlyCost: number = 0;
  private budget: number = 50; // 월 $50 예산
  
  addCost(cost: number, provider: string) {
    this.dailyCost += cost;
    this.monthlyCost += cost;
    
    console.log(`[Cost] ${provider}: $${cost.toFixed(4)} (Daily: $${this.dailyCost.toFixed(2)}, Monthly: $${this.monthlyCost.toFixed(2)})`);
    
    // 예산 초과 경고
    if (this.monthlyCost > this.budget * 0.8) {
      console.warn(`[Cost] Warning: 80% of monthly budget used ($${this.monthlyCost.toFixed(2)}/$${this.budget})`);
    }
  }
  
  getRemainingBudget(): number {
    return Math.max(0, this.budget - this.monthlyCost);
  }
}

// 사용 예시
export const costTracker = new CostTracker();
export const aiRouter = new SmartAIRouter();
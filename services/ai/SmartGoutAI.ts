// 통풍 관리 앱 전용 스마트 AI 서비스
import { GemmaProvider, QwenMiniProvider, PhiMiniProvider } from './providers/LightweightLLMProvider';
import { ChatHistory } from './AIProvider';

interface GoutQuery {
  type: 'diet' | 'medication' | 'symptom' | 'general';
  complexity: 'simple' | 'complex';
  language: 'ko' | 'en';
}

export class SmartGoutAI {
  private gemma: GemmaProvider;
  private qwen: QwenMiniProvider;
  private phi: PhiMiniProvider;
  
  // 자주 묻는 질문 캐시 (메모리 절약)
  private cache: Map<string, string> = new Map();
  
  constructor() {
    this.gemma = new GemmaProvider();
    this.qwen = new QwenMiniProvider();
    this.phi = new PhiMiniProvider();
    
    // 자주 묻는 질문 사전 로드
    this.preloadCommonAnswers();
  }
  
  async chat(
    message: string,
    history: ChatHistory[]
  ): Promise<{
    answer: string;
    model: string;
    cached: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    // 1. 캐시 확인
    const cached = this.checkCache(message);
    if (cached) {
      return {
        answer: cached,
        model: 'cache',
        cached: true,
        responseTime: Date.now() - startTime
      };
    }
    
    // 2. 질문 분석
    const queryType = this.analyzeQuery(message);
    
    // 3. 최적 모델 선택
    const model = this.selectModel(queryType);
    
    // 4. 응답 생성
    let answer: string;
    let modelName: string;
    
    switch (model) {
      case 'qwen':
        answer = (await this.qwen.generateResponse(message, history)).content;
        modelName = 'Qwen2.5-1.5B';
        break;
      case 'phi':
        answer = (await this.phi.generateResponse(message, history)).content;
        modelName = 'Phi-3-Mini';
        break;
      default:
        answer = (await this.gemma.generateResponse(message, history)).content;
        modelName = 'Gemma-2B';
    }
    
    // 5. 캐시 저장 (간단한 질문만)
    if (queryType.complexity === 'simple') {
      this.cache.set(this.normalizeQuery(message), answer);
    }
    
    return {
      answer,
      model: modelName,
      cached: false,
      responseTime: Date.now() - startTime
    };
  }
  
  private analyzeQuery(message: string): GoutQuery {
    const lowerMsg = message.toLowerCase();
    const isKorean = /[가-힣]/.test(message);
    
    // 질문 유형 분류
    let type: GoutQuery['type'] = 'general';
    if (/음식|먹|식단|퓨린|food|eat|diet|purine/i.test(lowerMsg)) {
      type = 'diet';
    } else if (/약|복용|콜히친|알로|medication|drug|colchicine/i.test(lowerMsg)) {
      type = 'medication';
    } else if (/증상|통증|붓|아프|symptom|pain|swell/i.test(lowerMsg)) {
      type = 'symptom';
    }
    
    // 복잡도 판단
    const complexity = message.length > 50 || 
                      message.includes('?') && message.includes('또는') ||
                      message.split(',').length > 2 
                      ? 'complex' : 'simple';
    
    return {
      type,
      complexity,
      language: isKorean ? 'ko' : 'en'
    };
  }
  
  private selectModel(query: GoutQuery): 'gemma' | 'qwen' | 'phi' {
    // 한국어 질문 → Qwen (한국어 최강)
    if (query.language === 'ko') {
      return 'qwen';
    }
    
    // 의료/약물 관련 복잡한 질문 → Phi (추론 능력)
    if (query.type === 'medication' && query.complexity === 'complex') {
      return 'phi';
    }
    
    // 나머지 → Gemma (균형잡힌 성능)
    return 'gemma';
  }
  
  private checkCache(message: string): string | null {
    const normalized = this.normalizeQuery(message);
    return this.cache.get(normalized) || null;
  }
  
  private normalizeQuery(message: string): string {
    return message.toLowerCase()
      .replace(/[?!.,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private preloadCommonAnswers() {
    // 자주 묻는 질문 미리 준비
    const commonQA = {
      '통풍에 좋은 음식': '체리, 저지방 유제품, 물, 커피, 비타민C가 풍부한 과일이 좋습니다.',
      '통풍에 나쁜 음식': '맥주, 내장육, 붉은 고기, 새우, 멸치 등 퓨린이 높은 음식을 피하세요.',
      '물 얼마나 마셔야': '하루 2-3리터의 물을 마시면 요산 배출에 도움이 됩니다.',
      'good foods for gout': 'Cherries, low-fat dairy, water, coffee, and vitamin C-rich fruits.',
      'foods to avoid': 'Beer, organ meats, red meat, shellfish, and anchovies.',
    };
    
    Object.entries(commonQA).forEach(([q, a]) => {
      this.cache.set(this.normalizeQuery(q), a);
    });
  }
  
  // 모델 성능 모니터링
  async benchmark(): Promise<void> {
    const testQueries = [
      '통풍에 좋은 음식 추천해줘',
      'What medications are used for gout?',
      '발가락이 붓고 아픈데 통풍인가요?',
      'Can I drink beer with gout?'
    ];
    
    console.log('=== Model Benchmark ===');
    
    for (const query of testQueries) {
      const result = await this.chat(query, []);
      console.log(`Q: ${query.substring(0, 30)}...`);
      console.log(`Model: ${result.model}, Time: ${result.responseTime}ms`);
      console.log('---');
    }
  }
}
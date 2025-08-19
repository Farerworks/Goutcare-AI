// 통합 AI Service - Provider 교체 가능
import { AIProviderFactory, AIProvider, ChatHistory } from './AIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { LMStudioProvider } from './providers/LMStudioProvider';

export class AIService {
  private provider: AIProvider;
  private fallbackProvider?: AIProvider;
  
  constructor() {
    // 프로바이더 등록
    this.registerProviders();
    
    // 현재 프로바이더 설정
    this.provider = AIProviderFactory.getCurrentProvider();
    
    // 폴백 프로바이더 설정 (옵션)
    if (process.env.FALLBACK_AI_PROVIDER) {
      this.fallbackProvider = AIProviderFactory.get(process.env.FALLBACK_AI_PROVIDER);
    }
  }
  
  private registerProviders() {
    // LM Studio 등록 (로컬 Gemma-2-3n-e4b)
    AIProviderFactory.register(
      'lmstudio',
      new LMStudioProvider(
        process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
        process.env.LMSTUDIO_MODEL || 'google/gemma-2-3n-e4b'
      )
    );
    
    // OpenAI 등록 (폴백용)
    if (process.env.OPENAI_API_KEY) {
      AIProviderFactory.register(
        'openai',
        new OpenAIProvider(process.env.OPENAI_API_KEY)
      );
    }
    
    // Gemini 등록
    if (process.env.GEMINI_API_KEY) {
      AIProviderFactory.register(
        'gemini',
        new GeminiProvider(process.env.GEMINI_API_KEY)
      );
    }
  }
  
  async chat(
    message: string,
    history: ChatHistory[],
    options?: any
  ): Promise<string> {
    try {
      // 메인 프로바이더 시도
      const response = await this.provider.generateResponse(
        message,
        history,
        options
      );
      
      // 비용 로깅 (개발용)
      if (response.usage) {
        console.log(`[AI Cost] ${this.provider.name}: $${response.usage.cost.toFixed(4)}`);
      }
      
      return response.content;
      
    } catch (error) {
      console.error(`[AI Error] ${this.provider.name}:`, error);
      
      // 폴백 프로바이더가 있으면 시도
      if (this.fallbackProvider) {
        console.log(`[AI] Falling back to ${this.fallbackProvider.name}`);
        const response = await this.fallbackProvider.generateResponse(
          message,
          history,
          options
        );
        return response.content;
      }
      
      throw error;
    }
  }
  
  async analyzeImage(image: Buffer, prompt: string): Promise<string> {
    if (!this.provider.analyzeImage) {
      throw new Error(`Provider ${this.provider.name} does not support image analysis`);
    }
    
    const response = await this.provider.analyzeImage(image, prompt);
    return response.content;
  }
  
  // 프로바이더 동적 변경
  switchProvider(providerName: string) {
    this.provider = AIProviderFactory.get(providerName);
    console.log(`[AI] Switched to ${providerName}`);
  }
  
  // A/B 테스팅용
  async compareProviders(
    message: string,
    history: ChatHistory[]
  ): Promise<Record<string, string>> {
    const providers = ['openai', 'gemini'];
    const results: Record<string, string> = {};
    
    for (const name of providers) {
      try {
        const provider = AIProviderFactory.get(name);
        const response = await provider.generateResponse(message, history);
        results[name] = response.content;
      } catch (error) {
        results[name] = `Error: ${error}`;
      }
    }
    
    return results;
  }
}

// 싱글톤 인스턴스
export const aiService = new AIService();
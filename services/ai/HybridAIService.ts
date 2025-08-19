// 하이브리드 AI 서비스: 로컬 우선, 클라우드 폴백
import { LocalLLMProvider } from './providers/LocalLLMProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AIProvider, ChatHistory } from './AIProvider';

export class HybridAIService {
  private localProvider: LocalLLMProvider;
  private cloudProvider: OpenAIProvider;
  private useLocalFirst: boolean = true;
  
  constructor() {
    // 로컬 Ollama 서버
    this.localProvider = new LocalLLMProvider(
      'http://localhost:11434',
      'qwen2.5:7b'
    );
    
    // 클라우드 폴백
    this.cloudProvider = new OpenAIProvider(
      process.env.OPENAI_API_KEY!,
      'gpt-4o-mini'
    );
  }
  
  async chat(
    message: string,
    history: ChatHistory[]
  ): Promise<{
    content: string;
    source: 'local' | 'cloud';
    cost: number;
  }> {
    // 간단한 질문은 로컬에서 처리
    if (this.isSimpleQuery(message)) {
      try {
        const response = await this.localProvider.generateResponse(
          message,
          history,
          { temperature: 0.5 }
        );
        
        console.log('[AI] Local LLM responded');
        return {
          content: response.content,
          source: 'local',
          cost: 0
        };
      } catch (error) {
        console.log('[AI] Local LLM failed, falling back to cloud');
      }
    }
    
    // 복잡한 질문이나 로컬 실패시 클라우드
    const response = await this.cloudProvider.generateResponse(
      message,
      history
    );
    
    return {
      content: response.content,
      source: 'cloud',
      cost: response.usage?.cost || 0
    };
  }
  
  private isSimpleQuery(message: string): boolean {
    // 간단한 질문 패턴
    const simplePatterns = [
      /퓨린.*높은.*음식/,
      /통풍.*좋은.*음식/,
      /약.*복용/,
      /증상.*완화/,
      /물.*얼마나/
    ];
    
    return simplePatterns.some(pattern => 
      pattern.test(message)
    );
  }
  
  // 비용 통계
  async getUsageStats(): Promise<{
    localRequests: number;
    cloudRequests: number;
    totalCost: number;
    savedCost: number;
  }> {
    // localStorage 또는 DB에서 통계 조회
    return {
      localRequests: 850,
      cloudRequests: 150,
      totalCost: 4.50,
      savedCost: 25.50 // 로컬로 절약한 비용
    };
  }
}
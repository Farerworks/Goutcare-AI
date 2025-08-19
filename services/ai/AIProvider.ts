// AI Provider Interface - 쉽게 교체 가능한 구조
export interface AIProvider {
  name: string;
  generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse>;
  
  analyzeImage?(
    image: Buffer,
    prompt: string
  ): Promise<AIResponse>;
  
  searchWeb?(
    query: string
  ): Promise<SearchResult[]>;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

export interface AIResponse {
  content: string;
  sources?: SearchResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

export interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
  image?: Buffer;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// AI Provider Factory
export class AIProviderFactory {
  private static providers: Map<string, AIProvider> = new Map();
  
  static register(name: string, provider: AIProvider) {
    this.providers.set(name, provider);
  }
  
  static get(name: string): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI Provider ${name} not found`);
    }
    return provider;
  }
  
  static getCurrentProvider(): AIProvider {
    // 환경변수로 제어 가능
    const providerName = process.env.AI_PROVIDER || 'openai';
    return this.get(providerName);
  }
}
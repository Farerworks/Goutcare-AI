// GPT-4o mini Provider - 비용 최적화 버전
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

export class OptimizedOpenAIProvider implements AIProvider {
  name = 'gpt-4o-mini-optimized';
  private apiKey: string;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // 비용 최적화된 메시지 구성
    const messages = this.buildOptimizedMessages(prompt, context);
    
    console.log(`[GPT-4o mini] Calling API...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 400,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
        // 비용 절약을 위한 최적화
        stop: ["\n\n---", "면책조항:", "Disclaimer:"]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GPT-4o mini] API Error ${response.status}:`, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`[GPT-4o mini] Response in ${responseTime}ms`);
    
    // 면책조항 자동 추가
    const content = this.addDisclaimer(data.choices[0].message.content, prompt);
    
    return {
      content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        cost: this.calculateCost(data.usage)
      }
    };
  }
  
  private buildOptimizedMessages(prompt: string, context: ChatHistory[]) {
    const messages = [
      {
        role: 'system',
        content: this.getCompactSystemPrompt()
      }
    ];
    
    // 최근 2개 대화만 포함 (비용 절약)
    context.slice(-2).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }
  
  private getCompactSystemPrompt(): string {
    // 간결한 시스템 프롬프트 (토큰 절약)
    return `통풍 관리 AI. ACR/EULAR 가이드라인 기반 응답. 
목표 요산: <6mg/dL. 피할음식: 내장류,붉은고기,맥주. 좋은음식: 체리,저지방유제품,물.
치료: 콜히친,NSAIDs,알로푸리놀. 안전하고 간결하게 답변. 진단금지.`;
  }
  
  private addDisclaimer(content: string, originalPrompt: string): string {
    const isKorean = /[가-힣]/.test(originalPrompt);
    
    const disclaimer = isKorean
      ? "\n\n---\n*면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다.*"
      : "\n\n---\n*Disclaimer: I am an AI assistant, not a medical professional. It's safest to consult a doctor or pharmacist for any medical advice.*";
    
    return content + disclaimer;
  }
  
  private calculateCost(usage: any): number {
    // GPT-4o mini 가격: $0.15 input, $0.60 output per 1M tokens
    const inputCost = (usage.prompt_tokens / 1000000) * 0.15;
    const outputCost = (usage.completion_tokens / 1000000) * 0.60;
    return inputCost + outputCost;
  }
}

// 웹 검색 기능 추가 버전
export class GPTWithSearchProvider extends OptimizedOpenAIProvider {
  private serpApiKey?: string;
  
  constructor(openaiApiKey: string, serpApiKey?: string) {
    super(openaiApiKey);
    this.serpApiKey = serpApiKey;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    // 검색이 필요한 질문인지 판단
    if (this.needsWebSearch(prompt) && this.serpApiKey) {
      const searchResults = await this.performWebSearch(prompt);
      const enhancedPrompt = `${prompt}\n\n관련 검색 결과:\n${searchResults}`;
      return super.generateResponse(enhancedPrompt, context, options);
    }
    
    return super.generateResponse(prompt, context, options);
  }
  
  private needsWebSearch(prompt: string): boolean {
    const searchKeywords = ['최신', '연구', '뉴스', '2024', '새로운', 'latest', 'recent', 'new'];
    return searchKeywords.some(keyword => prompt.includes(keyword));
  }
  
  private async performWebSearch(query: string): Promise<string> {
    try {
      const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query + ' gout treatment')}&api_key=${this.serpApiKey}&num=3`);
      const data = await response.json();
      
      return data.organic_results
        ?.slice(0, 3)
        .map((result: any) => `${result.title}: ${result.snippet}`)
        .join('\n') || '검색 결과 없음';
    } catch (error) {
      console.error('[Search] Error:', error);
      return '검색 중 오류 발생';
    }
  }
}
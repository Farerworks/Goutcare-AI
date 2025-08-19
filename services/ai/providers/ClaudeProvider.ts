// Claude 3.5 Haiku Provider - 의료 서비스 최적화
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

export class ClaudeProvider implements AIProvider {
  name = 'claude-haiku';
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string, baseUrl: string = 'https://api.anthropic.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Claude 메시지 형식으로 변환
    const messages = this.buildClaudeMessages(prompt, context);
    
    console.log(`[Claude] Calling API...`);
    
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: options?.maxTokens || 500,
        temperature: options?.temperature || 0.3,
        messages,
        system: this.getSystemPrompt()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Claude] API Error ${response.status}:`, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`[Claude] Response in ${responseTime}ms`);
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        cost: this.calculateCost(data.usage)
      }
    };
  }
  
  private buildClaudeMessages(prompt: string, context: ChatHistory[]) {
    const messages = [];
    
    // 컨텍스트 추가 (최근 4개만)
    context.slice(-4).forEach(msg => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });
    
    // 현재 프롬프트
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }
  
  private getSystemPrompt(): string {
    return `You are a specialized AI assistant for gout management, trained on medical guidelines from ACR, EULAR, and KCR.

CORE MEDICAL KNOWLEDGE:
- Normal uric acid: <6 mg/dL (<360 μmol/L)
- High-purine foods: organ meats, red meat, certain seafood, alcohol
- Low-purine foods: dairy, eggs, vegetables, fruits
- First-line treatments: Colchicine, NSAIDs, Allopurinol

RESPONSE GUIDELINES:
1. Provide evidence-based information only
2. Always include medical disclaimer
3. Be empathetic and supportive  
4. Keep responses concise but comprehensive
5. Respond in the same language as the question
6. For Korean questions, respond naturally in Korean

SAFETY RULES:
- Never diagnose conditions
- Never prescribe specific medications
- Always recommend consulting healthcare providers
- If uncertain, suggest professional medical consultation

DISCLAIMER (always include):
"면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다."`;
  }
  
  private calculateCost(usage: any): number {
    // Claude 3.5 Haiku 가격: $0.25 input, $1.25 output per 1M tokens
    const inputCost = (usage.input_tokens / 1000000) * 0.25;
    const outputCost = (usage.output_tokens / 1000000) * 1.25;
    return inputCost + outputCost;
  }
}

// 한국에서 Claude API 사용을 위한 프록시 제공자
export class ClaudeProxyProvider extends ClaudeProvider {
  constructor(apiKey: string) {
    // 한국 우회용 프록시 서버 (예: Vercel, Cloudflare Workers)
    super(apiKey, 'https://your-claude-proxy.vercel.app');
  }
}

// 비용 효율적인 설정
export class ClaudeOptimizedProvider extends ClaudeProvider {
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    // 짧은 프롬프트로 최적화
    const optimizedPrompt = this.optimizePrompt(prompt);
    
    return super.generateResponse(
      optimizedPrompt,
      context.slice(-2), // 컨텍스트 더 제한
      {
        ...options,
        maxTokens: Math.min(options?.maxTokens || 300, 300), // 토큰 제한
        temperature: 0.3 // 일관성 우선
      }
    );
  }
  
  private optimizePrompt(prompt: string): string {
    // 간결한 프롬프트로 변환하여 비용 절약
    if (prompt.length > 200) {
      return prompt.substring(0, 200) + '...(간략한 답변 부탁)';
    }
    return prompt;
  }
}
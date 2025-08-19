// LM Studio Provider - Gemma-2-3n-e4b 최적화
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

export class LMStudioProvider implements AIProvider {
  name = 'lmstudio-gemma';
  private apiUrl: string;
  private modelPath: string;
  
  constructor(
    apiUrl: string = 'http://localhost:1234/v1',
    modelPath: string = 'google/gemma-3n-e4b'
  ) {
    this.apiUrl = apiUrl;
    this.modelPath = modelPath;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // LM Studio는 OpenAI 호환 API 사용
    const messages = this.buildMessages(prompt, context);
    
    console.log(`[LM Studio] Calling API: ${this.apiUrl}/chat/completions`);
    console.log(`[LM Studio] Messages:`, messages);
    
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lm-studio' // LM Studio 기본값
      },
      body: JSON.stringify({
        model: this.modelPath,
        messages,
        temperature: options?.temperature ?? 0.4, // 의료 정보는 보수적으로
        max_tokens: options?.maxTokens ?? 200,
        top_p: 0.95,
        frequency_penalty: 0.2, // 반복 줄이기
        presence_penalty: 0.1,
        // Gemma 최적화 설정
        stream: false,
        stop: ["Human:", "Assistant:", "User:"]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LM Studio] API Error ${response.status}:`, errorText);
      throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[LM Studio] Raw response:`, data);
    const responseTime = Date.now() - startTime;
    
    console.log(`[LM Studio] Gemma-2-3n-e4b responded in ${responseTime}ms`);
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        cost: 0 // 로컬 실행 = 무료
      }
    };
  }
  
  private buildMessages(prompt: string, context: ChatHistory[]) {
    const messages = [
      {
        role: 'system',
        content: this.getGoutSystemPrompt()
      }
    ];
    
    // 최근 4개 대화만 포함 (메모리 절약)
    context.slice(-4).forEach(msg => {
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
  
  private getGoutSystemPrompt(): string {
    // Gemma-2-3n-e4b에 최적화된 시스템 프롬프트
    return `You are GoutCare AI, a medical assistant specialized in gout management.

MEDICAL KNOWLEDGE BASE:
• Normal uric acid: <6 mg/dL (<360 μmol/L)
• High-purine foods: organ meats, red meat, seafood, alcohol (especially beer)
• Low-purine foods: dairy, eggs, vegetables, fruits, coffee
• First-line acute treatment: Colchicine, NSAIDs, corticosteroids
• Long-term treatment: Allopurinol, Febuxostat
• Lifestyle: weight loss, hydration, moderate exercise

RESPONSE GUIDELINES:
1. Provide evidence-based information following ACR/EULAR guidelines
2. Always include medical disclaimer: "Consult your healthcare provider"
3. Be empathetic and supportive
4. Use simple, clear language
5. Respond in the same language as the question
6. Keep responses concise but comprehensive
7. For emergencies, advise immediate medical attention

SAFETY RULES:
- Never diagnose conditions
- Never recommend specific medications without doctor consultation
- Always emphasize the importance of professional medical care
- If unsure, suggest consulting a healthcare provider`;
  }
  
  // LM Studio 서버 상태 확인
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/models`, {
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // 모델 로드 상태 확인
  async getModelStatus(): Promise<{
    loaded: boolean;
    modelName?: string;
    memoryUsage?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/models`);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        return {
          loaded: true,
          modelName: data.data[0].id,
          memoryUsage: '~3GB' // Gemma-2-3n-e4b 예상 사용량
        };
      }
      
      return { loaded: false };
    } catch {
      return { loaded: false };
    }
  }
}
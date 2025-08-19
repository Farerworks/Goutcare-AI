// 경량 모델 프로바이더 - 통풍 관리 앱 최적화
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

// Gemma 2B - Google의 경량 모델
export class GemmaProvider implements AIProvider {
  name = 'gemma-2b';
  private apiUrl: string;
  
  constructor(apiUrl: string = 'http://localhost:11434') {
    this.apiUrl = apiUrl;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Gemma는 의료 지침을 잘 이해하도록 프롬프트 최적화
    const optimizedPrompt = this.createMedicalPrompt(prompt, context);
    
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma:2b',
        prompt: optimizedPrompt,
        stream: false,
        options: {
          temperature: 0.3, // 의료 정보는 일관성 중요
          top_k: 20,
          top_p: 0.9,
          repeat_penalty: 1.1,
        }
      })
    });
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    console.log(`[Gemma 2B] Response in ${responseTime}ms`);
    
    return {
      content: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        cost: 0, // 로컬 실행 = 무료
      }
    };
  }
  
  private createMedicalPrompt(prompt: string, context: ChatHistory[]): string {
    // Gemma에 최적화된 의료 프롬프트
    return `You are GoutCare AI, a medical assistant for gout management.

CORE KNOWLEDGE:
- Normal uric acid: <6 mg/dL
- Gout triggers: alcohol, red meat, seafood, dehydration
- First-line medication: Colchicine, NSAIDs, Allopurinol
- Emergency symptoms: fever with joint pain, multiple joint involvement

RESPONSE RULES:
1. Be concise and clear
2. Always mention "consult your doctor" for medications
3. Use simple language
4. Respond in the same language as the question

Previous context (last 2 exchanges):
${context.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

User question: ${prompt}

Assistant response:`;
  }
}

// Qwen2.5 1.5B - 한국어 특화
export class QwenMiniProvider implements AIProvider {
  name = 'qwen-mini';
  private apiUrl: string;
  
  constructor(apiUrl: string = 'http://localhost:11434') {
    this.apiUrl = apiUrl;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const isKorean = /[가-힣]/.test(prompt);
    
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: this.createPrompt(prompt, context, isKorean),
        stream: false,
        options: {
          temperature: 0.4,
          max_tokens: 500, // 짧고 명확한 답변
        }
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.response,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
      }
    };
  }
  
  private createPrompt(prompt: string, context: ChatHistory[], isKorean: boolean): string {
    if (isKorean) {
      return `당신은 통풍 관리 AI 어시스턴트입니다.

핵심 지식:
- 정상 요산: 6 mg/dL 미만
- 통풍 유발 음식: 술, 붉은 고기, 해산물
- 1차 약물: 콜히친, NSAIDs, 알로푸리놀
- 응급증상: 발열+관절통, 다발성 관절

이전 대화:
${context.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}

질문: ${prompt}

답변:`;
    }
    
    return this.createMedicalPrompt(prompt, context);
  }
  
  private createMedicalPrompt(prompt: string, context: ChatHistory[]): string {
    return `Medical AI for gout. Be concise.
Context: ${context.slice(-2).map(m => `${m.content}`).join(' ')}
Q: ${prompt}
A:`;
  }
}

// Phi-3 Mini - Microsoft의 고성능 경량 모델
export class PhiMiniProvider implements AIProvider {
  name = 'phi-mini';
  private apiUrl: string;
  
  constructor(apiUrl: string = 'http://localhost:11434') {
    this.apiUrl = apiUrl;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    // Phi-3는 Instruct 형식 선호
    const instructPrompt = `<|system|>
You are a helpful medical AI assistant specialized in gout management.
Provide evidence-based advice following medical guidelines.
<|end|>
<|user|>
${prompt}
<|end|>
<|assistant|>`;
    
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: instructPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 400,
        }
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.response,
      usage: { promptTokens: 0, completionTokens: 0, cost: 0 }
    };
  }
}
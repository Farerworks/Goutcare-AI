// 오픈소스 LLM Provider 구현
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

export class LocalLLMProvider implements AIProvider {
  name = 'local-llm';
  private apiUrl: string;
  private modelName: string;
  
  constructor(apiUrl: string, modelName: string) {
    this.apiUrl = apiUrl; // Ollama, vLLM, 또는 Hugging Face Inference
    this.modelName = modelName;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[],
    options?: AIOptions
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Ollama API 예시
    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: this.buildPrompt(prompt, context),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          top_k: 40,
          top_p: 0.9,
        }
      })
    });
    
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return {
      content: data.response,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        cost: 0, // 오픈소스는 무료!
      }
    };
  }
  
  private buildPrompt(prompt: string, context: ChatHistory[]): string {
    // 의료 특화 프롬프트 템플릿
    const systemPrompt = `You are a gout management AI assistant based on medical guidelines.
Always provide evidence-based information and include disclaimers.

Context from previous conversation:
${context.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current question: ${prompt}

Response (in the same language as the question):`;
    
    return systemPrompt;
  }
}

// 의료 특화 모델을 위한 확장 클래스
export class MedicalLLMProvider extends LocalLLMProvider {
  constructor(apiUrl: string) {
    // MedAlpaca 또는 BioMistral 사용
    super(apiUrl, 'medalpaca-7b');
  }
  
  protected buildPrompt(prompt: string, context: ChatHistory[]): string {
    // 의료 전문 프롬프트
    return `[INST] You are a medical AI assistant specialized in gout management.
    
Guidelines to follow:
- ACR/EULAR/KCR gout management guidelines
- Evidence-based recommendations only
- Always include disclaimer to consult healthcare professionals
- Be empathetic and supportive

Previous context:
${context.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Patient question: ${prompt}

Provide a helpful, accurate response: [/INST]`;
  }
}
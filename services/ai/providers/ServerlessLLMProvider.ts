// 서버리스 오픈소스 LLM (Replicate, Hugging Face)
import { AIProvider, AIResponse, ChatHistory } from '../AIProvider';

// Replicate Provider - 서버리스로 오픈소스 모델 실행
export class ReplicateProvider implements AIProvider {
  name = 'replicate';
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[]
  ): Promise<AIResponse> {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'meta/llama-2-70b-chat', // 또는 다른 모델
        input: {
          prompt: this.buildPrompt(prompt, context),
          max_tokens: 1000,
          temperature: 0.7,
        }
      })
    });
    
    const prediction = await response.json();
    
    // 결과 폴링 (Replicate는 비동기)
    const output = await this.pollForOutput(prediction.id);
    
    return {
      content: output,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        cost: 0.0002 // Replicate는 매우 저렴
      }
    };
  }
  
  private async pollForOutput(predictionId: string): Promise<string> {
    // 결과 폴링 로직
    let attempts = 0;
    while (attempts < 30) {
      const response = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'succeeded') {
        return data.output.join('');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Timeout waiting for prediction');
  }
  
  private buildPrompt(prompt: string, context: ChatHistory[]): string {
    return `System: You are a medical AI assistant for gout management.
${context.map(m => `${m.role}: ${m.content}`).join('\n')}
User: ${prompt}
Assistant:`;
  }
}

// Hugging Face Inference API
export class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  private apiKey: string;
  private modelId: string;
  
  constructor(apiKey: string, modelId: string = 'mistralai/Mistral-7B-Instruct-v0.2') {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }
  
  async generateResponse(
    prompt: string,
    context: ChatHistory[]
  ): Promise<AIResponse> {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: this.buildPrompt(prompt, context),
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
          }
        })
      }
    );
    
    const data = await response.json();
    
    return {
      content: data[0].generated_text,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        cost: 0 // 무료 티어 사용 가능
      }
    };
  }
  
  private buildPrompt(prompt: string, context: ChatHistory[]): string {
    return `[INST] ${prompt} [/INST]`;
  }
}
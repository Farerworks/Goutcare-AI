// OpenAI Provider Implementation
import { AIProvider, AIResponse, ChatHistory, AIOptions } from '../AIProvider';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
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
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      ...context.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: options?.streaming ?? false
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        cost: this.calculateCost(data.usage)
      }
    };
  }
  
  async analyzeImage(image: Buffer, prompt: string): Promise<AIResponse> {
    // GPT-4 Vision 사용
    const base64Image = image.toString('base64');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        cost: this.calculateCost(data.usage)
      }
    };
  }
  
  private calculateCost(usage: any): number {
    // GPT-4o mini 가격: $0.15 / 1M input, $0.60 / 1M output
    const inputCost = (usage.prompt_tokens / 1000000) * 0.15;
    const outputCost = (usage.completion_tokens / 1000000) * 0.60;
    return inputCost + outputCost;
  }
  
  private getSystemPrompt(): string {
    return `You are a gout management AI assistant. 
    Provide evidence-based information following ACR, EULAR, and KCR guidelines.
    Always include a disclaimer to consult healthcare professionals.
    Be empathetic and supportive.`;
  }
}
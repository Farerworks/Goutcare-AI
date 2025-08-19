// 기존 geminiService.ts를 새로운 AIService로 마이그레이션

import { aiService } from './ai/AIService';
import type { ChatMessage } from '../types';

// 기존 함수 시그니처 유지하면서 내부만 교체
export async function generateChatResponseStream(
  messages: ChatMessage[],
  language: 'en' | 'ko'
) {
  // 기존 Gemini 특화 코드를 프로바이더 중립적으로 변경
  const history = messages.map(msg => ({
    role: msg.role === 'model' ? 'assistant' as const : 'user' as const,
    content: msg.content,
    image: msg.image ? Buffer.from(msg.image.data, 'base64') : undefined
  }));
  
  const lastMessage = messages[messages.length - 1];
  
  // 새로운 AI Service 사용
  const response = await aiService.chat(
    lastMessage.content,
    history.slice(0, -1), // 마지막 메시지 제외
    {
      temperature: 0.7,
      streaming: true
    }
  );
  
  return response;
}

// 이미지 분석도 동일하게 마이그레이션
export async function analyzeFood(imageData: string, language: 'en' | 'ko') {
  const imageBuffer = Buffer.from(imageData, 'base64');
  
  const prompt = language === 'ko' 
    ? '이 음식의 퓨린 함량을 분석해주세요.'
    : 'Analyze the purine content of this food.';
  
  return await aiService.analyzeImage(imageBuffer, prompt);
}
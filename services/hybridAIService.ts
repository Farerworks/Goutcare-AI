// 하이브리드 AI 서비스 - LM Studio + 폴백 전략
import type { ChatMessage } from '../types';

// LM Studio Provider 임포트
import { LMStudioProvider } from './ai/providers/LMStudioProvider';

const lmStudioProvider = new LMStudioProvider(
  'http://localhost:3001/api/v1',
  'google/gemma-3n-e4b'
);

// 빠른 응답을 위한 타임아웃 설정
const LM_STUDIO_TIMEOUT = 8000; // 8초

// 타임아웃 기능이 있는 요청 함수
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}

// 간단한 패턴 기반 응답 (즉시 응답)
function getQuickResponse(message: string, lang: string = 'ko'): string | null {
  const lowerMsg = message.toLowerCase();
  const isKorean = /[가-힣]/.test(message);
  
  // 인사말
  if (message.includes('안녕') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return isKorean 
      ? `안녕하세요! 통풍 관리 AI 어시스턴트입니다. 😊

궁금한 것이 있으시면 언제든 말씀해 주세요:
• 통풍에 좋은/나쁜 음식
• 증상 관리 방법  
• 약물 복용 정보
• 생활습관 개선

어떤 도움이 필요하신가요?

---
*면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다.*`
      : `Hello! I'm your gout management AI assistant. 😊

I can help with:
• Foods to eat or avoid with gout
• Symptom management tips
• Medication guidance
• Lifestyle recommendations

What would you like to know?

---
*Disclaimer: I am an AI assistant, not a medical professional. It's safest to consult a doctor or pharmacist for any medical advice.*`;
  }
  
  // 음식 관련
  if (message.includes('음식') || lowerMsg.includes('food')) {
    return isKorean
      ? `통풍 관리를 위한 음식 가이드:

**✅ 좋은 음식:**
• 체리 - 염증 완화
• 저지방 유제품 - 요산 감소
• 물 - 하루 2-3L
• 커피 - 요산 수치 개선
• 비타민C 과일 - 오렌지, 딸기

**❌ 피할 음식:**
• 맥주/독한 술 - 요산 급상승
• 내장류 - 간, 콩팥 등
• 붉은 고기 - 소고기, 돼지고기 제한
• 일부 해산물 - 멸치, 정어리

균형 잡힌 식단이 가장 중요합니다!

---
*면책조항: 의료 조언이 필요하시면 의사나 약사와 상담하세요.*`
      : `Gout-friendly food guide:

**✅ Good Foods:**
• Cherries - anti-inflammatory
• Low-fat dairy - reduces uric acid
• Water - 2-3L daily
• Coffee - improves uric acid levels
• Vitamin C fruits - oranges, berries

**❌ Avoid:**
• Beer/spirits - spike uric acid
• Organ meats - very high purines
• Red meat - limit beef, pork
• Certain seafood - anchovies, sardines

Balance is key!

---
*Disclaimer: Consult healthcare professionals for medical advice.*`;
  }
  
  return null; // 패턴 매칭 실패시 null 반환
}

// 메인 채팅 함수
export const generateChatResponseStream = async (
  history: any[], 
  lang: string = 'en'
): Promise<AsyncGenerator<any>> => {
  try {
    // 마지막 메시지 추출
    const lastMessage = history[history.length - 1];
    const userMessage = Array.isArray(lastMessage.parts) 
      ? lastMessage.parts.map(part => part.text).join(' ')
      : lastMessage.parts?.text || lastMessage.content || '';

    console.log(`[Hybrid AI] Processing: "${userMessage.substring(0, 50)}..."`);
    
    // 1단계: 빠른 패턴 응답 시도
    const quickResponse = getQuickResponse(userMessage, lang);
    if (quickResponse) {
      console.log(`[Hybrid AI] Quick response used`);
      
      async function* quickStream() {
        yield {
          response: {
            text: () => quickResponse,
            candidates: [
              {
                content: { parts: [{ text: quickResponse }] },
                finishReason: 'STOP'
              }
            ]
          }
        };
      }
      return quickStream();
    }
    
    // 2단계: LM Studio 시도 (타임아웃 있음)
    try {
      console.log(`[Hybrid AI] Trying LM Studio...`);
      
      const chatHistory = history.slice(0, -1).map(content => ({
        role: content.role === 'model' ? 'assistant' as const : 'user' as const,
        content: Array.isArray(content.parts) 
          ? content.parts.map(part => part.text).join(' ')
          : content.parts?.text || content.content || ''
      }));

      const response = await withTimeout(
        lmStudioProvider.generateResponse(
          userMessage,
          chatHistory,
          { temperature: 0.4, maxTokens: 150 }
        ),
        LM_STUDIO_TIMEOUT
      );

      console.log(`[Hybrid AI] LM Studio success`);
      
      async function* lmStudioStream() {
        yield {
          response: {
            text: () => response.content,
            candidates: [
              {
                content: { parts: [{ text: response.content }] },
                finishReason: 'STOP'
              }
            ]
          }
        };
      }
      return lmStudioStream();
      
    } catch (error) {
      console.log(`[Hybrid AI] LM Studio failed: ${error.message}`);
    }
    
    // 3단계: 기본 응답 (폴백)
    console.log(`[Hybrid AI] Using fallback response`);
    
    const fallbackResponse = lang === 'ko'
      ? `죄송합니다. 현재 AI 서비스가 일시적으로 느려지고 있습니다.

다시 시도해주시거나, 다음과 같은 간단한 질문을 해보세요:
• "안녕하세요"
• "통풍에 좋은 음식은?"
• "피해야 할 음식은?"

곧 정상화될 예정입니다.

---
*면책조항: 의료 조언이 필요하시면 의사나 약사와 상담하세요.*`
      : `I apologize for the delay. The AI service is temporarily slow.

Please try again or ask simple questions like:
• "Hello"
• "What foods are good for gout?"
• "What foods should I avoid?"

Service will normalize soon.

---
*Disclaimer: Consult healthcare professionals for medical advice.*`;

    async function* fallbackStream() {
      yield {
        response: {
          text: () => fallbackResponse,
          candidates: [
            {
              content: { parts: [{ text: fallbackResponse }] },
              finishReason: 'STOP'
            }
          ]
        }
      };
    }
    return fallbackStream();
    
  } catch (error) {
    console.error('[Hybrid AI] Error:', error);
    throw error;
  }
};

// 건강 요약 (간단 버전)
export const summarizeHealthInfo = async (messages: ChatMessage[]): Promise<string> => {
  const healthLogs = messages.filter(msg => 
    msg.content.includes('[증상 체크인]') || 
    msg.content.includes('[약물 기록]') || 
    msg.content.includes('[식단 기록]')
  );

  return healthLogs.length > 0 
    ? `건강 기록 ${healthLogs.length}개가 등록되어 있습니다. 꾸준한 관리 중입니다!`
    : '아직 건강 기록이 없습니다. 증상, 약물, 식단을 기록해보세요.';
};

// 간단한 예보 생성
export const generateGoutForecast = async (
  location: string,
  healthProfile: string,
  lang: string = 'ko'
): Promise<any> => {
  
  // 빠른 정적 예보 (실제로는 날씨 API + AI 조합)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const forecast = days.map((day, index) => ({
    day,
    weather: ['Sunny', 'Cloudy', 'Rainy'][index % 3],
    goutIndex: ['Good', 'Moderate', 'Caution'][index % 3],
    goutIndexNumeric: 20 + (index * 10),
    explanation: lang === 'ko' 
      ? ['날씨 좋음', '약간 주의', '비 조심'][index % 3]
      : ['Good weather', 'Be careful', 'Watch rain'][index % 3]
  }));

  return {
    locationName: location || (lang === 'ko' ? '서울, 대한민국' : 'Seoul, South Korea'),
    forecast,
    personalizedAlert: lang === 'ko' 
      ? '수분 섭취를 충분히 하세요!'
      : 'Stay well hydrated!'
  };
};
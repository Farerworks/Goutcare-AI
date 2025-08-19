// Mock LM Studio 서비스 - 빠른 테스트용
import type { ChatMessage } from '../types';

// Mock 응답 생성
export const generateChatResponseStream = async (
  history: any[], 
  lang: string = 'en'
): Promise<AsyncGenerator<any>> => {
  
  const lastMessage = history[history.length - 1];
  const userMessage = Array.isArray(lastMessage.parts) 
    ? lastMessage.parts.map(part => part.text).join(' ')
    : lastMessage.parts?.text || lastMessage.content || '';

  console.log(`[Mock LM Studio] Processing: "${userMessage}"`);

  // 한국어 감지
  const isKorean = /[가-힣]/.test(userMessage);
  
  // 질문별 응답 생성
  let response = '';
  
  if (userMessage.includes('안녕') || userMessage.toLowerCase().includes('hello')) {
    response = isKorean 
      ? `안녕하세요! 👋 통풍 관리 AI 어시스턴트입니다. 

통풍과 관련해서 궁금한 점이 있으시면 언제든 말씀해 주세요. 예를 들어:
- 통풍에 좋은 음식이나 피해야 할 음식
- 증상 관리 방법
- 약물 복용에 대한 정보
- 생활습관 개선 방법

어떤 도움이 필요하신가요?

---
*면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다.*`
      : `Hello! 👋 I'm your gout management AI assistant.

I can help you with:
- Foods to eat or avoid with gout
- Symptom management tips
- Medication information
- Lifestyle recommendations

What would you like to know about gout management?

---
*Disclaimer: I am an AI assistant, not a medical professional. It's safest to consult a doctor or pharmacist for any medical advice.*`;
  }
  else if (userMessage.includes('음식') || userMessage.includes('food')) {
    response = isKorean
      ? `통풍에 좋은 음식들을 추천드리겠습니다:

**✅ 권장 음식들:**
- **체리**: 염증 완화 효과
- **저지방 유제품**: 요산 수치 감소 도움
- **물**: 하루 2-3L 충분한 수분 섭취
- **커피**: 요산 수치 낮추는 효과
- **비타민C 풍부한 과일**: 오렌지, 딸기 등

**❌ 피해야 할 음식들:**
- **맥주와 독한 술**: 요산 수치 급상승
- **내장류**: 간, 콩팥 등 퓨린 함량 매우 높음
- **붉은 고기**: 소고기, 돼지고기 제한
- **일부 해산물**: 멸치, 정어리, 새우

균형 잡힌 식단과 함께 꾸준한 관리가 중요합니다.

---
*면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다.*`
      : `Here are foods that can help with gout management:

**✅ Recommended Foods:**
- **Cherries**: Anti-inflammatory properties
- **Low-fat dairy**: May help reduce uric acid
- **Water**: 2-3 liters daily for proper hydration
- **Coffee**: May lower uric acid levels
- **Vitamin C rich fruits**: Oranges, strawberries

**❌ Foods to Avoid:**
- **Beer and spirits**: Rapidly increase uric acid
- **Organ meats**: Very high in purines
- **Red meat**: Limit beef and pork
- **Certain seafood**: Anchovies, sardines, shellfish

Consistency and balance in your diet are key.

---
*Disclaimer: I am an AI assistant, not a medical professional. It's safest to consult a doctor or pharmacist for any medical advice.*`;
  }
  else {
    response = isKorean
      ? `죄송합니다. 현재 LM Studio 연결에 문제가 있어 Mock 응답을 제공하고 있습니다.

실제 서비스에서는 더 자세하고 개인화된 통풍 관리 조언을 제공할 예정입니다.

궁금한 점이 있으시면 다음과 같이 질문해보세요:
- "통풍에 좋은 음식은?"
- "콜히친은 언제 복용하나요?"
- "발가락이 아픈데 통풍인가요?"

---
*면책조항: 저는 AI 어시스턴트로, 의료 전문가가 아닙니다. 의료 조언이 필요하시면 의사나 약사와 상담하시는 것이 가장 안전합니다.*`
      : `I'm currently providing mock responses due to LM Studio connection issues.

In the actual service, I would provide more detailed and personalized gout management advice.

Try asking:
- "What foods are good for gout?"
- "When should I take colchicine?"
- "Is my toe pain related to gout?"

---
*Disclaimer: I am an AI assistant, not a medical professional. It's safest to consult a doctor or pharmacist for any medical advice.*`;
  }

  // 스트리밍 시뮬레이션
  async function* streamResponse() {
    // 즉시 응답 (실제로는 1-2초 걸림)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    yield {
      response: {
        text: () => response,
        candidates: [
          {
            content: {
              parts: [{ text: response }]
            },
            finishReason: 'STOP'
          }
        ]
      }
    };
  }

  return streamResponse();
};

// Mock 건강 요약
export const summarizeHealthInfo = async (messages: ChatMessage[]): Promise<string> => {
  const healthLogs = messages.filter(msg => 
    msg.content.includes('[증상 체크인]') || 
    msg.content.includes('[약물 기록]') || 
    msg.content.includes('[식단 기록]')
  );

  if (healthLogs.length === 0) {
    return '아직 건강 기록이 없습니다. 증상, 약물, 식단을 기록해보세요.';
  }

  return `건강 기록 ${healthLogs.length}개가 등록되었습니다. 꾸준한 관리를 통해 통풍을 잘 컨트롤하고 계십니다. (Mock 응답)`;
};

// Mock 통풍 예보
export const generateGoutForecast = async (
  location: string,
  healthProfile: string,
  lang: string = 'ko'
): Promise<any> => {
  
  // 빠른 Mock 예보 생성
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
  const goutIndexes = ['Good', 'Moderate', 'Caution', 'High Risk'];
  
  const forecast = days.map((day, index) => ({
    day,
    weather: weathers[Math.floor(Math.random() * weathers.length)],
    goutIndex: goutIndexes[Math.floor(Math.random() * goutIndexes.length)],
    goutIndexNumeric: Math.floor(Math.random() * 100),
    explanation: lang === 'ko' 
      ? ['날씨가 좋아 관절이 편안할 거예요', '비 예보로 관절 통증 주의', '기압 변화로 조심하세요'][Math.floor(Math.random() * 3)]
      : ['Good weather for joints', 'Rain may trigger pain', 'Pressure changes ahead'][Math.floor(Math.random() * 3)]
  }));

  return {
    locationName: location || (lang === 'ko' ? '서울, 대한민국' : 'Seoul, South Korea'),
    forecast,
    personalizedAlert: lang === 'ko' 
      ? '수분 섭취에 신경쓰시고 건강한 하루 보내세요! (Mock 예보)'
      : 'Stay hydrated and have a healthy day! (Mock forecast)'
  };
};
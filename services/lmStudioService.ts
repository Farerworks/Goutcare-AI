// LM Studio 연동 서비스 - 기존 geminiService.ts 인터페이스 유지
import type { ChatMessage } from '../types';

// LM Studio Provider 임포트
import { LMStudioProvider } from './ai/providers/LMStudioProvider';

// 글로벌 LM Studio 인스턴스 (CORS 프록시 사용)
const lmStudioProvider = new LMStudioProvider(
  'http://localhost:3001/api/v1',
  'google/gemma-3n-e4b'
);

// 기존 generateChatResponseStream 함수 대체
export const generateChatResponseStream = async (
  history: any[], 
  lang: string = 'en'
): Promise<AsyncGenerator<any>> => {
  try {
    // Content를 ChatHistory로 변환
    const chatHistory = history.map(content => ({
      role: content.role === 'model' ? 'assistant' as const : 'user' as const,
      content: Array.isArray(content.parts) 
        ? content.parts.map(part => part.text).join(' ')
        : content.parts?.text || content.content || ''
    }));

    // 마지막 메시지 추출
    const lastMessage = chatHistory[chatHistory.length - 1];
    const conversationHistory = chatHistory.slice(0, -1);

    console.log(`[LM Studio] Processing message: ${lastMessage.content.substring(0, 50)}...`);

    // LM Studio로 요청
    const response = await lmStudioProvider.generateResponse(
      lastMessage.content,
      conversationHistory,
      {
        temperature: 0.4, // 의료 정보는 보수적으로
        maxTokens: 200 // 빠른 응답을 위해 단축
      }
    );

    console.log(`[LM Studio] Response received`);

    // 기존 스트리밍 인터페이스 유지를 위한 제너레이터
    async function* streamResponse() {
      yield {
        response: {
          text: () => response.content,
          candidates: [
            {
              content: {
                parts: [{ text: response.content }]
              },
              finishReason: 'STOP'
            }
          ]
        }
      };
    }

    return streamResponse();

  } catch (error) {
    console.error('[LM Studio] Error:', error);
    
    // 에러 응답 생성 (Gemini 폴백 제거)
    async function* errorResponse() {
      const errorMessage = lang === 'ko' 
        ? '죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다. LM Studio가 실행 중인지 확인해주세요.'
        : 'Sorry, there was a temporary issue with the AI service. Please check if LM Studio is running.';
        
      yield {
        response: {
          text: () => errorMessage,
          candidates: [
            {
              content: {
                parts: [{ text: errorMessage }]
              },
              finishReason: 'STOP'
            }
          ]
        }
      };
    }

    return errorResponse();
  }
};

// 기존 summarizeHealthInfo 함수도 LM Studio로 처리
export const summarizeHealthInfo = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const healthLogs = messages.filter(msg => 
      msg.content.includes('[증상 체크인]') || 
      msg.content.includes('[약물 기록]') || 
      msg.content.includes('[식단 기록]') ||
      msg.content.includes('[Symptom Checkin]') ||
      msg.content.includes('[Medication Log]') ||
      msg.content.includes('[Diet Log]')
    );

    if (healthLogs.length === 0) {
      return '';
    }

    const prompt = `다음 건강 기록들을 바탕으로 사용자의 통풍 관리 상태를 3-4줄로 요약해주세요:

${healthLogs.map(log => log.content).join('\n\n')}

요약에 포함할 내용:
- 최근 증상 패턴
- 복용 중인 약물
- 식단 관리 상태
- 주의할 점`;

    const response = await lmStudioProvider.generateResponse(
      prompt,
      [],
      { temperature: 0.3, maxTokens: 300 }
    );

    return response.content;

  } catch (error) {
    console.error('[LM Studio] Health summary error:', error);
    
    // 기본 요약 반환
    return `건강 기록 ${healthLogs.length}개가 기록되었습니다. LM Studio 연결을 확인해주세요.`;
  }
};

// 통풍 예보 생성 함수
export const generateGoutForecast = async (
  location: string,
  healthProfile: string,
  lang: string = 'ko'
): Promise<any> => {
  try {
    const prompt = lang === 'ko' 
      ? `${location}의 7일 통풍 예보를 JSON 형식으로 생성해주세요.

사용자 건강 정보: ${healthProfile || '없음'}

다음 JSON 형식으로 응답해주세요:
{
  "locationName": "${location || '일반 지역'}",
  "forecast": [
    {
      "day": "Monday",
      "weather": "Sunny",
      "goutIndex": "Good", 
      "goutIndexNumeric": 20,
      "explanation": "날씨가 좋아 관절이 편안할 거예요"
    }
  ],
  "personalizedAlert": "건강 상태에 맞는 조언"
}

7일간 예보로 만들어주세요. weather는 Sunny/Cloudy/Rainy/Stormy 중 하나, goutIndex는 Good/Moderate/Caution/High Risk 중 하나입니다.`
      : `Generate a 7-day gout forecast for ${location} in JSON format.

User health profile: ${healthProfile || 'None'}

Respond in this JSON format:
{
  "locationName": "${location || 'Generic Region'}",
  "forecast": [
    {
      "day": "Monday",
      "weather": "Sunny",
      "goutIndex": "Good",
      "goutIndexNumeric": 20,
      "explanation": "Good weather should mean happy joints"
    }
  ],
  "personalizedAlert": "Health-specific advice"
}

Create 7 days. weather: Sunny/Cloudy/Rainy/Stormy, goutIndex: Good/Moderate/Caution/High Risk.`;

    const response = await lmStudioProvider.generateResponse(
      prompt,
      [],
      { temperature: 0.6, maxTokens: 500 } // 예보도 단축
    );

    // JSON 파싱 시도
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('[LM Studio] JSON parsing failed, using fallback');
    }

    // 파싱 실패시 기본 예보 반환
    return {
      locationName: location || (lang === 'ko' ? '일반 지역' : 'Generic Region'),
      forecast: [
        {
          day: 'Monday',
          weather: 'Sunny',
          goutIndex: 'Good',
          goutIndexNumeric: 25,
          explanation: lang === 'ko' ? '날씨가 좋아 관절이 편안할 거예요' : 'Good weather for your joints'
        },
        {
          day: 'Tuesday', 
          weather: 'Cloudy',
          goutIndex: 'Good',
          goutIndexNumeric: 30,
          explanation: lang === 'ko' ? '구름 많지만 괜찮을 것 같아요' : 'Cloudy but should be fine'
        },
        {
          day: 'Wednesday',
          weather: 'Rainy',
          goutIndex: 'Caution',
          goutIndexNumeric: 65,
          explanation: lang === 'ko' ? '비 예보로 관절 통증 주의' : 'Rain may trigger joint pain'
        },
        {
          day: 'Thursday',
          weather: 'Cloudy',
          goutIndex: 'Moderate',
          goutIndexNumeric: 45,
          explanation: lang === 'ko' ? '흐린 날씨, 적당한 주의 필요' : 'Cloudy weather, moderate caution'
        },
        {
          day: 'Friday',
          weather: 'Sunny',
          goutIndex: 'Good',
          goutIndexNumeric: 20,
          explanation: lang === 'ko' ? '맑은 날씨로 컨디션 좋을 듯' : 'Sunny weather, good condition'
        },
        {
          day: 'Saturday',
          weather: 'Sunny',
          goutIndex: 'Good', 
          goutIndexNumeric: 25,
          explanation: lang === 'ko' ? '주말 좋은 날씨예요' : 'Great weekend weather'
        },
        {
          day: 'Sunday',
          weather: 'Cloudy',
          goutIndex: 'Good',
          goutIndexNumeric: 35,
          explanation: lang === 'ko' ? '일요일 구름 조금' : 'Partly cloudy Sunday'
        }
      ],
      personalizedAlert: healthProfile 
        ? (lang === 'ko' ? '건강 상태를 고려해 수분 섭취에 신경 쓰세요' : 'Stay hydrated considering your health profile')
        : undefined
    };

  } catch (error) {
    console.error('[LM Studio] Forecast generation error:', error);
    throw error;
  }
};
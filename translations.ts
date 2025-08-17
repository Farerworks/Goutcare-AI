const translations = {
  en: {
    // App.tsx
    goutCareAI: "GoutCare AI",
    appSubtitle: "Your Personal Assistant for Gout Management, Grounded in Medical Guidelines",
    initializing: "Initializing AI Assistant...",
    welcomeMessage: "Hello! I am GoutCare AI. On the left, you can now find your Health Dashboard to track symptoms. How can I help you today?\n\nUse the 'Log Today's Symptoms' button or the clipboard icon to log your symptoms.",
    historyCleared: "Conversation history cleared. How can I help you start fresh?",
    errorPrefix: "Error: ",
    closeError: "×",
    dashboardTitle: "Health Dashboard",

    // ChatWindow.tsx
    chatWindowTitle: "GoutCare AI",
    chatWindowSubtitle: "Your Personal Gout Assistant",
    resetChat: "Reset Chat",
    inputPlaceholder: "Ask about diet, symptoms, or management...",
    symptomCheckinAria: "Symptom Check-in",
    sendMessageAria: "Send message",

    // SymptomCheckinModal.tsx
    symptomCheckinTitle: "Symptom Check-in",
    painLocationLabel: "Pain Location",
    painLocationPlaceholder: "e.g., Right big toe, Left ankle",
    painLevelLabel: "Pain Level: {painLevel}",
    otherSymptomsLabel: "Other Symptoms",
    symptomSwelling: "Swelling",
    symptomRedness: "Redness",
    symptomWarmth: "Warmth/Heat",
    notesLabel: "Additional Notes (optional)",
    notesPlaceholder: "e.g., Started after dinner, getting worse at night.",
    cancel: "Cancel",
    completeCheckin: "Complete Check-in",
    alertPainLocation: "Please specify the pain location.",

    // Tip of the Day
    tipOfTheDayTitle: "Today's Tip",
    tip1: "Stay hydrated! Drinking plenty of water helps your kidneys flush out uric acid.",
    tip2: "Cherries, especially tart cherries, have been shown to lower uric acid levels and reduce gout attacks.",
    tip3: "Limit high-purine foods like red meat and certain seafood to manage your uric acid levels.",
    tip4: "Even light, regular exercise like walking or swimming can help manage weight and reduce stress on your joints.",
    tip5: "Avoid sugary drinks, especially those with high-fructose corn syrup, as they can raise uric acid levels.",

    // Symptom Calendar
    symptomCalendarTitle: "Symptom Calendar",
    logTodaysSymptoms: "Log Today's Symptoms",
    painLevelLegend: "Pain Level",
    month1: "January", month2: "February", month3: "March", month4: "April", month5: "May", month6: "June",
    month7: "July", month8: "August", month9: "September", month10: "October", month11: "November", month12: "December",
    daySun: "S", dayMon: "M", dayTue: "T", dayWed: "W", dayThu: "T", dayFri: "F", daySat: "S",
  },
  ko: {
    // App.tsx
    goutCareAI: "통풍 관리 AI",
    appSubtitle: "의학 지침에 근거한 개인 통풍 관리 어시스턴트",
    initializing: "AI 어시스턴트 초기화 중...",
    welcomeMessage: "안녕하세요! 저는 통풍 관리 AI입니다. 이제 왼쪽에서 건강 대시보드를 통해 증상을 추적할 수 있습니다. 무엇을 도와드릴까요?\n\n'오늘 증상 기록' 버튼이나 클립보드 아이콘을 사용해 증상을 기록해 보세요.",
    historyCleared: "대화 기록이 삭제되었습니다. 어떻게 새로 시작할까요?",
    errorPrefix: "오류: ",
    closeError: "×",
    dashboardTitle: "건강 대시보드",

    // ChatWindow.tsx
    chatWindowTitle: "통풍 관리 AI",
    chatWindowSubtitle: "개인 통풍 어시스턴트",
    resetChat: "대화 초기화",
    inputPlaceholder: "식단, 증상, 관리에 대해 질문하세요...",
    symptomCheckinAria: "증상 기록",
    sendMessageAria: "메시지 보내기",
    
    // SymptomCheckinModal.tsx
    symptomCheckinTitle: "증상 기록",
    painLocationLabel: "통증 부위",
    painLocationPlaceholder: "예: 오른쪽 엄지발가락, 왼쪽 발목",
    painLevelLabel: "통증 수준: {painLevel}",
    otherSymptomsLabel: "기타 증상",
    symptomSwelling: "부기",
    symptomRedness: "붉어짐",
    symptomWarmth: "열감",
    notesLabel: "추가 메모 (선택 사항)",
    notesPlaceholder: "예: 저녁 식사 후 시작됨, 밤에 악화됨.",
    cancel: "취소",
    completeCheckin: "기록 완료",
    alertPainLocation: "통증 부위를 입력해주세요.",

    // Tip of the Day
    tipOfTheDayTitle: "오늘의 팁",
    tip1: "수분을 충분히 섭취하세요! 물을 많이 마시면 신장이 요산을 배출하는 데 도움이 됩니다.",
    tip2: "체리, 특히 타트 체리는 요산 수치를 낮추고 통풍 발작을 줄이는 것으로 나타났습니다.",
    tip3: "붉은 고기나 특정 해산물과 같은 고퓨린 식품을 제한하여 요산 수치를 관리하세요.",
    tip4: "걷기나 수영과 같은 가볍고 규칙적인 운동도 체중을 관리하고 관절의 스트레스를 줄이는 데 도움이 될 수 있습니다.",
    tip5: "고과당 옥수수 시럽이 함유된 단 음료는 요산 수치를 높일 수 있으니 피하세요.",

    // Symptom Calendar
    symptomCalendarTitle: "증상 캘린더",
    logTodaysSymptoms: "오늘 증상 기록",
    painLevelLegend: "통증 수준",
    month1: "1월", month2: "2월", month3: "3월", month4: "4월", month5: "5월", month6: "6월",
    month7: "7월", month8: "8월", month9: "9월", month10: "10월", month11: "11월", month12: "12월",
    daySun: "일", dayMon: "월", dayTue: "화", dayWed: "수", dayThu: "목", dayFri: "금", daySat: "토",
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'] | keyof typeof translations['ko'];

const getTranslator = (lang: Language) => {
  const selectedLang = translations[lang] ? lang : 'en';
  const languageMap = translations[selectedLang];

  return (key: TranslationKey, substitutions?: Record<string, string | number>): string => {
    let translation = (languageMap as any)[key] || (translations.en as any)[key];
    if (substitutions) {
        Object.entries(substitutions).forEach(([k, v]) => {
            translation = translation.replace(`{${k}}`, String(v));
        });
    }
    return translation;
  };
};

export default getTranslator;

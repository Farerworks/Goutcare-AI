const translations = {
  en: {
    // App.tsx
    appSubtitle: "Your Personal Assistant for Gout Management, Grounded in Medical Guidelines",
    initializing: "Initializing AI Assistant...",
    welcomeMessage: "Hello! I am GoutCare AI. On the left, you can now find your Health Dashboard to track symptoms, medication, and diet. How can I help you today?",
    historyCleared: "Conversation history cleared. How can I help you start fresh?",
    errorPrefix: "Error: ",
    closeError: "×",
    dashboardTitle: "Health Dashboard",
    // Dashboard Tabs
    dashboardTabSymptoms: "Symptoms",
    dashboardTabMedication: "Medication",
    dashboardTabDiet: "Diet",

    // ChatWindow.tsx
    chatWindowTitle: "GoutCare AI",
    chatWindowSubtitle: "Your Personal Gout Assistant",
    resetChat: "Reset Chat",
    resetChatAria: "Reset Conversation History",
    inputPlaceholder: "Ask about diet, symptoms, or management...",
    symptomCheckinAria: "Symptom Check-in",
    sendMessageAria: "Send message",
    myHealthSummary: "My Health Summary",
    myHealthSummaryAria: "View a summary of your key health info",

    // SymptomCheckinModal.tsx
    symptomCheckinTitle: "Symptom Log",
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
    completeCheckin: "Complete Log",
    alertPainLocation: "Please specify the pain location.",

    // MedicationLogModal.tsx
    medicationLogTitle: "Medication Log",
    medicationNameLabel: "Medication Name",
    medicationNamePlaceholder: "e.g., Allopurinol 100mg, Colchicine",
    timeOfDayLabel: "Time of Day",
    timeOfDayMorning: "Morning",
    timeOfDayLunch: "Lunch",
    timeOfDayDinner: "Dinner",
    timeOfDayBedtime: "Bedtime",
    intakeTimeLabel: "Intake Time (optional)",
    alertMedicationName: "Please enter the medication name.",
    addPhoto: "Add Photo",

    // DietLogModal.tsx
    dietLogTitle: "Diet Log",
    foodDescriptionLabel: "Food/Meal Description",
    foodDescriptionPlaceholder: "e.g., Grilled salmon, steamed vegetables, and rice",
    timeOfDayBreakfast: "Breakfast",
    timeOfDayAfterDinner: "After Dinner",
    alertFoodDescription: "Please describe the food or meal.",

    // HealthSummaryModal.tsx
    healthSummaryTitle: "My Health Summary",
    healthSummaryDescription: "This is a summary of the key health information you've shared, which helps me provide more personalized advice. This information is stored only on your device.",
    close: "Close",
    loadingSummary: "Generating your summary...",
    noSummaryFound: "No specific health information has been shared yet. As you share details about medications, conditions, or uric acid levels, they will be summarized here.",

    // Settings Modal
    settingsTitle: "Settings",
    settingsAria: "Open Settings",
    importHistory: "Import",
    importHistoryDescription: "Import a conversation from a .json file. This will overwrite the current conversation.",
    exportHistory: "Export",
    exportHistoryDescription: "Export the current conversation to a .json file for backup.",
    resetConversation: "Reset Conversation",
    resetConversationDescription: "Permanently delete the conversation history and start fresh.",
    resetConfirmation: "Are you sure you want to permanently delete your conversation history? This cannot be undone.",
    importConfirmation: "This will replace your current conversation with the contents of the file. Are you sure you want to continue?",
    importError: "Failed to import file. It may be corrupted or in the wrong format.",
    importSuccess: "Conversation imported successfully.",

    // Tip of the Day
    tipOfTheDayTitle: "Today's Tip",
    tip1: "Stay hydrated! Drinking plenty of water helps your kidneys flush out uric acid.",
    tip2: "Cherries, especially tart cherries, have been shown to lower uric acid levels and reduce gout attacks.",
    tip3: "Limit high-purine foods like red meat and certain seafood to manage your uric acid levels.",
    tip4: "Even light, regular exercise like walking or swimming can help manage weight and reduce stress on your joints.",
    tip5: "Avoid sugary drinks, especially those with high-fructose corn syrup, as they can raise uric acid levels.",

    // Symptom Calendar
    symptomCalendarTitle: "Log Calendar",
    logTodaysSymptoms: "Log Today's Symptoms",
    logMedication: "Log Medication",
    logDiet: "Log Diet",
    painLevelLegend: "Pain Level",
    month1: "January", month2: "February", month3: "March", month4: "April", month5: "May", month6: "June",
    month7: "July", month8: "August", month9: "September", month10: "October", month11: "November", month12: "December",
    daySun: "S", dayMon: "M", dayTue: "T", dayWed: "W", dayThu: "T", dayFri: "F", daySat: "S",

    // Gout Forecast
    goutForecastTitle: "Weekly Gout Forecast",
    goutIndex: "Gout Index",
    goutIndexGood: "Good",
    goutIndexModerate: "Moderate",
    goutIndexCaution: "Caution",
    goutIndexHighRisk: "High Risk",
    loadingForecast: "Loading forecast...",
    forecastDay0: "Sun", forecastDay1: "Mon", forecastDay2: "Tue", forecastDay3: "Wed", forecastDay4: "Thu", forecastDay5: "Fri", forecastDay6: "Sat",
    today: "Today",
    tomorrow: "Tomorrow",
    goutRiskIndex: "Gout Risk Index",
    forecastReason: "Forecast Basis",
    locationErrorInstructions: "Location access denied. To see a local forecast, please enable location permissions for this site in your browser settings.",
    locationErrorNotSupported: "Geolocation is not supported by this browser. Showing a generic forecast.",
    locationErrorPolicy: "Cannot fetch location in this preview environment due to security policies. Showing a generic forecast instead.",
    locationErrorGeneral: "Could not determine your location. Showing a generic forecast.",
    forecastSourceUser: "Based on your current location",
    forecastSourceGeneric: "Based on a temperate region",
    personalizedAlertTitle: "Personalized Alert",
    forecastErrorRateLimit: "The forecast service is temporarily unavailable due to high demand. Please try again in a few minutes.",
    forecastErrorGeneral: "Could not load forecast at this time.",
  },
  ko: {
    // App.tsx
    appSubtitle: "의학 지침에 근거한 개인 통풍 관리 어시스턴트",
    initializing: "AI 어시스턴트 초기화 중...",
    welcomeMessage: "안녕하세요! 저는 통풍 관리 AI입니다. 이제 왼쪽에서 건강 대시보드를 통해 증상, 복용, 식단을 추적할 수 있습니다. 무엇을 도와드릴까요?",
    historyCleared: "대화 기록이 삭제되었습니다. 어떻게 새로 시작할까요?",
    errorPrefix: "오류: ",
    closeError: "×",
    dashboardTitle: "건강 대시보드",
    // Dashboard Tabs
    dashboardTabSymptoms: "증상",
    dashboardTabMedication: "복용",
    dashboardTabDiet: "식단",

    // ChatWindow.tsx
    chatWindowTitle: "GoutCare AI",
    chatWindowSubtitle: "개인 통풍 어시스턴트",
    resetChat: "대화 초기화",
    resetChatAria: "대화 기록 초기화",
    inputPlaceholder: "식단, 증상, 관리에 대해 질문하세요...",
    symptomCheckinAria: "증상 기록",
    sendMessageAria: "메시지 보내기",
    myHealthSummary: "내 건강 요약",
    myHealthSummaryAria: "내 주요 건강 정보 요약 보기",
    
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

    // MedicationLogModal.tsx
    medicationLogTitle: "복용 기록",
    medicationNameLabel: "약 이름",
    medicationNamePlaceholder: "예: 알로푸리놀 100mg, 콜히친",
    timeOfDayLabel: "시간대",
    timeOfDayMorning: "아침",
    timeOfDayLunch: "점심",
    timeOfDayDinner: "저녁",
    timeOfDayBedtime: "취침 전",
    intakeTimeLabel: "복용 시간 (선택 사항)",
    alertMedicationName: "약 이름을 입력해주세요.",
    addPhoto: "사진 추가",

    // DietLogModal.tsx
    dietLogTitle: "식단 기록",
    foodDescriptionLabel: "음식/식사 설명",
    foodDescriptionPlaceholder: "예: 구운 연어, 찐 채소, 밥",
    timeOfDayBreakfast: "아침",
    timeOfDayAfterDinner: "저녁 이후",
    alertFoodDescription: "음식 또는 식사 내용을 입력해주세요.",

    // HealthSummaryModal.tsx
    healthSummaryTitle: "내 건강 정보 요약",
    healthSummaryDescription: "사용자님께서 공유해주신 주요 건강 정보를 요약한 내용입니다. 이 정보는 더 개인화된 조언을 제공하는 데 도움이 되며, 사용자님의 기기에만 저장됩니다.",
    close: "닫기",
    loadingSummary: "요약 정보를 생성하는 중입니다...",
    noSummaryFound: "아직 공유된 특정 건강 정보가 없습니다. 복용 중인 약, 건강 상태, 요산 수치 등에 대한 정보를 공유하시면 여기에 요약됩니다.",

    // Settings Modal
    settingsTitle: "설정",
    settingsAria: "설정 열기",
    importHistory: "가져오기",
    importHistoryDescription: ".json 파일로 내보낸 대화 내용을 가져옵니다. 현재 대화 내용은 덮어쓰여집니다.",
    exportHistory: "내보내기",
    exportHistoryDescription: "현재 대화 내용을 백업용 .json 파일로 내보냅니다.",
    resetConversation: "대화 초기화",
    resetConversationDescription: "현재 대화 내용을 영구적으로 삭제하고 새로 시작합니다.",
    resetConfirmation: "정말로 대화 내용을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    importConfirmation: "파일의 내용으로 현재 대화 내용이 대체됩니다. 계속하시겠습니까?",
    importError: "파일을 가져오는 데 실패했습니다. 파일이 손상되었거나 형식이 잘못되었을 수 있습니다.",
    importSuccess: "대화 내용을 성공적으로 가져왔습니다.",

    // Tip of the Day
    tipOfTheDayTitle: "오늘의 팁",
    tip1: "수분을 충분히 섭취하세요! 물을 많이 마시면 신장이 요산을 배출하는 데 도움이 됩니다.",
    tip2: "체리, 특히 타트 체리는 요산 수치를 낮추고 통풍 발작을 줄이는 것으로 나타났습니다.",
    tip3: "붉은 고기나 특정 해산물과 같은 고퓨린 식품을 제한하여 요산 수치를 관리하세요.",
    tip4: "걷기나 수영과 같은 가볍고 규칙적인 운동도 체중을 관리하고 관절의 스트레스를 줄이는 데 도움이 될 수 있습니다.",
    tip5: "고과당 옥수수 시럽이 함유된 단 음료는 요산 수치를 높일 수 있으니 피하세요.",

    // Symptom Calendar
    symptomCalendarTitle: "기록 캘린더",
    logTodaysSymptoms: "오늘 증상 기록",
    logMedication: "복용 기록",
    logDiet: "식단 기록",
    painLevelLegend: "통증 수준",
    month1: "1월", month2: "2월", month3: "3월", month4: "4월", month5: "5월", month6: "6월",
    month7: "7월", month8: "8월", month9: "9월", month10: "10월", month11: "11월", month12: "12월",
    daySun: "일", dayMon: "월", dayTue: "화", dayWed: "수", dayThu: "목", dayFri: "금", daySat: "토",

    // Gout Forecast
    goutForecastTitle: "주간 통풍 예보",
    goutIndex: "통풍 지수",
    goutIndexGood: "좋음",
    goutIndexModerate: "보통",
    goutIndexCaution: "주의",
    goutIndexHighRisk: "위험",
    loadingForecast: "예보를 불러오는 중...",
    forecastDay0: "일", forecastDay1: "월", forecastDay2: "화", forecastDay3: "수", forecastDay4: "목", forecastDay5: "금", forecastDay6: "토",
    today: "오늘",
    tomorrow: "내일",
    goutRiskIndex: "통풍 위험 지수",
    forecastReason: "예보 근거",
    locationErrorInstructions: "위치 정보 접근이 거부되었습니다. 지역 예보를 보려면 브라우저 설정에서 이 사이트의 위치 권한을 허용해 주세요.",
    locationErrorNotSupported: "이 브라우저에서는 위치 정보를 지원하지 않습니다. 일반적인 지역 예보를 표시합니다.",
    locationErrorPolicy: "미리보기 환경에서는 보안 정책으로 인해 실제 위치를 가져올 수 없습니다. 대신 일반 예보를 표시합니다.",
    locationErrorGeneral: "위치를 확인할 수 없습니다. 일반적인 지역 예보를 표시합니다.",
    forecastSourceUser: "현재 위치 기반",
    forecastSourceGeneric: "온대 지역 기반",
    personalizedAlertTitle: "개인화된 알림",
    forecastErrorRateLimit: "현재 요청이 많아 예보 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    forecastErrorGeneral: "지금은 예보를 불러올 수 없습니다.",
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
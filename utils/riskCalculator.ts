import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseSymptomMessages, parseMedicationMessages, parseDietMessages } from './parsers';

export interface RiskScore {
  today: number;
  tomorrow: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: RiskFactor[];
}

export interface RiskFactor {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  impact: 'positive' | 'negative';
}

export interface WeeklyPrediction {
  days: {
    date: Date;
    risk: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
  }[];
  trend: 'improving' | 'stable' | 'worsening';
  averageRisk: number;
}

export interface DailyTip {
  category: 'urgent' | 'important' | 'suggestion';
  icon: string;
  title: string;
  message: string;
  action?: string;
}

// 위험도 계산 (0-100, 높을수록 위험)
export function calculateGoutRisk(messages: ChatMessage[]): RiskScore {
  const now = new Date();
  const today = now.toDateString();
  
  // 데이터 수집
  const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
  const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
  const symptoms = parseSymptomMessages(messages);
  const medications = parseMedicationMessages(messages);
  const diet = parseDietMessages(messages);

  const factors: RiskFactor[] = [];
  let totalRisk = 0;

  // 1. 최근 증상 빈도 (0-30점)
  const recentSymptoms = symptoms.filter(s => {
    const daysDiff = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  });
  
  const symptomRisk = Math.min(recentSymptoms.length * 10, 30);
  factors.push({
    category: '최근 증상',
    score: symptomRisk,
    maxScore: 30,
    description: `지난 7일간 ${recentSymptoms.length}회 증상`,
    impact: 'negative'
  });
  totalRisk += symptomRisk;

  // 2. 요산 수치 상태 (0-25점)
  const latestUricAcid = uricAcidEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  let uricAcidRisk = 0;
  if (latestUricAcid) {
    if (latestUricAcid.level > 9) uricAcidRisk = 25;
    else if (latestUricAcid.level > 8) uricAcidRisk = 20;
    else if (latestUricAcid.level > 7) uricAcidRisk = 15;
    else if (latestUricAcid.level > 6) uricAcidRisk = 10;
    else uricAcidRisk = 0;
  } else {
    uricAcidRisk = 15; // 미측정시 중간 위험도
  }
  
  factors.push({
    category: '요산 수치',
    score: uricAcidRisk,
    maxScore: 25,
    description: latestUricAcid ? `${latestUricAcid.level.toFixed(1)} mg/dL` : '미측정',
    impact: 'negative'
  });
  totalRisk += uricAcidRisk;

  // 3. 수분 섭취 부족 (0-20점)
  const todayWater = waterEntries
    .filter(entry => new Date(entry.date).toDateString() === today)
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  let hydrationRisk = 0;
  if (todayWater < 1000) hydrationRisk = 20;
  else if (todayWater < 1500) hydrationRisk = 15;
  else if (todayWater < 2000) hydrationRisk = 10;
  else hydrationRisk = 0;
  
  factors.push({
    category: '수분 섭취',
    score: hydrationRisk,
    maxScore: 20,
    description: `오늘 ${todayWater}ml`,
    impact: 'negative'
  });
  totalRisk += hydrationRisk;

  // 4. 약물 복용 규칙성 (0-15점)
  const recentMeds = medications.filter(m => {
    const daysDiff = (Date.now() - new Date(m.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 3;
  });
  
  let medicationRisk = 0;
  if (recentMeds.length === 0) medicationRisk = 15;
  else if (recentMeds.length < 3) medicationRisk = 10;
  else medicationRisk = 0;
  
  factors.push({
    category: '약물 복용',
    score: medicationRisk,
    maxScore: 15,
    description: `최근 3일간 ${recentMeds.length}회`,
    impact: 'negative'
  });
  totalRisk += medicationRisk;

  // 5. 고위험 식단 (0-10점)
  const recentDiet = diet.filter(d => {
    const daysDiff = (Date.now() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 2;
  });
  
  // 간단한 고위험 음식 키워드 체크
  const highRiskFoods = ['맥주', '소주', '술', '내장', '곱창', '간', '콩팥', '멸치', '정어리'];
  const riskFoodCount = recentDiet.filter(d => 
    highRiskFoods.some(food => d.foodDescription.includes(food))
  ).length;
  
  const dietRisk = Math.min(riskFoodCount * 5, 10);
  factors.push({
    category: '식단 위험',
    score: dietRisk,
    maxScore: 10,
    description: `최근 2일간 위험 음식 ${riskFoodCount}개`,
    impact: 'negative'
  });
  totalRisk += dietRisk;

  // 내일 위험도는 오늘보다 약간 낮게 (개선 가능성 반영)
  const tomorrowRisk = Math.max(0, totalRisk - 5);

  // 위험도 레벨 결정
  const getRiskLevel = (score: number): RiskScore['level'] => {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'moderate';
    return 'low';
  };

  return {
    today: totalRisk,
    tomorrow: tomorrowRisk,
    level: getRiskLevel(totalRisk),
    factors
  };
}

// 주간 예측 - 실제 데이터 기반
export function generateWeeklyPrediction(messages: ChatMessage[]): WeeklyPrediction {
  const currentRisk = calculateGoutRisk(messages);
  const baseRisk = currentRisk.today;
  
  // 과거 데이터 분석
  const symptoms = parseSymptomMessages(messages);
  const medications = parseMedicationMessages(messages);
  const diet = parseDietMessages(messages);
  const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
  
  // 최근 7일간 패턴 분석
  const recentSymptomCount = symptoms.filter(s => {
    const daysDiff = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;
  
  // 약물 복용 규칙성 체크
  const medicationAdherence = medications.filter(m => {
    const daysDiff = (Date.now() - new Date(m.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length / 7; // 0-1 사이 값
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    let dayRisk = baseRisk;
    
    // 요인별 예측 조정
    // 1. 약물 복용 지속시 개선 효과 (누적)
    if (medicationAdherence > 0.5) {
      dayRisk -= i * 3; // 약 복용 지속시 점진적 개선
    }
    
    // 2. 최근 증상 빈도에 따른 조정
    if (recentSymptomCount > 3) {
      dayRisk += 5; // 증상이 자주 발생했다면 위험도 증가
    } else if (recentSymptomCount === 0) {
      dayRisk -= i * 2; // 증상이 없었다면 점진적 개선
    }
    
    // 3. 주말 효과 (실제로 식단/음주 위험 증가)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // 금, 토
      dayRisk += 8; // 주말 음주/외식 위험
    } else if (dayOfWeek === 0) { // 일
      dayRisk += 5; // 일요일 회복기
    }
    
    // 4. 계절/날씨 요인 (임시 - 실제로는 날씨 API 연동 필요)
    const month = date.getMonth();
    if (month >= 11 || month <= 1) { // 겨울
      dayRisk += 3; // 겨울철 수분 섭취 감소
    }
    
    // 범위 제한
    dayRisk = Math.max(0, Math.min(100, dayRisk));
    
    days.push({
      date,
      risk: Math.round(dayRisk),
      level: dayRisk >= 70 ? 'critical' : dayRisk >= 50 ? 'high' : dayRisk >= 30 ? 'moderate' : 'low'
    });
  }
  
  const averageRisk = days.reduce((sum, day) => sum + day.risk, 0) / days.length;
  
  // 트렌드 판단 (첫 3일 vs 마지막 3일 비교)
  const firstHalf = (days[0].risk + days[1].risk + days[2].risk) / 3;
  const secondHalf = (days[4].risk + days[5].risk + days[6].risk) / 3;
  
  const trend = firstHalf > secondHalf ? 'improving' : 
                firstHalf < secondHalf ? 'worsening' : 'stable';
  
  return { days, trend, averageRisk };
}

// 오늘의 팁 생성
export function generateDailyTip(riskScore: RiskScore): DailyTip {
  const highestRiskFactor = riskScore.factors
    .filter(f => f.impact === 'negative')
    .sort((a, b) => b.score - a.score)[0];
  
  if (!highestRiskFactor) {
    return {
      category: 'suggestion',
      icon: '✨',
      title: '훌륭합니다!',
      message: '현재 상태가 매우 좋습니다. 꾸준한 관리를 계속하세요.',
      action: '오늘도 충분한 수분 섭취를 잊지 마세요'
    };
  }
  
  // 가장 위험한 요소에 따른 맞춤 팁
  switch (highestRiskFactor.category) {
    case '최근 증상':
      return {
        category: riskScore.level === 'critical' ? 'urgent' : 'important',
        icon: '🚨',
        title: '증상 관리가 필요해요',
        message: '최근 증상이 자주 발생하고 있습니다.',
        action: '의사와 상담하고 약물 조정을 고려하세요'
      };
      
    case '요산 수치':
      return {
        category: 'important',
        icon: '🩺',
        title: '요산 수치 관리',
        message: '요산 수치가 목표치보다 높습니다.',
        action: '저퓨린 식단과 충분한 수분 섭취가 중요합니다'
      };
      
    case '수분 섭취':
      return {
        category: 'important',
        icon: '💧',
        title: '수분 보충이 필요해요',
        message: '오늘 수분 섭취가 부족합니다.',
        action: '지금 당장 물 한 잔을 마시고 하루 2L를 목표로 하세요'
      };
      
    case '약물 복용':
      return {
        category: 'urgent',
        icon: '💊',
        title: '약물 복용 확인',
        message: '최근 약물 복용이 불규칙합니다.',
        action: '처방받은 약물을 규칙적으로 복용하세요'
      };
      
    default:
      return {
        category: 'suggestion',
        icon: '🌟',
        title: '오늘의 건강 팁',
        message: '균형 잡힌 식단과 적절한 운동이 통풍 예방의 핵심입니다.',
        action: '가벼운 산책을 해보세요'
      };
  }
}
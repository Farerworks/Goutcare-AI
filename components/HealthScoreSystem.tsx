import React, { useMemo, useState } from 'react';
import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseDietMessages, parseMedicationMessages, parseSymptomMessages } from '../utils/parsers';
import type { TranslationKey } from '../translations';

interface HealthScoreSystemProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

interface HealthMetrics {
  uricAcidScore: number;
  waterIntakeScore: number;
  purineIntakeScore: number;
  medicationConsistencyScore: number;
  symptomFrequencyScore: number;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

const PURINE_DATABASE: Record<string, number> = {
  // Same as DailyPurineTracker
  '간': 400, 'liver': 400, '신장': 400, 'kidney': 400,
  '멸치': 410, 'anchovy': 410, 'anchovies': 410,
  '정어리': 345, 'sardine': 345, 'sardines': 345,
  '청어': 378, 'herring': 378,
  '소고기': 180, 'beef': 180, '돼지고기': 160, 'pork': 160,
  '양고기': 180, 'lamb': 180, '홍합': 195, 'mussel': 195, 'mussels': 195,
  '가리비': 155, 'scallop': 155, 'scallops': 155,
  '참치': 200, 'tuna': 200, '고등어': 170, 'mackerel': 170,
  '닭고기': 140, 'chicken': 140, '오리': 130, 'duck': 130,
  '연어': 140, 'salmon': 140, '대구': 110, 'cod': 110,
  '새우': 145, 'shrimp': 145, 'prawns': 145,
  '콩': 120, 'beans': 120, '렌틸콩': 127, 'lentils': 127,
  '시금치': 57, 'spinach': 57, '아스파라거스': 55, 'asparagus': 55,
  '버섯': 90, 'mushroom': 90, 'mushrooms': 90,
  '우유': 0, 'milk': 0, '요거트': 0, 'yogurt': 0, '치즈': 5, 'cheese': 5,
  '계란': 5, 'egg': 5, 'eggs': 5,
  '쌀': 18, 'rice': 18, '파스타': 15, 'pasta': 15,
  '브로콜리': 25, 'broccoli': 25, '당근': 8, 'carrot': 8, 'carrots': 8,
  '감자': 16, 'potato': 16, 'potatoes': 16,
  '사과': 0, 'apple': 0, '바나나': 7, 'banana': 7,
  '토마토': 11, 'tomato': 11, 'tomatoes': 11
};

const HealthScoreSystem: React.FC<HealthScoreSystemProps> = ({ messages, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  const healthMetrics = useMemo((): HealthMetrics => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });
    
    let totalScore = 100;
    const recommendations: string[] = [];
    
    // 1. Uric Acid Level Score (30 points)
    let uricAcidScore = 30;
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const recentUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (recentUricAcid) {
      if (recentUricAcid.level <= 6.0) {
        uricAcidScore = 30; // Perfect
      } else if (recentUricAcid.level <= 7.0) {
        uricAcidScore = 20; // Good
        recommendations.push('요산 수치가 약간 높습니다. 저퓨린 식단을 유지하세요.');
      } else if (recentUricAcid.level <= 8.0) {
        uricAcidScore = 10; // Fair
        recommendations.push('요산 수치 관리가 필요합니다. 의사와 상담을 고려하세요.');
      } else {
        uricAcidScore = 0; // Poor
        recommendations.push('요산 수치가 매우 높습니다. 즉시 의료진과 상담하세요.');
      }
    } else {
      uricAcidScore = 15; // No data penalty
      recommendations.push('요산 수치를 측정하고 기록해보세요.');
    }
    
    // 2. Water Intake Score (20 points)
    let waterIntakeScore = 20;
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const weeklyWaterAverage = last7Days.reduce((acc, day) => {
      const dayEntries = waterEntries.filter(entry => 
        new Date(entry.date).toDateString() === day
      );
      return acc + dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    }, 0) / 7;
    
    if (weeklyWaterAverage >= 2000) {
      waterIntakeScore = 20;
    } else if (weeklyWaterAverage >= 1500) {
      waterIntakeScore = 15;
      recommendations.push('수분 섭취량을 늘려보세요. 하루 2L를 목표로 하세요.');
    } else if (weeklyWaterAverage >= 1000) {
      waterIntakeScore = 10;
      recommendations.push('수분 섭취가 부족합니다. 물을 더 마시세요.');
    } else {
      waterIntakeScore = 5;
      recommendations.push('수분 섭취가 매우 부족합니다. 탈수는 통풍 발작을 유발할 수 있습니다.');
    }
    
    // 3. Purine Intake Score (25 points)
    let purineIntakeScore = 25;
    const dietEntries = parseDietMessages(messages);
    const weeklyPurineAverage = last7Days.reduce((acc, day) => {
      const dayEntries = dietEntries.filter(entry => 
        new Date(entry.date).toDateString() === day
      );
      let dayPurine = 0;
      dayEntries.forEach(entry => {
        const foods = entry.foodDescription.toLowerCase();
        Object.entries(PURINE_DATABASE).forEach(([food, purineContent]) => {
          if (foods.includes(food.toLowerCase())) {
            dayPurine += purineContent;
          }
        });
      });
      return acc + dayPurine;
    }, 0) / 7;
    
    if (weeklyPurineAverage <= 300) {
      purineIntakeScore = 25;
    } else if (weeklyPurineAverage <= 400) {
      purineIntakeScore = 20;
      recommendations.push('퓨린 섭취량이 적정 수준입니다. 현재 식단을 유지하세요.');
    } else if (weeklyPurineAverage <= 500) {
      purineIntakeScore = 10;
      recommendations.push('퓨린 섭취량이 많습니다. 고퓨린 음식을 줄이세요.');
    } else {
      purineIntakeScore = 5;
      recommendations.push('퓨린 섭취량이 매우 많습니다. 식단 관리가 시급합니다.');
    }
    
    // 4. Medication Consistency Score (15 points)
    let medicationConsistencyScore = 15;
    const medicationEntries = parseMedicationMessages(messages);
    const recentMedications = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });
    
    if (recentMedications.length >= 5) {
      medicationConsistencyScore = 15; // Good consistency
    } else if (recentMedications.length >= 3) {
      medicationConsistencyScore = 10;
      recommendations.push('약물 복용을 더 꾸준히 기록하세요.');
    } else if (recentMedications.length >= 1) {
      medicationConsistencyScore = 5;
      recommendations.push('약물 복용 기록이 부족합니다. 꾸준한 기록이 중요합니다.');
    } else {
      medicationConsistencyScore = 0;
      recommendations.push('약물 복용 기록을 시작해보세요.');
    }
    
    // 5. Symptom Frequency Score (10 points)
    let symptomFrequencyScore = 10;
    const symptomEntries = parseSymptomMessages(messages);
    const recentSymptoms = symptomEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });
    
    if (recentSymptoms.length === 0) {
      symptomFrequencyScore = 10; // No symptoms is good
    } else if (recentSymptoms.length <= 2) {
      symptomFrequencyScore = 7;
      recommendations.push('최근 증상이 있었네요. 관리에 주의하세요.');
    } else if (recentSymptoms.length <= 4) {
      symptomFrequencyScore = 3;
      recommendations.push('통풍 증상이 자주 발생하고 있습니다. 관리 방법을 점검하세요.');
    } else {
      symptomFrequencyScore = 0;
      recommendations.push('통풍 증상이 빈발하고 있습니다. 의료진과 상담이 필요합니다.');
    }
    
    const overallScore = uricAcidScore + waterIntakeScore + purineIntakeScore + 
                        medicationConsistencyScore + symptomFrequencyScore;
    
    // Calculate Grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';
    
    return {
      uricAcidScore,
      waterIntakeScore,
      purineIntakeScore,
      medicationConsistencyScore,
      symptomFrequencyScore,
      overallScore,
      grade,
      recommendations
    };
  }, [messages]);
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };
  
  const getGradeMessage = (grade: string) => {
    switch (grade) {
      case 'A': return '🏆 우수한 관리';
      case 'B': return '😊 양호한 관리';
      case 'C': return '😐 보통 관리';
      case 'D': return '😟 주의 필요';
      case 'F': return '😰 개선 시급';
      default: return '📊 평가 중';
    }
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            📊 건강 관리 점수
          </h3>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getGradeColor(healthMetrics.grade)}`}>
              {healthMetrics.grade}
            </div>
            <div className="text-xs text-zinc-400">
              {healthMetrics.overallScore}/100
            </div>
          </div>
        </div>
        
        {/* Score Circle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{getGradeMessage(healthMetrics.grade)}</span>
              <span>{healthMetrics.overallScore}점</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  healthMetrics.overallScore >= 90 ? 'bg-green-500' :
                  healthMetrics.overallScore >= 80 ? 'bg-blue-500' :
                  healthMetrics.overallScore >= 70 ? 'bg-yellow-500' :
                  healthMetrics.overallScore >= 60 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthMetrics.overallScore}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="text-xs text-zinc-400 text-center">
          {expanded ? '접기 ▲' : '상세보기 ▼'}
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
          {/* Score Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">📋 점수 상세</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">요산 수치 관리</span>
                <span className="text-zinc-300">{healthMetrics.uricAcidScore}/30</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">수분 섭취</span>
                <span className="text-zinc-300">{healthMetrics.waterIntakeScore}/20</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">퓨린 섭취 관리</span>
                <span className="text-zinc-300">{healthMetrics.purineIntakeScore}/25</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">약물 복용 일관성</span>
                <span className="text-zinc-300">{healthMetrics.medicationConsistencyScore}/15</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">증상 관리</span>
                <span className="text-zinc-300">{healthMetrics.symptomFrequencyScore}/10</span>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          {healthMetrics.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">💡 개선 제안</h4>
              <div className="space-y-1">
                {healthMetrics.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs bg-zinc-900/50 rounded px-2 py-1 text-zinc-400">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {healthMetrics.grade === 'A' && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <p className="text-green-300 text-sm font-semibold">🎉 축하합니다!</p>
              <p className="text-green-200 text-xs mt-1">
                통풍 관리를 매우 잘하고 계십니다. 현재의 건강한 생활습관을 유지하세요!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthScoreSystem;
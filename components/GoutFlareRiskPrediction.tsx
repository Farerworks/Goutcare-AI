import React, { useMemo, useState } from 'react';
import type { ChatMessage, UricAcidEntry, WaterIntakeEntry } from '../types';
import { parseDietMessages, parseMedicationMessages, parseSymptomMessages } from '../utils/parsers';
import type { TranslationKey } from '../translations';

interface GoutFlareRiskPredictionProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

interface RiskFactors {
  uricAcidLevel: number;
  recentSymptoms: number;
  purineIntake: number;
  hydrationLevel: number;
  medicationCompliance: number;
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  riskPercentage: number;
  recommendations: string[];
  daysUntilNextSymptom?: number;
}

const PURINE_DATABASE: Record<string, number> = {
  // Same database as other components
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

const GoutFlareRiskPrediction: React.FC<GoutFlareRiskPredictionProps> = ({ messages, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  const riskFactors = useMemo((): RiskFactors => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });
    
    let riskScore = 0;
    const recommendations: string[] = [];
    
    // 1. Uric Acid Level (30% weight)
    let uricAcidScore = 0;
    const uricAcidEntries: UricAcidEntry[] = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    const recentUricAcid = uricAcidEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (recentUricAcid) {
      if (recentUricAcid.level > 8.0) {
        uricAcidScore = 30; // High risk
        recommendations.push('요산 수치가 매우 높습니다. 즉시 의료진과 상담하세요.');
      } else if (recentUricAcid.level > 7.0) {
        uricAcidScore = 20; // Medium risk
        recommendations.push('요산 수치가 높습니다. 식단과 약물 복용을 점검하세요.');
      } else if (recentUricAcid.level > 6.0) {
        uricAcidScore = 10; // Low-medium risk
        recommendations.push('요산 수치를 더 낮춰보세요. 목표는 6.0mg/dL 이하입니다.');
      } else {
        uricAcidScore = 0; // Low risk
      }
    } else {
      uricAcidScore = 15; // Unknown - medium risk
      recommendations.push('최근 요산 수치를 측정해보세요.');
    }
    
    // 2. Recent Symptoms (25% weight)
    let symptomScore = 0;
    const symptomEntries = parseSymptomMessages(messages);
    const recentSymptoms = symptomEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return entryDate > monthAgo;
    });
    
    if (recentSymptoms.length >= 3) {
      symptomScore = 25; // High risk - frequent symptoms
      recommendations.push('최근 통풍 증상이 빈발하고 있습니다. 관리 전략을 재점검하세요.');
    } else if (recentSymptoms.length >= 2) {
      symptomScore = 15; // Medium risk
      recommendations.push('통풍 증상이 반복되고 있습니다. 예방 관리에 집중하세요.');
    } else if (recentSymptoms.length === 1) {
      symptomScore = 8; // Low-medium risk
    } else {
      symptomScore = 0; // Low risk
    }
    
    // 3. Purine Intake (20% weight)
    let purineScore = 0;
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
            dayPurine += purineContent * 0.5; // Assume 50g serving
          }
        });
      });
      return acc + dayPurine;
    }, 0) / 7;
    
    if (weeklyPurineAverage > 500) {
      purineScore = 20; // High risk
      recommendations.push('퓨린 섭취량이 매우 높습니다. 저퓨린 식단으로 변경하세요.');
    } else if (weeklyPurineAverage > 400) {
      purineScore = 15; // Medium-high risk
      recommendations.push('퓨린 섭취량을 줄이세요. 고퓨린 음식을 피하세요.');
    } else if (weeklyPurineAverage > 300) {
      purineScore = 8; // Medium risk
      recommendations.push('퓨린 섭취량이 적정 수준보다 높습니다.');
    } else {
      purineScore = 0; // Low risk
    }
    
    // 4. Hydration Level (15% weight)
    let hydrationScore = 0;
    const waterEntries: WaterIntakeEntry[] = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const weeklyWaterAverage = last7Days.reduce((acc, day) => {
      const dayEntries = waterEntries.filter(entry => 
        new Date(entry.date).toDateString() === day
      );
      return acc + dayEntries.reduce((sum, entry) => sum + entry.amount, 0);
    }, 0) / 7;
    
    if (weeklyWaterAverage < 1000) {
      hydrationScore = 15; // High risk - dehydration
      recommendations.push('수분 섭취가 부족합니다. 탈수는 통풍 발작을 유발할 수 있습니다.');
    } else if (weeklyWaterAverage < 1500) {
      hydrationScore = 10; // Medium risk
      recommendations.push('수분 섭취량을 늘려보세요.');
    } else if (weeklyWaterAverage < 2000) {
      hydrationScore = 5; // Low-medium risk
    } else {
      hydrationScore = 0; // Low risk
    }
    
    // 5. Medication Compliance (10% weight)
    let medicationScore = 0;
    const medicationEntries = parseMedicationMessages(messages);
    const recentMedications = medicationEntries.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return entryDate > weekAgo;
    });
    
    if (recentMedications.length === 0) {
      medicationScore = 10; // High risk - no medication
      recommendations.push('약물 복용 기록이 없습니다. 처방약을 꾸준히 복용하세요.');
    } else if (recentMedications.length < 3) {
      medicationScore = 5; // Medium risk - irregular
      recommendations.push('약물 복용이 불규칙합니다. 꾸준한 복용이 중요합니다.');
    } else {
      medicationScore = 0; // Low risk - good compliance
    }
    
    // Calculate total risk score
    riskScore = uricAcidScore + symptomScore + purineScore + hydrationScore + medicationScore;
    const riskPercentage = Math.min(riskScore, 100);
    
    // Determine risk level
    let overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    if (riskScore >= 70) overallRisk = 'Critical';
    else if (riskScore >= 50) overallRisk = 'High';
    else if (riskScore >= 30) overallRisk = 'Medium';
    else overallRisk = 'Low';
    
    // Estimate days until next potential symptom (based on recent pattern)
    let daysUntilNextSymptom: number | undefined;
    if (recentSymptoms.length >= 2) {
      const symptomDates = recentSymptoms
        .map(s => new Date(s.date).getTime())
        .sort((a, b) => b - a);
      const averageInterval = (symptomDates[0] - symptomDates[symptomDates.length - 1]) / (symptomDates.length - 1);
      const daysSinceLastSymptom = (Date.now() - symptomDates[0]) / (24 * 60 * 60 * 1000);
      const estimatedInterval = averageInterval / (24 * 60 * 60 * 1000);
      daysUntilNextSymptom = Math.max(0, Math.round(estimatedInterval - daysSinceLastSymptom));
    }
    
    // Add general recommendations
    if (overallRisk === 'Critical') {
      recommendations.unshift('즉시 의료진과 상담이 필요합니다.');
    } else if (overallRisk === 'High') {
      recommendations.unshift('통풍 발작 위험이 높습니다. 예방 조치를 강화하세요.');
    } else if (overallRisk === 'Low') {
      recommendations.push('현재 관리 상태가 양호합니다. 계속 유지하세요.');
    }
    
    return {
      uricAcidLevel: recentUricAcid?.level || 0,
      recentSymptoms: recentSymptoms.length,
      purineIntake: Math.round(weeklyPurineAverage),
      hydrationLevel: Math.round(weeklyWaterAverage),
      medicationCompliance: recentMedications.length,
      overallRisk,
      riskPercentage,
      recommendations,
      daysUntilNextSymptom
    };
  }, [messages]);
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };
  
  const getRiskBgColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'from-red-600 to-red-500';
      case 'High': return 'from-orange-600 to-red-500';
      case 'Medium': return 'from-yellow-600 to-orange-500';
      case 'Low': return 'from-green-600 to-green-500';
      default: return 'from-zinc-600 to-zinc-500';
    }
  };
  
  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Critical': return '🚨';
      case 'High': return '⚠️';
      case 'Medium': return '⚡';
      case 'Low': return '✅';
      default: return '❓';
    }
  };
  
  const getRiskMessage = (risk: string) => {
    switch (risk) {
      case 'Critical': return '심각한 위험';
      case 'High': return '높은 위험';
      case 'Medium': return '보통 위험';
      case 'Low': return '낮은 위험';
      default: return '평가 중';
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
            🔮 통풍 발작 위험 예측
          </h3>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRiskColor(riskFactors.overallRisk)}`}>
              {getRiskIcon(riskFactors.overallRisk)}
            </div>
            <div className="text-xs text-zinc-400">
              {riskFactors.riskPercentage}% 위험도
            </div>
          </div>
        </div>
        
        {/* Risk Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>{getRiskMessage(riskFactors.overallRisk)}</span>
            <span>{riskFactors.riskPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${getRiskBgColor(riskFactors.overallRisk)}`}
              style={{ width: `${riskFactors.riskPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Next Symptom Prediction */}
        {riskFactors.daysUntilNextSymptom !== undefined && (
          <div className="mb-2 text-xs">
            <span className="text-zinc-400">다음 증상 예상: </span>
            <span className={`font-semibold ${
              riskFactors.daysUntilNextSymptom <= 3 ? 'text-red-400' :
              riskFactors.daysUntilNextSymptom <= 7 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {riskFactors.daysUntilNextSymptom === 0 ? '오늘' : `${riskFactors.daysUntilNextSymptom}일 후`}
            </span>
          </div>
        )}
        
        <div className="text-xs text-zinc-400 text-center">
          {expanded ? '접기 ▲' : '상세보기 ▼'}
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
          {/* Risk Factor Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">📋 위험 요소 분석</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">요산 수치</span>
                <div className="text-right">
                  <span className="text-zinc-300">
                    {riskFactors.uricAcidLevel ? `${riskFactors.uricAcidLevel.toFixed(1)} mg/dL` : '미기록'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">최근 증상 빈도</span>
                <span className="text-zinc-300">{riskFactors.recentSymptoms}회/월</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">평균 퓨린 섭취</span>
                <span className="text-zinc-300">{riskFactors.purineIntake}mg/일</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">평균 수분 섭취</span>
                <span className="text-zinc-300">{riskFactors.hydrationLevel}ml/일</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">약물 복용 일관성</span>
                <span className="text-zinc-300">{riskFactors.medicationCompliance}회/주</span>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          {riskFactors.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">💡 예방 권장사항</h4>
              <div className="space-y-1">
                {riskFactors.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-xs bg-zinc-900/50 rounded px-2 py-1 text-zinc-400">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Alert Messages */}
          {riskFactors.overallRisk === 'Critical' && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm font-semibold">🚨 긴급 주의!</p>
              <p className="text-red-200 text-xs mt-1">
                통풍 발작 위험이 매우 높습니다. 즉시 의료진과 상담하고 고퓨린 음식을 피하세요.
              </p>
            </div>
          )}
          
          {riskFactors.overallRisk === 'High' && (
            <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3">
              <p className="text-orange-300 text-sm font-semibold">⚠️ 높은 위험</p>
              <p className="text-orange-200 text-xs mt-1">
                통풍 발작 가능성이 높습니다. 예방 조치를 즉시 시행하세요.
              </p>
            </div>
          )}
          
          {riskFactors.overallRisk === 'Low' && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <p className="text-green-300 text-sm font-semibold">✅ 양호한 상태</p>
              <p className="text-green-200 text-xs mt-1">
                현재 통풍 관리가 잘 되고 있습니다. 이 상태를 계속 유지하세요!
              </p>
            </div>
          )}
          
          {/* Prediction Disclaimer */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <p className="text-blue-300 text-xs font-semibold">ℹ️ 예측 안내</p>
            <p className="text-blue-200 text-xs mt-1">
              이 예측은 기록된 데이터를 바탕으로 한 참고용이며, 의학적 진단을 대체하지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoutFlareRiskPrediction;
import React, { useState, useEffect, useMemo } from 'react';
import type { ChatMessage, DietEntry } from '../types';
import { parseDietMessages } from '../utils/parsers';
import type { TranslationKey } from '../translations';

interface DailyPurineTrackerProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

// Purine content database (mg per 100g)
const PURINE_DATABASE: Record<string, number> = {
  // Very High (>200mg/100g)
  '간': 400, 'liver': 400, '신장': 400, 'kidney': 400,
  '멸치': 410, 'anchovy': 410, 'anchovies': 410,
  '정어리': 345, 'sardine': 345, 'sardines': 345,
  '청어': 378, 'herring': 378,
  
  // High (150-200mg/100g)
  '소고기': 180, 'beef': 180, '돼지고기': 160, 'pork': 160,
  '양고기': 180, 'lamb': 180, '홍합': 195, 'mussel': 195, 'mussels': 195,
  '가리비': 155, 'scallop': 155, 'scallops': 155,
  '참치': 200, 'tuna': 200, '고등어': 170, 'mackerel': 170,
  
  // Moderate (50-150mg/100g)
  '닭고기': 140, 'chicken': 140, '오리': 130, 'duck': 130,
  '연어': 140, 'salmon': 140, '대구': 110, 'cod': 110,
  '새우': 145, 'shrimp': 145, 'prawns': 145,
  '콩': 120, 'beans': 120, '렌틸콩': 127, 'lentils': 127,
  '시금치': 57, 'spinach': 57, '아스파라거스': 55, 'asparagus': 55,
  '버섯': 90, 'mushroom': 90, 'mushrooms': 90,
  '오트밀': 95, 'oatmeal': 95, '통밀빵': 70, 'whole wheat bread': 70,
  
  // Low (<50mg/100g)
  '우유': 0, 'milk': 0, '요거트': 0, 'yogurt': 0, '치즈': 5, 'cheese': 5,
  '계란': 5, 'egg': 5, 'eggs': 5,
  '쌀': 18, 'rice': 18, '파스타': 15, 'pasta': 15,
  '브로콜리': 25, 'broccoli': 25, '당근': 8, 'carrot': 8, 'carrots': 8,
  '감자': 16, 'potato': 16, 'potatoes': 16,
  '사과': 0, 'apple': 0, '바나나': 7, 'banana': 7,
  '토마토': 11, 'tomato': 11, 'tomatoes': 11,
  '양상추': 5, 'lettuce': 5, '오이': 3, 'cucumber': 3,
  '피망': 12, 'bell pepper': 12
};

const DailyPurineTracker: React.FC<DailyPurineTrackerProps> = ({ messages, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Calculate today's purine intake
  const todaysPurine = useMemo(() => {
    const today = new Date().toDateString();
    const todaysDietEntries = parseDietMessages(messages).filter(entry => 
      new Date(entry.date).toDateString() === today
    );
    
    let totalPurine = 0;
    const foodBreakdown: Array<{food: string, purine: number, meal: string}> = [];
    
    todaysDietEntries.forEach(entry => {
      const foods = entry.foodDescription.toLowerCase();
      let mealPurine = 0;
      
      Object.entries(PURINE_DATABASE).forEach(([food, purineContent]) => {
        if (foods.includes(food.toLowerCase()) || foods.includes(food)) {
          const estimatedServing = 100; // Assume 100g serving
          const purineAmount = (purineContent * estimatedServing) / 100;
          mealPurine += purineAmount;
          totalPurine += purineAmount;
          
          foodBreakdown.push({
            food,
            purine: purineAmount,
            meal: entry.timeOfDay
          });
        }
      });
    });
    
    return { total: Math.round(totalPurine), breakdown: foodBreakdown, entries: todaysDietEntries.length };
  }, [messages]);
  
  const SAFE_LIMIT = 400; // mg per day
  const WARNING_LIMIT = 300;
  const percentage = Math.min((todaysPurine.total / SAFE_LIMIT) * 100, 100);
  
  const getStatusColor = () => {
    if (todaysPurine.total >= SAFE_LIMIT) return 'from-red-600 to-red-500';
    if (todaysPurine.total >= WARNING_LIMIT) return 'from-yellow-600 to-orange-500';
    return 'from-green-600 to-green-500';
  };
  
  const getTextColor = () => {
    if (todaysPurine.total >= SAFE_LIMIT) return 'text-red-400';
    if (todaysPurine.total >= WARNING_LIMIT) return 'text-yellow-400';
    return 'text-green-400';
  };
  
  const getStatusMessage = () => {
    if (todaysPurine.total >= SAFE_LIMIT) return '⚠️ 위험 수준';
    if (todaysPurine.total >= WARNING_LIMIT) return '⚡ 주의 필요';
    if (todaysPurine.total === 0) return '📝 기록 없음';
    return '✅ 안전 수준';
  };
  
  const remainingSafe = Math.max(0, SAFE_LIMIT - todaysPurine.total);

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            🧮 일일 퓨린 추적
            <span className="text-xs text-zinc-500">
              ({todaysPurine.entries}회 기록)
            </span>
          </h3>
          <div className={`text-right ${getTextColor()}`}>
            <div className="text-lg font-bold">
              {todaysPurine.total}mg
            </div>
            <div className="text-xs opacity-75">
              / {SAFE_LIMIT}mg
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-zinc-500">
            <span>0mg</span>
            <span className="text-yellow-400">{WARNING_LIMIT}mg</span>
            <span className="text-red-400">{SAFE_LIMIT}mg</span>
          </div>
        </div>
        
        {/* Status Message */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {getStatusMessage()}
          </span>
          <span className="text-xs text-zinc-400">
            {expanded ? '접기 ▲' : '자세히 ▼'}
          </span>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
          {remainingSafe > 0 && todaysPurine.total > 0 && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-300 mb-1">🟢 남은 안전 섭취량</h4>
              <p className="text-green-200 text-sm">
                오늘 <span className="font-bold text-green-300">{remainingSafe}mg</span>까지 더 섭취 가능합니다.
              </p>
            </div>
          )}
          
          {todaysPurine.total >= WARNING_LIMIT && (
            <div className={`${todaysPurine.total >= SAFE_LIMIT ? 'bg-red-900/30 border-red-700' : 'bg-yellow-900/30 border-yellow-700'} border rounded-lg p-3`}>
              <h4 className={`text-sm font-semibold ${todaysPurine.total >= SAFE_LIMIT ? 'text-red-300' : 'text-yellow-300'} mb-1`}>
                {todaysPurine.total >= SAFE_LIMIT ? '🚨' : '⚠️'} 섭취량 주의
              </h4>
              <p className={`${todaysPurine.total >= SAFE_LIMIT ? 'text-red-200' : 'text-yellow-200'} text-sm`}>
                {todaysPurine.total >= SAFE_LIMIT 
                  ? '일일 권장량을 초과했습니다. 오늘은 저퓨린 음식만 드세요.'
                  : '권장량에 가까워지고 있습니다. 주의해서 식단을 관리하세요.'
                }
              </p>
            </div>
          )}
          
          {/* Food Breakdown */}
          {todaysPurine.breakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">📋 오늘의 퓨린 섭취 내역</h4>
              <div className="space-y-1">
                {todaysPurine.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900/50 rounded px-2 py-1">
                    <span className="text-zinc-300">
                      {item.food} <span className="text-zinc-500">({item.meal})</span>
                    </span>
                    <span className={`font-bold ${
                      item.purine > 100 ? 'text-red-400' :
                      item.purine > 50 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {Math.round(item.purine)}mg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {todaysPurine.entries === 0 && (
            <div className="text-center py-4">
              <p className="text-zinc-400 text-sm mb-2">오늘 식단 기록이 없습니다</p>
              <p className="text-xs text-zinc-500">식단을 기록하여 퓨린 섭취량을 추적해보세요!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyPurineTracker;
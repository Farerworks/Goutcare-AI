import React, { useState, useEffect } from 'react';
import type { WaterIntakeEntry, TranslationKey } from '../types';

interface WaterIntakeTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (entry: WaterIntakeEntry | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
}

const WaterIntakeTracker: React.FC<WaterIntakeTrackerProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  t, 
  selectedDate 
}) => {
  const [amount, setAmount] = useState<number>(250);
  const [type, setType] = useState<WaterIntakeEntry['type']>('water');
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Quick amount buttons
  const quickAmounts = [200, 250, 350, 500];
  
  // Drink types with icons
  const drinkTypes: Array<{ value: WaterIntakeEntry['type']; icon: string; label: string }> = [
    { value: 'water', icon: '💧', label: '물' },
    { value: 'tea', icon: '🍵', label: '차' },
    { value: 'coffee', icon: '☕', label: '커피' },
    { value: 'juice', icon: '🧃', label: '주스' },
    { value: 'other', icon: '🥤', label: '기타' }
  ];

  useEffect(() => {
    if (isOpen) {
      setAmount(250);
      setType('water');
      setCustomAmount('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const entry: WaterIntakeEntry = {
      date: selectedDate || new Date(),
      amount: customAmount ? parseInt(customAmount) : amount,
      time: new Date().toTimeString().slice(0, 5),
      type
    };
    
    onComplete(entry);
    
    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('waterIntakeEntries', JSON.stringify(existingEntries));
  };

  const getTodayTotal = (): number => {
    const entries = JSON.parse(localStorage.getItem('waterIntakeEntries') || '[]');
    const today = new Date().toDateString();
    return entries
      .filter((e: WaterIntakeEntry) => new Date(e.date).toDateString() === today)
      .reduce((sum: number, e: WaterIntakeEntry) => sum + e.amount, 0);
  };

  const dailyGoal = 2000; // 2L recommended
  const todayTotal = getTodayTotal();
  const percentage = Math.min((todayTotal / dailyGoal) * 100, 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">💧 수분 섭취 기록</h2>
        
        {/* Today's Progress */}
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-zinc-300">오늘의 섭취량</span>
            <span className="text-sm font-bold text-cyan-400">{todayTotal}ml / {dailyGoal}ml</span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {percentage >= 100 && (
            <p className="text-xs text-green-400 mt-2 text-center">🎉 오늘의 목표를 달성했습니다!</p>
          )}
        </div>

        {/* Drink Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">음료 종류</label>
          <div className="grid grid-cols-5 gap-2">
            {drinkTypes.map(drink => (
              <button
                key={drink.value}
                onClick={() => setType(drink.value)}
                className={`p-2 rounded-lg text-center transition-all ${
                  type === drink.value 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                }`}
              >
                <div className="text-xl mb-1">{drink.icon}</div>
                <div className="text-xs">{drink.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">섭취량 (ml)</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  amount === amt && !customAmount
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                }`}
              >
                {amt}ml
              </button>
            ))}
          </div>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="직접 입력 (ml)"
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Visual Cup Representation */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-32 border-4 border-zinc-600 rounded-b-3xl">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-b-2xl transition-all duration-300"
              style={{ 
                height: `${Math.min(((customAmount ? parseInt(customAmount) : amount) / 500) * 100, 100)}%` 
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg drop-shadow-lg">
                {customAmount || amount}ml
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-600 rounded-lg hover:bg-zinc-500 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors"
          >
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaterIntakeTracker;
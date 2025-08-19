import React, { useState, useEffect } from 'react';
import type { UricAcidEntry, TranslationKey } from '../types';

interface UricAcidTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (entry: UricAcidEntry | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
}

const UricAcidTracker: React.FC<UricAcidTrackerProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  t, 
  selectedDate 
}) => {
  const [level, setLevel] = useState<string>('');
  const [labName, setLabName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const TARGET_LEVEL = 6.0; // mg/dL - medical target for gout patients
  
  useEffect(() => {
    if (isOpen) {
      setLevel('');
      setLabName('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!level) return;
    
    const entry: UricAcidEntry = {
      date: selectedDate || new Date(),
      level: parseFloat(level),
      labName: labName || undefined,
      notes: notes || undefined
    };
    
    onComplete(entry);
    
    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('uricAcidEntries', JSON.stringify(existingEntries));
  };

  const getRecentReadings = (): UricAcidEntry[] => {
    const entries = JSON.parse(localStorage.getItem('uricAcidEntries') || '[]');
    return entries
      .sort((a: UricAcidEntry, b: UricAcidEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5);
  };

  const getStatusColor = (value: number): string => {
    if (value <= 6.0) return 'text-green-400';
    if (value <= 7.0) return 'text-yellow-400';
    if (value <= 8.0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusMessage = (value: number): string => {
    if (value <= 6.0) return '✅ 목표 수치 달성!';
    if (value <= 7.0) return '⚠️ 약간 높음';
    if (value <= 8.0) return '⚠️ 높음 - 주의 필요';
    return '🚨 매우 높음 - 의사 상담 필요';
  };

  const recentReadings = getRecentReadings();
  const currentLevel = level ? parseFloat(level) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">🔬 요산 수치 기록</h2>
        
        {/* Visual Gauge */}
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-lg">
          <div className="relative h-32 flex items-center justify-center">
            {/* Gauge Background */}
            <svg className="absolute w-48 h-48" viewBox="0 0 200 200">
              <path
                d="M 30 170 A 70 70 0 1 1 170 170"
                fill="none"
                stroke="#27272a"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {level && (
                <path
                  d="M 30 170 A 70 70 0 1 1 170 170"
                  fill="none"
                  stroke={currentLevel <= 6 ? '#10b981' : currentLevel <= 8 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min((currentLevel / 12) * 220, 220)} 220`}
                  className="transition-all duration-500"
                />
              )}
            </svg>
            
            {/* Center Display */}
            <div className="text-center z-10">
              {level ? (
                <>
                  <div className={`text-4xl font-bold ${getStatusColor(currentLevel)}`}>
                    {currentLevel.toFixed(1)}
                  </div>
                  <div className="text-xs text-zinc-400">mg/dL</div>
                </>
              ) : (
                <div className="text-zinc-500">
                  <div className="text-2xl">--.-</div>
                  <div className="text-xs">mg/dL</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Target Line Indicator */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-zinc-500">0</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400">목표: 6.0 이하</span>
            </div>
            <span className="text-zinc-500">12+</span>
          </div>
        </div>

        {/* Status Message */}
        {level && (
          <div className={`mb-4 p-3 rounded-lg text-center font-semibold ${
            currentLevel <= 6 ? 'bg-green-900/30' : currentLevel <= 8 ? 'bg-yellow-900/30' : 'bg-red-900/30'
          }`}>
            <span className={getStatusColor(currentLevel)}>
              {getStatusMessage(currentLevel)}
            </span>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              요산 수치 (mg/dL) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="예: 7.5"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              검사 기관 (선택)
            </label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="예: 서울대병원"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              메모 (선택)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="예: 약 복용 2주 후 검사"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Recent Readings */}
        {recentReadings.length > 0 && (
          <div className="mt-4 p-3 bg-zinc-900/30 rounded-lg">
            <h3 className="text-xs font-semibold text-zinc-400 mb-2">최근 기록</h3>
            <div className="space-y-1">
              {recentReadings.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className={`font-bold ${getStatusColor(entry.level)}`}>
                    {entry.level.toFixed(1)} mg/dL
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-600 rounded-lg hover:bg-zinc-500 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!level}
            className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed"
          >
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UricAcidTracker;
import React, { useState, useMemo } from 'react';
import type { ChatMessage, SymptomEntry, MedicationEntry, DietEntry } from '../types';
import type { TranslationKey } from '../translations';
import { ChevronLeftIcon, ChevronRightIcon } from './IconComponents';
import { parseSymptomMessages, parseMedicationMessages, parseDietMessages } from '../utils/parsers';

interface CompactCalendarProps {
  messages: ChatMessage[];
  onLogRequest: (date: Date) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  isCompact?: boolean;
}

const CompactCalendar: React.FC<CompactCalendarProps> = ({ messages, onLogRequest, t, isCompact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Parse data
  const { symptomDataByDate, medicationDataByDate, dietDataByDate } = useMemo(() => {
    const symptoms = parseSymptomMessages(messages);
    const medications = parseMedicationMessages(messages);
    const diet = parseDietMessages(messages);

    const symptomMap = new Map<string, SymptomEntry[]>();
    const medicationMap = new Map<string, MedicationEntry[]>();
    const dietMap = new Map<string, DietEntry[]>();

    symptoms.forEach(entry => {
      const dayKey = entry.date.toISOString().split('T')[0];
      if (!symptomMap.has(dayKey)) symptomMap.set(dayKey, []);
      symptomMap.get(dayKey)!.push(entry);
    });

    medications.forEach(entry => {
      const dayKey = entry.date.toISOString().split('T')[0];
      if (!medicationMap.has(dayKey)) medicationMap.set(dayKey, []);
      medicationMap.get(dayKey)!.push(entry);
    });

    diet.forEach(entry => {
      const dayKey = entry.date.toISOString().split('T')[0];
      if (!dietMap.has(dayKey)) dietMap.set(dayKey, []);
      dietMap.get(dayKey)!.push(entry);
    });

    return {
      symptomDataByDate: symptomMap,
      medicationDataByDate: medicationMap,
      dietDataByDate: dietMap
    };
  }, [messages]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toDateString();

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-5 w-5"></div>);
    }

    // Calendar days - Make them smaller
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayKey = dayDate.toISOString().split('T')[0];
      const isToday = dayDate.toDateString() === today;
      
      const hasSymptoms = symptomDataByDate.has(dayKey);
      const hasMedications = medicationDataByDate.has(dayKey);
      const hasDiet = dietDataByDate.has(dayKey);
      const hasAnyData = hasSymptoms || hasMedications || hasDiet;

      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLogRequest(dayDate);
          }}
          className={`
            h-5 w-5 rounded text-xs font-medium transition-all duration-200 relative group flex items-center justify-center
            ${isToday 
              ? 'bg-teal-600 text-white ring-1 ring-teal-400' 
              : hasAnyData 
                ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }
          `}
        >
          <span className="relative z-10">{day}</span>
          
          {/* Activity indicators - smaller */}
          {hasAnyData && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {hasSymptoms && <div className="w-0.5 h-0.5 bg-red-400 rounded-full"></div>}
              {hasMedications && <div className="w-0.5 h-0.5 bg-blue-400 rounded-full"></div>}
              {hasDiet && <div className="w-0.5 h-0.5 bg-green-400 rounded-full"></div>}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              changeMonth(-1);
            }}
            className="p-1 rounded hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeftIcon className="w-3 h-3" />
          </button>
          
          <h3 className="text-sm font-semibold text-zinc-200">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              changeMonth(1);
            }}
            className="p-1 rounded hover:bg-zinc-700 transition-colors"
          >
            <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Calendar Grid - More compact */}
      <div className="p-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayHeaders.map(day => (
            <div key={day} className="text-center text-xs text-zinc-500 font-medium h-3 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0.5">
          {renderCalendar()}
        </div>
      </div>

      {/* Footer - More compact */}
      <div className="p-1 border-t border-zinc-700/50">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLogRequest(new Date());
          }}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-1.5 px-2 rounded text-xs transition-colors"
        >
          오늘 기록 추가
        </button>
        
        {!isCompact && (
          <div className="flex justify-center gap-2 mt-1 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <span>증상</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span>약물</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span>식단</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactCalendar;
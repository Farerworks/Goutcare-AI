import React, { useState, useMemo } from 'react';
import type { ChatMessage, SymptomEntry, MedicationEntry, DietEntry } from '../types';
import type { TranslationKey } from '../translations';
import { ChevronLeftIcon, ChevronRightIcon, FileHeartIcon, PillIcon, UtensilsIcon, CalendarDaysIcon } from './IconComponents';
import { parseSymptomMessages, parseMedicationMessages, parseDietMessages } from '../utils/parsers';
import PainTrendChart from './PainTrendChart';

// --- SUB-COMPONENT: LOG CALENDAR ---
const LogCalendar: React.FC<{
    symptomDataByDate: Map<string, SymptomEntry[]>,
    medicationDataByDate: Map<string, MedicationEntry[]>,
    dietDataByDate: Map<string, DietEntry[]>,
    onLogRequest: (date: Date) => void,
    t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string,
}> = ({ symptomDataByDate, medicationDataByDate, dietDataByDate, onLogRequest, t }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (offset: number) => setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + offset);
        return newDate;
    });

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-zinc-700 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
            <h4 className="font-semibold text-lg text-zinc-200">{t(`month${currentDate.getMonth() + 1}` as TranslationKey)} {currentDate.getFullYear()}</h4>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-zinc-700 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
    );

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayHeaders = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <>
                <div className="grid grid-cols-7 text-center text-xs text-zinc-400 mb-2">
                    {dayHeaders.map(day => <div key={day}>{t(day as TranslationKey)}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center text-sm">
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {days.map(day => {
                        const dayDate = new Date(year, month, day);
                        const dayKey = dayDate.toISOString().split('T')[0];
                        const symptomEntries = symptomDataByDate.get(dayKey);
                        const medicationEntries = medicationDataByDate.get(dayKey);
                        const dietEntries = dietDataByDate.get(dayKey);
                        const today = new Date();
                        const isToday = today.toDateString() === dayDate.toDateString();
                        const hasLogs = symptomEntries || medicationEntries || dietEntries;

                        const tooltipContent = [
                            symptomEntries?.map(e => e.summary).join('\n---\n'),
                            medicationEntries?.map(e => e.summary).join('\n---\n'),
                            dietEntries?.map(e => e.summary).join('\n---\n'),
                        ].filter(Boolean).join('\n\n');

                        return (
                             <div key={day} className="relative p-1">
                                <button 
                                    onClick={() => onLogRequest(dayDate)}
                                    className={`relative w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-colors hover:bg-zinc-700 ${isToday ? 'bg-teal-700/80 font-bold' : ''}`}
                                    aria-label={`Log for ${dayDate.toLocaleDateString()}`}
                                >
                                    <span>{day}</span>
                                    {hasLogs && (
                                        <div className="group absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                                            <div className="flex items-center space-x-0.5">
                                                {symptomEntries && <FileHeartIcon className="w-2.5 h-2.5 text-red-400" />}
                                                {medicationEntries && <PillIcon className="w-2.5 h-2.5 text-sky-400" />}
                                                {dietEntries && <UtensilsIcon className="w-2.5 h-2.5 text-amber-400" />}
                                            </div>
                                            <div className="absolute bottom-full mb-2 w-72 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-zinc-200 p-2 rounded-lg text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left whitespace-pre-wrap">
                                                {tooltipContent}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="bg-zinc-800 rounded-lg p-4 flex-1 flex flex-col min-h-0">
             <h3 className="flex items-center text-md font-semibold text-teal-300 mb-2">
                <CalendarDaysIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {t('symptomCalendarTitle')}
            </h3>
            {renderHeader()}
            <div className="flex-1 overflow-y-auto">
                 {renderDays()}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-col items-center">
                 <button onClick={() => onLogRequest(new Date())} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors">
                    {t('logForToday')}
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: CALENDAR PANEL ---
interface CalendarPanelProps {
  messages: ChatMessage[];
  onLogRequest: (date: Date) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ messages, onLogRequest, t }) => {
    
    const allSymptomEntries = useMemo(() => {
        return parseSymptomMessages(messages);
    }, [messages]);

    const symptomDataByDate = useMemo(() => {
        const map = new Map<string, SymptomEntry[]>();
        allSymptomEntries.forEach(e => {
            const dayKey = e.date.toISOString().split('T')[0];
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(e);
        });
        return map;
    }, [allSymptomEntries]);

    const medicationDataByDate = useMemo(() => {
        const map = new Map<string, MedicationEntry[]>();
        parseMedicationMessages(messages).forEach(e => {
            const dayKey = e.date.toISOString().split('T')[0];
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(e);
        });
        return map;
    }, [messages]);
    
    const dietDataByDate = useMemo(() => {
        const map = new Map<string, DietEntry[]>();
        parseDietMessages(messages).forEach(e => {
            const dayKey = e.date.toISOString().split('T')[0];
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(e);
        });
        return map;
    }, [messages]);
    
  return (
    <div className="p-3 lg:p-6 h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex-grow flex flex-col min-h-0">
        <LogCalendar 
            symptomDataByDate={symptomDataByDate} 
            medicationDataByDate={medicationDataByDate}
            dietDataByDate={dietDataByDate}
            onLogRequest={onLogRequest}
            t={t} 
        />
      </div>
       <div className="flex-shrink-0">
        <PainTrendChart symptomEntries={allSymptomEntries} t={t} />
      </div>
    </div>
  );
};

export default CalendarPanel;
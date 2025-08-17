



import React, { useState, useMemo, useEffect } from 'react';
import type { ChatMessage, SymptomEntry } from '../types';
import type { Language, TranslationKey } from '../translations';
import { LightbulbIcon, ChevronLeftIcon, ChevronRightIcon } from './IconComponents';
import GoutForecast from './GoutForecast';

// --- UTILITY: PARSE SYMPTOM DATA ---
const parseSymptomMessages = (messages: ChatMessage[]): SymptomEntry[] => {
    const entries: SymptomEntry[] = [];
    const painLevelRegex = /(Pain Level|통증 수준):\s*(\d+)\/10/;

    for (const message of messages) {
        if (message.role === 'user' && (message.content.startsWith('[Symptom Check-in') || message.content.startsWith('[증상 기록'))) {
            try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Symptom Check-in|증상 기록)\s*-\s*(.+)\]/);
                if (!dateMatch || !dateMatch[1]) continue;

                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;

                const painMatch = content.match(painLevelRegex);
                const painLevel = painMatch && painMatch[2] ? parseInt(painMatch[2], 10) : 0;

                entries.push({ date, painLevel, summary: content });
            } catch (e) {
                console.error("Failed to parse symptom message:", message.content, e);
            }
        }
    }
    return entries;
};

const getPainColor = (level: number) => {
    if (level >= 9) return 'bg-red-500';
    if (level >= 7) return 'bg-orange-500';
    if (level >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
};


// --- SUB-COMPONENT: TIP OF THE DAY ---
const tipKeys: TranslationKey[] = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5'];

const TipOfTheDay: React.FC<{ t: (key: TranslationKey) => string }> = ({ t }) => {
  const [tipKey, setTipKey] = useState<TranslationKey | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tipKeys.length);
    setTipKey(tipKeys[randomIndex]);
  }, []);

  if (!tipKey) return null;

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <h3 className="flex items-center text-md font-semibold text-amber-300 mb-2">
        <LightbulbIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {t('tipOfTheDayTitle')}
      </h3>
      <p className="text-sm text-zinc-300">{t(tipKey)}</p>
    </div>
  );
};


// --- SUB-COMPONENT: SYMPTOM CALENDAR (FULL VIEW) ---
const SymptomCalendar: React.FC<{
    symptomDataByDate: Map<string, SymptomEntry[]>,
    onLogSymptom: (date: Date) => void,
    t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string
}> = ({ symptomDataByDate, onLogSymptom, t }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const renderHeader = () => {
        const monthName = t(`month${currentDate.getMonth() + 1}` as TranslationKey);
        return (
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-zinc-700"><ChevronLeftIcon className="w-5 h-5" /></button>
                <h3 className="font-semibold text-lg">{monthName} {currentDate.getFullYear()}</h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-zinc-700"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
        );
    };

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
                        const entries = symptomDataByDate.get(dayKey);
                        const today = new Date();
                        const isToday = today.toDateString() === dayDate.toDateString();
                        
                        const highestPainEntry = entries?.reduce((max, entry) => entry.painLevel > max.painLevel ? entry : max, entries[0]);

                        return (
                             <div key={day} className="relative p-1">
                                <button 
                                    onClick={() => onLogSymptom(dayDate)}
                                    className={`relative w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-colors hover:bg-zinc-700 ${isToday ? 'bg-teal-700 font-bold' : ''}`}
                                    aria-label={`Log symptom for ${dayDate.toLocaleDateString()}`}
                                >
                                    <span>{day}</span>
                                    {highestPainEntry && (
                                        <div className="group absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                                            <div className={`w-3 h-3 rounded-full border-2 border-zinc-800 ${getPainColor(highestPainEntry.painLevel)}`}></div>
                                            <div className="absolute bottom-full mb-2 w-64 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-zinc-200 p-2 rounded-lg text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left whitespace-pre-wrap">
                                                <strong className="font-bold">{t('painLevelLegend')}: {highestPainEntry.painLevel}/10</strong>
                                                <hr className="border-zinc-600 my-1"/>
                                                {entries!.map(e => e.summary).join('\n---\n')}
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
            <h3 className="text-md font-semibold text-zinc-200 mb-2">{t('symptomCalendarTitle')}</h3>
            {renderHeader()}
            <div className="flex-1 overflow-y-auto">
                 {renderDays()}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-col items-center">
                 <div className="flex items-center space-x-4 text-xs text-zinc-400">
                    <span>{t('painLevelLegend')}:</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>1-3</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>4-6</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>7-8</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>9-10</span>
                </div>
                <button 
                    onClick={() => onLogSymptom(new Date())}
                    className="mt-4 w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors"
                >
                    {t('logTodaysSymptoms')}
                </button>
            </div>
        </div>
    );
};


// --- SUB-COMPONENT: SYMPTOM CALENDAR (WEEK VIEW FOR MOBILE) ---
const SymptomWeekView: React.FC<{
    symptomDataByDate: Map<string, SymptomEntry[]>,
    onLogSymptom: (date: Date) => void,
    t: (key: TranslationKey) => string
}> = ({ symptomDataByDate, onLogSymptom, t }) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Week starts on Sunday

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
    });
    
    const dayHeaders = ['daySun', 'dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat'];

    return (
        <div className="bg-zinc-800 rounded-lg p-3">
            <h3 className="text-md font-semibold text-zinc-200 mb-3">{t('symptomCalendarTitle')}</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
                {weekDates.map((date, index) => {
                    const dayKey = date.toISOString().split('T')[0];
                    const entries = symptomDataByDate.get(dayKey);
                    const highestPainEntry = entries?.reduce((max, entry) => entry.painLevel > max.painLevel ? entry : max, entries[0]);
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                        <button 
                            key={dayKey} 
                            onClick={() => onLogSymptom(date)}
                            className="flex flex-col items-center p-1 rounded-md hover:bg-zinc-700 transition-colors"
                            aria-label={`Log symptom for ${date.toLocaleDateString()}`}
                        >
                            <span className="text-xs text-zinc-400">{t(dayHeaders[index] as TranslationKey)}</span>
                            <span className={`relative mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm ${isToday ? 'bg-teal-700 font-bold' : ''}`}>
                                {date.getDate()}
                                {highestPainEntry && (
                                    <span className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full border-2 border-zinc-800 ${getPainColor(highestPainEntry.painLevel)}`}></span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


// --- MAIN COMPONENT: DASHBOARD PANEL ---
interface DashboardPanelProps {
  messages: ChatMessage[];
  onLogSymptom: (date: Date) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ messages, onLogSymptom, t, lang }) => {
    const symptomDataByDate = useMemo(() => {
        const parsedEntries = parseSymptomMessages(messages);
        const map = new Map<string, SymptomEntry[]>();
        for (const entry of parsedEntries) {
            const dayKey = entry.date.toISOString().split('T')[0];
            if (!map.has(dayKey)) {
                map.set(dayKey, []);
            }
            map.get(dayKey)!.push(entry);
        }
        return map;
    }, [messages]);

  return (
    <div className="bg-zinc-800/50 rounded-lg shadow-2xl lg:p-6 p-3 h-full flex flex-col gap-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-teal-400 flex-shrink-0 border-b border-zinc-700 pb-2">{t('dashboardTitle')}</h2>
      
      <div className="flex-shrink-0">
        <GoutForecast t={t} lang={lang} />
      </div>

      {/* --- Mobile View --- */}
      <div className="lg:hidden">
          <SymptomWeekView symptomDataByDate={symptomDataByDate} onLogSymptom={onLogSymptom} t={t} />
      </div>

      {/* --- Desktop View --- */}
      <div className="hidden lg:flex flex-shrink-0">
        <TipOfTheDay t={t} />
      </div>
      <div className="hidden lg:flex flex-grow flex-col min-h-0">
        <SymptomCalendar 
            symptomDataByDate={symptomDataByDate} 
            onLogSymptom={onLogSymptom} 
            t={t} 
        />
      </div>
    </div>
  );
};

export default DashboardPanel;
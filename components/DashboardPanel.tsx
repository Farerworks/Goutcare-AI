import React, { useState, useMemo, useEffect } from 'react';
import type { ChatMessage, SymptomEntry, MedicationEntry, DietEntry } from '../types';
import type { Language, TranslationKey } from '../translations';
import { LightbulbIcon, ChevronLeftIcon, ChevronRightIcon, FileHeartIcon, PillIcon, UtensilsIcon, CalendarDaysIcon } from './IconComponents';
import GoutForecast from './GoutForecast';
import { useDebounce } from '../hooks/useDebounce';

// --- UTILITY: PARSERS ---
const parseSymptomMessages = (messages: ChatMessage[]): SymptomEntry[] => {
    const entries: SymptomEntry[] = [];
    const painLevelRegex = /(Pain Level|통증 수준):\s*(\d+)\/10/;
    for (const message of messages) {
        if (message.role === 'user' && (message.content.startsWith('[Symptom Log') || message.content.startsWith('[증상 기록'))) {
            try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Symptom Log|증상 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;
                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;
                const painMatch = content.match(painLevelRegex);
                const painLevel = painMatch?.[2] ? parseInt(painMatch[2], 10) : 0;
                entries.push({ date, painLevel, summary: content });
            } catch (e) { console.error("Failed to parse symptom message:", message.content, e); }
        }
    }
    return entries;
};

const parseMedicationMessages = (messages: ChatMessage[]): MedicationEntry[] => {
    const entries: MedicationEntry[] = [];
    const nameRegex = /(Medication Name|약 이름):\s*(.+)/;
    const timeOfDayRegex = /(Time of Day|시간대):\s*(.+)/;
    const timeOfDayMap: { [key: string]: MedicationEntry['timeOfDay'] } = { 'Morning':'Morning', 'Lunch':'Lunch', 'Dinner':'Dinner', 'Bedtime':'Bedtime', '아침':'Morning', '점심':'Lunch', '저녁':'Dinner', '취침 전':'Bedtime' };
    for (const message of messages) {
        if (message.role === 'user' && (message.content.startsWith('[Medication Logged') || message.content.startsWith('[복용 기록'))) {
             try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Medication Logged|복용 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;
                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;
                const nameMatch = content.match(nameRegex);
                const timeOfDayMatch = content.match(timeOfDayRegex);
                if (!nameMatch?.[2] || !timeOfDayMatch?.[2]) continue;
                entries.push({ date, medicationName: nameMatch[2], timeOfDay: timeOfDayMap[timeOfDayMatch[2]], summary: content });
            } catch (e) { console.error("Failed to parse medication message:", message.content, e); }
        }
    }
    return entries;
};

const parseDietMessages = (messages: ChatMessage[]): DietEntry[] => {
    const entries: DietEntry[] = [];
    const foodRegex = /(Food\/Meal|음식\/식사):\s*(.+)/;
    const timeOfDayRegex = /(Time of Day|시간대):\s*(.+)/;
    const timeOfDayMap: { [key: string]: DietEntry['timeOfDay'] } = { 'Breakfast':'Breakfast', 'Lunch':'Lunch', 'Dinner':'Dinner', 'After Dinner':'After Dinner', '아침':'Breakfast', '점심':'Lunch', '저녁':'Dinner', '저녁 이후':'After Dinner' };
    for (const message of messages) {
        if (message.role === 'user' && (message.content.startsWith('[Diet Logged') || message.content.startsWith('[식단 기록'))) {
            try {
                const content = message.content;
                const dateMatch = content.match(/\[(?:Diet Logged|식단 기록)\s*-\s*(.+)\]/);
                if (!dateMatch?.[1]) continue;
                const date = new Date(dateMatch[1]);
                if (isNaN(date.getTime())) continue;
                const foodMatch = content.match(foodRegex);
                const timeOfDayMatch = content.match(timeOfDayRegex);
                if (!foodMatch?.[2] || !timeOfDayMatch?.[2]) continue;
                entries.push({ date, foodDescription: foodMatch[2], timeOfDay: timeOfDayMap[timeOfDayMatch[2]], summary: content });
            } catch (e) { console.error("Failed to parse diet message:", message.content, e); }
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
  useEffect(() => { setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]); }, []);
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

// --- SUB-COMPONENT: LOG CALENDAR ---
const LogCalendar: React.FC<{
    symptomDataByDate: Map<string, SymptomEntry[]>,
    medicationDataByDate: Map<string, MedicationEntry[]>,
    dietDataByDate: Map<string, DietEntry[]>,
    onLogRequest: (type: 'symptom' | 'medication' | 'diet', date: Date) => void,
    t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string,
    activeTab: 'symptom' | 'medication' | 'diet',
}> = ({ symptomDataByDate, medicationDataByDate, dietDataByDate, onLogRequest, t, activeTab }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (offset: number) => setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + offset);
        return newDate;
    });

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-zinc-700"><ChevronLeftIcon className="w-5 h-5" /></button>
            <h3 className="font-semibold text-lg">{t(`month${currentDate.getMonth() + 1}` as TranslationKey)} {currentDate.getFullYear()}</h3>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-zinc-700"><ChevronRightIcon className="w-5 h-5" /></button>
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
                                    onClick={() => onLogRequest(activeTab, dayDate)}
                                    className={`relative w-8 h-8 flex items-center justify-center rounded-full mx-auto transition-colors hover:bg-zinc-700 ${isToday ? 'bg-teal-700 font-bold' : ''}`}
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

    const getLogButton = () => {
        switch (activeTab) {
            case 'symptom':
                return { labelKey: 'logTodaysSymptoms' as const, handler: () => onLogRequest('symptom', new Date()) };
            case 'medication':
                return { labelKey: 'logMedication' as const, handler: () => onLogRequest('medication', new Date()) };
            case 'diet':
                return { labelKey: 'logDiet' as const, handler: () => onLogRequest('diet', new Date()) };
        }
    }
    const logButton = getLogButton();

    return (
        <div className="bg-zinc-800 rounded-lg p-4 flex-1 flex flex-col min-h-0">
            {renderHeader()}
            <div className="flex-1 overflow-y-auto">
                 {renderDays()}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-col items-center">
                <button onClick={logButton.handler} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-500 transition-colors">
                    {t(logButton.labelKey)}
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: DASHBOARD PANEL ---
interface DashboardPanelProps {
  messages: ChatMessage[];
  onLogRequest: (type: 'symptom' | 'medication' | 'diet', date: Date | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ messages, onLogRequest, t, lang, healthProfileSummary }) => {
    const [activeTab, setActiveTab] = useState<'symptom' | 'medication' | 'diet'>('symptom');
    
    // Debounce the health profile summary to prevent rapid-fire API calls for the forecast.
    // This is the fix for the 429 rate-limiting error. It waits for 60 seconds of inactivity
    // in conversation before allowing the forecast to re-fetch with new personalized data.
    const debouncedHealthProfileSummary = useDebounce(healthProfileSummary, 60000);

    const symptomDataByDate = useMemo(() => {
        const map = new Map<string, SymptomEntry[]>();
        parseSymptomMessages(messages).forEach(e => {
            const dayKey = e.date.toISOString().split('T')[0];
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(e);
        });
        return map;
    }, [messages]);

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
    
    const TabButton: React.FC<{ tabName: 'symptom' | 'medication' | 'diet', Icon: React.FC<{className?:string}>, labelKey: TranslationKey }> = ({ tabName, Icon, labelKey }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tabName ? 'bg-teal-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
        >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
        </button>
    );

  return (
    <div className="bg-zinc-800/50 rounded-lg shadow-2xl lg:p-6 p-3 h-full flex flex-col gap-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-teal-400 flex-shrink-0 border-b border-zinc-700 pb-2">{t('dashboardTitle')}</h2>
      
      <div className="flex-shrink-0">
        <GoutForecast t={t} lang={lang} healthProfileSummary={debouncedHealthProfileSummary} />
      </div>

      <div className="flex-shrink-0 bg-zinc-800 p-1 rounded-lg flex gap-1">
        <TabButton tabName="symptom" Icon={CalendarDaysIcon} labelKey="dashboardTabSymptoms" />
        <TabButton tabName="medication" Icon={PillIcon} labelKey="dashboardTabMedication" />
        <TabButton tabName="diet" Icon={UtensilsIcon} labelKey="dashboardTabDiet" />
      </div>

      <div className="hidden lg:flex flex-shrink-0">
        <TipOfTheDay t={t} />
      </div>

      <div className="flex-grow flex-col min-h-0">
        <LogCalendar 
            symptomDataByDate={symptomDataByDate} 
            medicationDataByDate={medicationDataByDate}
            dietDataByDate={dietDataByDate}
            onLogRequest={(type, date) => onLogRequest(type, date)} 
            t={t} 
            activeTab={activeTab}
        />
      </div>
    </div>
  );
};

export default DashboardPanel;
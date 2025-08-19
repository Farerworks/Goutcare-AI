import React, { useEffect, useState } from 'react';
import type { ChatMessage, SymptomEntry } from '../types';
import type { Language, TranslationKey } from '../translations';
import GoutForecast from './GoutForecast';
import { LightbulbIcon } from './IconComponents';
import PainTrendChart from './PainTrendChart';

// --- SUB-COMPONENT: TIP OF THE DAY ---
const tipKeys: TranslationKey[] = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5'];
const TipOfTheDay: React.FC<{ t: (key: TranslationKey) => string }> = ({ t }) => {
  const [tipKey, setTipKey] = useState<TranslationKey | null>(null);
  useEffect(() => { setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]); }, []);
  if (!tipKey) return null;
  return (
    <div className="bg-slate-800/80 rounded-lg p-4 flex-shrink-0">
      <h3 className="flex items-center text-md font-semibold text-amber-300 mb-2">
        <LightbulbIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {t('tipOfTheDayTitle')}
      </h3>
      <p className="text-sm text-slate-300">{t(tipKey)}</p>
    </div>
  );
};


// --- MAIN COMPONENT: DASHBOARD PANEL ---
interface DashboardPanelProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
  symptomEntries: SymptomEntry[];
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ messages, t, lang, healthProfileSummary, symptomEntries }) => {
    
  return (
    <div className="p-3 lg:p-6 h-full flex flex-col gap-6 overflow-y-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="flex-shrink-0">
            <GoutForecast t={t} lang={lang} healthProfileSummary={healthProfileSummary} />
          </div>
          <div className="flex-shrink-0">
            <PainTrendChart symptomEntries={symptomEntries} t={t} />
          </div>
      </div>

      <div className="flex-shrink-0 mt-2">
        <TipOfTheDay t={t} />
      </div>
    </div>
  );
};

export default DashboardPanel;
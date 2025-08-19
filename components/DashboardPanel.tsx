import React, { useEffect, useState } from 'react';
import type { ChatMessage } from '../types';
import type { Language, TranslationKey } from '../translations';
import GoutForecast from './GoutForecast';
import DailyPurineTracker from './DailyPurineTracker';
import HealthScoreSystem from './HealthScoreSystem';
import UricAcidTrendChart from './UricAcidTrendChart';
import GoutFlareRiskPrediction from './GoutFlareRiskPrediction';
import { LightbulbIcon } from './IconComponents';

// --- SUB-COMPONENT: TIP OF THE DAY ---
const tipKeys: TranslationKey[] = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5'];
const TipOfTheDay: React.FC<{ t: (key: TranslationKey) => string }> = ({ t }) => {
  const [tipKey, setTipKey] = useState<TranslationKey | null>(null);
  useEffect(() => { setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]); }, []);
  if (!tipKey) return null;
  return (
    <div className="bg-zinc-800 rounded-lg p-4 flex-shrink-0">
      <h3 className="flex items-center text-md font-semibold text-amber-300 mb-2">
        <LightbulbIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        {t('tipOfTheDayTitle')}
      </h3>
      <p className="text-sm text-zinc-300">{t(tipKey)}</p>
    </div>
  );
};


// --- MAIN COMPONENT: DASHBOARD PANEL ---
interface DashboardPanelProps {
  messages: ChatMessage[];
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  lang: Language;
  healthProfileSummary: string;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ messages, t, lang, healthProfileSummary }) => {
    
  return (
    <div className="p-3 lg:p-6 h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex-shrink-0">
        <GoutForecast t={t} lang={lang} healthProfileSummary={healthProfileSummary} />
      </div>
      
      <div className="flex-shrink-0">
        <DailyPurineTracker messages={messages} t={t} />
      </div>
      
      <div className="flex-shrink-0">
        <HealthScoreSystem messages={messages} t={t} />
      </div>
      
      <div className="flex-shrink-0">
        <UricAcidTrendChart t={t} />
      </div>
      
      <div className="flex-shrink-0">
        <GoutFlareRiskPrediction messages={messages} t={t} />
      </div>

      <div className="flex-shrink-0">
        <TipOfTheDay t={t} />
      </div>
    </div>
  );
};

export default DashboardPanel;
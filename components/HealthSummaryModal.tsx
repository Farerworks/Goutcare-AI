import React from 'react';
import type { TranslationKey } from '../translations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HealthSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isLoading: boolean;
  onExport: () => void;
  t: (key: TranslationKey) => string;
}

const HealthSummaryModal: React.FC<HealthSummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onExport, t }) => {
  if (!isOpen) return null;

  const LoadingIndicator = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
      <span className="ml-3 text-zinc-300">{t('loadingSummary')}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-2 text-center">{t('healthSummaryTitle')}</h2>
        <p className="text-center text-zinc-400 mb-4 text-sm">{t('healthSummaryDescription')}</p>
        
        <div className="bg-zinc-900/50 rounded-md p-4 my-4 min-h-[150px] max-h-60 overflow-y-auto border border-zinc-700">
            {isLoading && <div className="flex items-center justify-center h-full"><LoadingIndicator /></div>}
            {!isLoading && summary && (
                <div className="text-zinc-200">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                            ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 my-2" />,
                            li: ({node, ...props}) => <li {...props} className="pl-2" />,
                        }}
                    >
                        {summary}
                    </ReactMarkdown>
                </div>
            )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <button onClick={onExport} className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors">{t('exportHistory')}</button>
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 bg-zinc-600 rounded-md hover:bg-zinc-500 transition-colors">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

export default HealthSummaryModal;
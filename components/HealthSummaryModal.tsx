import React from 'react';
import type { TranslationKey } from '../translations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HealthSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}

const HealthSummaryModal: React.FC<HealthSummaryModalProps> = ({ isOpen, onClose, summary, isLoading, t }) => {
  if (!isOpen) return null;

  const LoadingIndicator = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
      <span className="ml-3 text-slate-300">{t('loadingSummary')}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900/80 border-slate-700 border rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-2 text-center">{t('healthSummaryTitle')}</h2>
        <p className="text-center text-slate-400 mb-4 text-sm">{t('healthSummaryDescription')}</p>
        
        <div className="bg-slate-800/50 rounded-md p-4 my-4 min-h-[150px] max-h-60 overflow-y-auto border border-slate-700">
            {isLoading && <div className="flex items-center justify-center h-full"><LoadingIndicator /></div>}
            {!isLoading && summary && (
                <div className="text-slate-200">
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

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

export default HealthSummaryModal;
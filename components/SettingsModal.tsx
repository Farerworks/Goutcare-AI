import React, { useRef } from 'react';
import type { TranslationKey } from '../translations';
import { UploadCloudIcon, DownloadCloudIcon, TrashIcon } from './IconComponents';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onReset: () => void;
  t: (key: TranslationKey) => string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onImport, onExport, onReset, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900/80 border-slate-700 border rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-teal-400 mb-4 text-center">{t('settingsTitle')}</h2>
        
        <div className="space-y-4">
          {/* Import */}
          <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700 flex items-center gap-4">
            <UploadCloudIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-200">{t('importHistory')}</h3>
              <p className="text-sm text-slate-400">{t('importHistoryDescription')}</p>
            </div>
            <button
              onClick={handleImportClick}
              className="ml-auto flex-shrink-0 px-4 py-2 bg-sky-600 text-white text-sm rounded-md hover:bg-sky-500 transition-colors"
            >
              {t('importHistory')}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".json"
            />
          </div>

          {/* Export */}
          <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700 flex items-center gap-4">
            <DownloadCloudIcon className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-200">{t('exportHistory')}</h3>
              <p className="text-sm text-slate-400">{t('exportHistoryDescription')}</p>
            </div>
            <button
              onClick={onExport}
              className="ml-auto flex-shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-500 transition-colors"
            >
              {t('exportHistory')}
            </button>
          </div>

          {/* Reset */}
          <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700 flex items-center gap-4">
            <TrashIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-200">{t('resetConversation')}</h3>
              <p className="text-sm text-slate-400">{t('resetConversationDescription')}</p>
            </div>
            <button
              onClick={onReset}
              className="ml-auto flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-500 transition-colors"
            >
              {t('resetChat')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 transition-colors">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
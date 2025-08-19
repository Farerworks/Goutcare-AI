import React, { useState, useEffect, useRef } from 'react';
import type { MedicalRecordEntry, TranslationKey } from '../types';
import { fileToBase64 } from '../utils/imageUtils';
import { ImageIcon, XIcon } from './IconComponents';

interface MedicalRecordManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (entry: MedicalRecordEntry | null) => void;
  t: (key: TranslationKey, substitutions?: Record<string, string | number>) => string;
  selectedDate?: Date | null;
}

const MedicalRecordManager: React.FC<MedicalRecordManagerProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  t, 
  selectedDate 
}) => {
  const [recordType, setRecordType] = useState<MedicalRecordEntry['type']>('blood_test');
  const [doctorName, setDoctorName] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recordTypes: Array<{ value: MedicalRecordEntry['type']; icon: string; label: string }> = [
    { value: 'blood_test', icon: '🩸', label: '혈액검사' },
    { value: 'urine_test', icon: '🧪', label: '소변검사' },
    { value: 'xray', icon: '📷', label: 'X-Ray' },
    { value: 'prescription', icon: '💊', label: '처방전' },
    { value: 'consultation', icon: '👨‍⚕️', label: '진료기록' },
    { value: 'other', icon: '📋', label: '기타' }
  ];

  useEffect(() => {
    if (isOpen) {
      setRecordType('blood_test');
      setDoctorName('');
      setHospitalName('');
      setDiagnosis('');
      setNotes('');
      setAttachments([]);
      setAttachmentPreviews([]);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = [...attachments, ...files];
    setAttachments(newAttachments);

    // Create previews for images
    const newPreviews = await Promise.all(
      files.map((file: File) => {
        return new Promise<string>((resolve) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          } else {
            resolve(''); // Non-image files don't get previews
          }
        });
      })
    );

    setAttachmentPreviews([...attachmentPreviews, ...newPreviews]);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_: File, i: number) => i !== index);
    const newPreviews = attachmentPreviews.filter((_: string, i: number) => i !== index);
    setAttachments(newAttachments);
    setAttachmentPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    // Convert attachments to base64
    const attachmentData = await Promise.all(
      attachments.map(async (file: File) => ({
        mimeType: file.type,
        data: await fileToBase64(file),
        fileName: file.name
      }))
    );

    const entry: MedicalRecordEntry = {
      date: selectedDate || new Date(),
      type: recordType,
      doctorName: doctorName || undefined,
      hospitalName: hospitalName || undefined,
      diagnosis: diagnosis || undefined,
      notes: notes || undefined,
      attachments: attachmentData.length > 0 ? attachmentData : undefined
    };
    
    onComplete(entry);
    
    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem('medicalRecordEntries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('medicalRecordEntries', JSON.stringify(existingEntries));
  };

  const getRecentRecords = (): MedicalRecordEntry[] => {
    const entries = JSON.parse(localStorage.getItem('medicalRecordEntries') || '[]');
    return entries
      .sort((a: MedicalRecordEntry, b: MedicalRecordEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5);
  };

  const recentRecords = getRecentRecords();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">🏥 의료 기록 관리</h2>
        
        {/* Record Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">기록 유형</label>
          <div className="grid grid-cols-3 gap-2">
            {recordTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setRecordType(type.value)}
                className={`p-3 rounded-lg text-center transition-all ${
                  recordType === type.value 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-xs">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hospital & Doctor Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">병원명</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="예: 서울대병원"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">담당의</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="예: 김철수"
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">진단/결과</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            placeholder="예: 통풍성 관절염, 요산 수치 8.5mg/dL"
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">메모</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="추가 메모 사항"
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* File Attachments */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">첨부 파일</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            multiple
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 bg-zinc-700/50 border-2 border-dashed border-zinc-600 rounded-lg hover:bg-zinc-700 hover:border-emerald-500 transition-colors text-zinc-400 hover:text-emerald-400"
          >
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5"/>
              <span className="text-sm">사진 또는 PDF 첨부</span>
            </div>
          </button>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {attachments.map((file: File, idx: number) => (
                <div key={idx} className="relative group">
                  {attachmentPreviews[idx] ? (
                    <img
                      src={attachmentPreviews[idx]}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-20 bg-zinc-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-zinc-400 text-center px-2">
                        {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Records Summary */}
        {recentRecords.length > 0 && (
          <div className="mb-4 p-3 bg-zinc-900/30 rounded-lg">
            <h3 className="text-xs font-semibold text-zinc-400 mb-2">최근 의료 기록</h3>
            <div className="space-y-1">
              {recentRecords.slice(0, 3).map((record, idx) => {
                const typeInfo = recordTypes.find(t => t.value === record.type);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span>{typeInfo?.icon}</span>
                      <span className="text-zinc-500">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-zinc-400">
                      {record.hospitalName || typeInfo?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-600 rounded-lg hover:bg-zinc-500 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordManager;
import React, { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, Link as LinkIcon, X, UploadCloud } from 'lucide-react';

export type AttachmentType = 'image' | 'file' | 'link';

export interface Attachment {
  type: AttachmentType;
  url: string;
  name: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
}

export default function AttachmentManager({ attachments, onChange, maxFiles = 5 }: AttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: AttachmentType) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length + files.length > maxFiles) {
      alert(`Bạn chỉ có thể đính kèm tối đa ${maxFiles} tệp.`);
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onChange([...attachments, {
            type,
            url: evt.target.result as string,
            name: file.name
          }]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleAddLink = () => {
    if (!linkUrl) return;
    onChange([...attachments, {
      type: 'link',
      url: linkUrl,
      name: linkName || linkUrl
    }]);
    setLinkUrl('');
    setLinkName('');
    setShowLinkInput(false);
  };

  const removeAttachment = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6 border-t-4 border-slate-100 pt-6">
      <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Paperclip className="w-5 h-5 text-sky-500" /> Đính kèm tài liệu
      </h4>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl font-semibold hover:bg-sky-100 transition-colors border-2 border-sky-100">
          <ImageIcon className="w-5 h-5" /> Thêm ảnh
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-100 transition-colors border-2 border-emerald-100">
          <UploadCloud className="w-5 h-5" /> Thêm File
        </button>
        <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-semibold hover:bg-amber-100 transition-colors border-2 border-amber-100">
          <LinkIcon className="w-5 h-5" /> Thêm Link
        </button>

        <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={e => handleFileUpload(e, 'image')} />
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" multiple className="hidden" ref={fileInputRef} onChange={e => handleFileUpload(e, 'file')} />
      </div>

      {showLinkInput && (
        <div className="flex gap-2 mb-6 bg-amber-50 p-4 rounded-xl border-2 border-amber-100">
          <input type="url" placeholder="Đường dẫn (URL)..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-amber-200 outline-none focus:ring-2 focus:ring-amber-400" />
          <input type="text" placeholder="Tên hiển thị (tùy chọn)..." value={linkName} onChange={e => setLinkName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-amber-200 outline-none focus:ring-2 focus:ring-amber-400" />
          <button type="button" onClick={handleAddLink} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600">Thêm</button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((att, i) => (
            <div key={i} className="relative group rounded-2xl overflow-hidden border-4 border-slate-100 hover:border-sky-300 transition-colors bg-white shadow-sm flex flex-col aspect-square">
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  {att.type === 'link' ? <LinkIcon className="w-10 h-10 text-amber-400 mb-2" /> : <Paperclip className="w-10 h-10 text-emerald-400 mb-2" />}
                  <span className="text-sm font-bold text-slate-600 line-clamp-2 break-all">{att.name}</span>
                </div>
              )}
              <button type="button" onClick={() => removeAttachment(i)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-md">
                <X className="w-4 h-4 font-bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

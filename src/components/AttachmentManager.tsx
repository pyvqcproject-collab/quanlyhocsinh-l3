import React, { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, Link as LinkIcon, X, Upload } from 'lucide-react';

export type Attachment = {
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
};

interface AttachmentManagerProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  label?: string;
}

export default function AttachmentManager({ attachments, onChange, label = "Đính kèm" }: AttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          onChange([...attachments, { type, url: evt.target.result as string, name: file.name }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    if (linkUrl) {
      onChange([...attachments, { type: 'link', url: linkUrl, name: linkName || linkUrl }]);
      setLinkUrl("");
      setLinkName("");
      setShowLinkInput(false);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    onChange(newAttachments);
  };

  return (
    <div className="mt-4 border-t-2 border-slate-100 pt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-sky-500" /> {label}
        </h4>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-xl font-medium transition-colors border border-sky-100"
          >
            <Upload className="w-4 h-4" /> Tải file/ảnh
          </button>
          <button 
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-medium transition-colors border border-emerald-100"
          >
            <LinkIcon className="w-4 h-4" /> Thêm link
          </button>
        </div>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>

      {showLinkInput && (
        <div className="flex gap-2 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <input 
            type="url" 
            placeholder="URL (https://...)" 
            value={linkUrl} 
            onChange={e => setLinkUrl(e.target.value)} 
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none" 
          />
          <input 
            type="text" 
            placeholder="Tên hiển thị (tùy chọn)" 
            value={linkName} 
            onChange={e => setLinkName(e.target.value)} 
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none" 
          />
          <button type="button" onClick={handleAddLink} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium">Thêm</button>
        </div>
      )}
      
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {attachments.map((att, i) => (
            <div key={i} className="relative group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-sky-300 transition-colors">
              {att.type === 'image' ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                </div>
              ) : att.type === 'link' ? (
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500">
                  <LinkIcon className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-500">
                  <Paperclip className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{att.name}</p>
                <p className="text-xs text-slate-400 uppercase">{att.type}</p>
              </div>
              <button 
                type="button"
                onClick={() => removeAttachment(i)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

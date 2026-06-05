'use client';

import { useRef, useState, useCallback } from 'react';

type Props = {
  paymentId: string;
  onUploaded: (receiptUrl: string) => void;
};

const ACCEPTED = '.jpg,.jpeg,.png,.webp';
const MAX_MB = 10;

export function ReceiptUploader({ paymentId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setError('');

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Зөвхөн JPG, PNG, WEBP форматыг зөвшөөрнө');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Файл хэт том (${(file.size / 1024 / 1024).toFixed(1)} MB). Хамгийн ихдээ ${MAX_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append('paymentId', paymentId);
      form.append('receipt', file);

      const res = await fetch('/api/payment/upload-receipt', { method: 'POST', body: form });
      const data = await res.json() as { ok?: boolean; receiptImage?: string; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Байршуулахад алдаа');
        setPreview(null);
        return;
      }

      onUploaded(data.receiptImage ?? '');
    } catch {
      setError('Сүлжээний алдаа. Дахин оролдоно уу.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [paymentId, onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  }, [upload]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366F1' : '#CBD5E1'}`,
          borderRadius: 12,
          padding: '20px 16px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? '#EEF2FF' : '#F8FAFC',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <div style={{ color: '#6366F1', fontSize: 14 }}>
            <div style={{ marginBottom: 8, fontSize: 24 }}>⏳</div>
            Байршуулж байна…
          </div>
        ) : preview ? (
          <div>
            <img
              src={preview}
              alt="Preview"
              style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
            />
            <div style={{ fontSize: 12, color: '#64748B' }}>Өөр файл сонгох бол дахин дарна уу</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Гүйлгээний баримт байршуулах
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              JPG, PNG, WEBP · Хамгийн ихдээ {MAX_MB} MB
            </div>
            <button
              type="button"
              style={{
                marginTop: 12,
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Файл сонгох
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, color: '#DC2626', fontSize: 12,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

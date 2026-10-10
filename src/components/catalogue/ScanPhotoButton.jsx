import React, { useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function ScanPhotoButton({ onResult }) {
  const inputRef = useRef(null);
  const readerIdRef = useRef(`isbn-photo-reader-${Math.random().toString(36).slice(2)}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    const scanner = new Html5Qrcode(readerIdRef.current, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A],
      verbose: false,
    });
    try {
      const decodedText = await scanner.scanFile(file, false);
      const isbn = decodedText.replace(/[^0-9X]/gi, '');
      if (isbn.length === 10 || isbn.length === 13) onResult(isbn);
      else setError('Photo illisible. Essayez une image plus nette.');
    } catch {
      setError('Aucun ISBN détecté sur cette photo.');
    } finally {
      scanner.clear?.();
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div>
      <div id={readerIdRef.current} className="fixed -left-[9999px] top-0 h-px w-px overflow-hidden" />
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-bordeaux/50 bg-creme px-3 py-2 font-ui text-[10px] uppercase tracking-[1.8px] text-bordeaux transition hover:border-cta hover:text-cta disabled:cursor-wait disabled:opacity-60"
      >
        🖼️ {loading ? 'Analyse…' : 'Photo ISBN'}
      </button>
      {error && <div className="mt-2 text-center font-body text-xs italic text-red-700">{error}</div>}
    </div>
  );
}
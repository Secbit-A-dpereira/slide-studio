'use client';
import { useState, useRef, useCallback } from 'react';

interface UploadZoneProps {
  onAnalyzeImage: (file: File) => void;
  onAnalyzeText: (text: string) => void;
  isLoading: boolean;
}

type Mode = 'image' | 'text';

export function UploadZone({ onAnalyzeImage, onAnalyzeText, isLoading }: UploadZoneProps) {
  const [mode, setMode] = useState<Mode>('text');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState(
    'Cria um slide de apresentação com:\n\nTítulo: Estratégia 2026\n\n• Expansão para 3 novos mercados\n• Lançamento de 2 produtos\n• Objetivo: +30% receita'
  );
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = useCallback(() => {
    if (mode === 'image' && file) onAnalyzeImage(file);
    else if (mode === 'text' && textInput.trim()) onAnalyzeText(textInput);
  }, [mode, file, textInput, onAnalyzeImage, onAnalyzeText]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
  }, []);

  const canSubmit = (mode === 'image' && !!file) || (mode === 'text' && textInput.trim().length > 0);

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            mode === 'text' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Descrever
        </button>
        <button
          onClick={() => setMode('image')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            mode === 'image' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Print
        </button>
      </div>

      {/* Text mode */}
      {mode === 'text' && (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Descreve o slide que queres..."
          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900/20 focus:border-gray-300 transition-all"
        />
      )}

      {/* Image mode */}
      {mode === 'image' && !preview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragOver 
              ? 'border-gray-900 bg-gray-50' 
              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Larga aqui o print</p>
            <p className="text-xs mt-1">ou clica para selecionar ficheiro</p>
          </div>
        </div>
      )}

      {/* Image preview */}
      {mode === 'image' && preview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="Preview" className="w-full max-h-64 object-contain" />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 w-8 h-8 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full flex items-center justify-center transition-all text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleAnalyze}
        disabled={!canSubmit || isLoading}
        className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-subtle" />
            A criar slide...
          </span>
        ) : (
          mode === 'image' ? 'Analisar print' : 'Criar slide'
        )}
      </button>
    </div>
  );
}

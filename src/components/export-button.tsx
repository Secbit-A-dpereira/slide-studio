'use client';

import { useState, useCallback } from 'react';
import type { Slide } from '@/lib/slide/types';
import { generatePptx, downloadPptx } from '@/lib/pptx/generator';

interface ExportButtonProps {
  slide: Slide;
  disabled?: boolean;
}

export function ExportButton({ slide, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (slide.objects.length === 0) return;
    setExporting(true);
    try {
      const pptx = generatePptx(slide);
      await downloadPptx(pptx, 'slide-studio.pptx');
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  }, [slide]);

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting || slide.objects.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
    >
      {exporting ? (
        <><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-subtle" /> A gerar...</>
      ) : (
        <><span className="text-base">↓</span> Exportar PPTX</>
      )}
    </button>
  );
}

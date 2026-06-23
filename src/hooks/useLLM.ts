'use client';
import { useCallback } from 'react';
import type { Slide, SlideObject, AuditReport } from '@/lib/slide/types';

interface AnalyzeResponse {
  success: boolean;
  slide?: Slide;
  auditReport?: AuditReport;
  error?: string;
}

interface EditResponse {
  success: boolean;
  object?: SlideObject;
  error?: string;
}

export function useLLM() {
  const analyzeImage = useCallback(async (file: File, onStep?: (step: string) => void): Promise<AnalyzeResponse> => {
    try {
      if (onStep) onStep('Classificando layout e extraindo conteúdo...');
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to analyze image' };
      }
      
      const reader = res.body?.getReader();
      if (!reader) {
        const data = await res.json();
        if (data.error) return { success: false, error: data.error };
        return { success: true, slide: data.slide, auditReport: data.auditReport };
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.step) {
              if (onStep) onStep(parsed.step);
            }
            if (parsed.slide) {
              finalData = parsed;
            }
            if (parsed.error) {
              return { success: false, error: parsed.error };
            }
          } catch (err) {
            console.error('Error parsing stream line:', err, line);
          }
        }
      }

      if (finalData && finalData.slide) {
        if (onStep) onStep('✅ Réplica concluída!');
        return { success: true, slide: finalData.slide, auditReport: finalData.auditReport };
      }

      return { success: false, error: 'No slide data returned' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  const analyzeText = useCallback(async (text: string, onStep?: (step: string) => void): Promise<AnalyzeResponse> => {
    try {
      if (onStep) onStep('Classificando layout e extraindo conteúdo...');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || 'Failed to analyze text' };
      }
      
      const reader = res.body?.getReader();
      if (!reader) {
        const data = await res.json();
        return { success: true, slide: data.slide, auditReport: data.auditReport };
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.step) {
              if (onStep) onStep(parsed.step);
            }
            if (parsed.slide) {
              finalData = parsed;
            }
          } catch (err) {
            console.error('Error parsing stream line:', err, line);
          }
        }
      }

      if (finalData && finalData.slide) {
        return { success: true, slide: finalData.slide, auditReport: finalData.auditReport };
      }

      return { success: false, error: 'Failed to analyze text' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  const editObject = useCallback(async (
    object: SlideObject,
    prompt: string,
    allObjects: SlideObject[]
  ): Promise<EditResponse> => {
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object, prompt, allObjects }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || 'Failed to edit object' };
      }
      
      const result = await res.json();
      return { success: true, object: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  return { analyzeImage, analyzeText, editObject };
}
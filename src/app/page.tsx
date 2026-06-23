'use client';

import { useCallback, useState } from 'react';
import { UploadZone } from '@/components/upload-zone';
import { SlideCanvas } from '@/components/editor/slide-canvas';
import { ObjectToolbar } from '@/components/editor/object-toolbar';
import { ChatPanel } from '@/components/chat-panel';
import { IconPicker } from '@/components/icon-picker';
import { ExportButton } from '@/components/export-button';
import { useSlide } from '@/hooks/useSlide';
import { useLLM } from '@/hooks/useLLM';
import type { SlideObject } from '@/lib/slide/types';

export default function Home() {
  const slideState = useSlide();
  const llm = useLLM();
  const [isEditing, setIsEditing] = useState(false);

  const handleAnalyzeImage = useCallback(async (file: File) => {
    slideState.setIsLoading(true);
    slideState.setError(null);
    slideState.setSteps([]);
    slideState.setCurrentStep('Iniciando análise...');

    const onStep = (step: string) => {
      slideState.setCurrentStep(step);
      slideState.setSteps(prev => {
        if (prev.includes(step)) return prev;
        return [...prev, step];
      });
    };

    const result = await llm.analyzeImage(file, onStep);
    if (result.success && result.slide) {
      slideState.loadSlide(result.slide, result.auditReport);
    } else {
      slideState.setError(result.error || 'Erro ao analisar imagem');
    }
    slideState.setIsLoading(false);
    slideState.setCurrentStep(null);
  }, [llm, slideState]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    slideState.setIsLoading(true);
    slideState.setError(null);
    slideState.setSteps([]);
    slideState.setCurrentStep('Processando texto...');

    const onStep = (step: string) => {
      slideState.setCurrentStep(step);
      slideState.setSteps(prev => {
        if (prev.includes(step)) return prev;
        return [...prev, step];
      });
    };

    const result = await llm.analyzeText(text, onStep);
    if (result.success && result.slide) {
      slideState.loadSlide(result.slide, result.auditReport);
    } else {
      slideState.setError(result.error || 'Erro ao criar slide');
    }
    slideState.setIsLoading(false);
    slideState.setCurrentStep(null);
  }, [llm, slideState]);

  const handleEditObject = useCallback(async (objectId: string, prompt: string) => {
    const obj = slideState.slide.objects.find(o => o.id === objectId);
    if (!obj) return;
    setIsEditing(true);
    const result = await llm.editObject(obj, prompt, slideState.slide.objects);
    if (result.success && result.object) {
      slideState.replaceObject(result.object);
    } else {
      slideState.setError(result.error || 'Erro ao editar objeto');
    }
    setIsEditing(false);
  }, [llm, slideState]);

  const handleObjectModified = useCallback((id: string, props: Partial<SlideObject>) => {
    slideState.updateObject(id, props);
  }, [slideState]);

  const handleDeleteObject = useCallback((id: string) => {
    slideState.removeObject(id);
  }, [slideState]);

  const handleDuplicateObject = useCallback((obj: SlideObject) => {
    slideState.addObject(obj);
  }, [slideState]);

  const handleSelectIcon = useCallback((objectId: string, iconName: string) => {
    slideState.updateObject(objectId, { iconName });
  }, [slideState]);

  const handleSelectFlaticonIcon = useCallback(
    (objectId: string, iconData: { iconSrc: string; iconName: string }) => {
      slideState.updateObject(objectId, {
        iconSrc: iconData.iconSrc,
        iconName: iconData.iconName,
      });
    },
    [slideState]
  );

  const hasSlide = slideState.slide.objects.length > 0;

  // Safe mapping of offset object IDs for canvas highlighting
  const offsetIds = slideState.auditReport?.offset
    ? (typeof slideState.auditReport.offset[0] === 'string'
        ? (slideState.auditReport.offset as string[])
        : (slideState.auditReport.offset as any[]).map(o => o.id || o))
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#E60000] rounded-full" />
            <h1 className="text-sm font-semibold text-gray-900 tracking-tight">Slide Studio</h1>
          </div>
          <div className="flex items-center gap-3">
            {hasSlide && (
              <>
                <button
                  onClick={slideState.reset}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
                >
                  Novo
                </button>
                <ExportButton slide={slideState.slide} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error toast */}
        {slideState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠</span>
              <span>{slideState.error}</span>
            </div>
            <button onClick={() => slideState.setError(null)} className="text-red-400 hover:text-red-600 ml-3 p-1">✕</button>
          </div>
        )}

        {!hasSlide ? (
          /* Upload state — centered, clean */
          <div className="max-w-md mx-auto mt-16 animate-slide-up">
            {/* Tag */}
            <div className="flex justify-center mb-6">
              <span className="px-3 py-1 text-xs font-medium text-[#E60000] bg-red-50 rounded-full">
                Slide Studio
              </span>
            </div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                O que queres criar?
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Faz upload de um print de slide ou descreve o que queres —<br />
                a IA trata do resto.
              </p>
            </div>
            <UploadZone
              onAnalyzeImage={handleAnalyzeImage}
              onAnalyzeText={handleAnalyzeText}
              isLoading={slideState.isLoading}
            />
          </div>
        ) : (
          /* Editor view — side by side */
          <div className="flex gap-8 animate-fade-in">
            <div className="flex-1 min-w-0 space-y-4">
              {slideState.selectedObject && (
                <div className="animate-fade-in">
                  <ObjectToolbar
                    selectedObject={slideState.selectedObject}
                    onDelete={handleDeleteObject}
                    onDuplicate={handleDuplicateObject}
                  />
                </div>
              )}
              <div className="flex justify-center">
                <SlideCanvas
                  slide={slideState.slide}
                  selectedObjectId={slideState.selectedObjectId}
                  onSelectObject={slideState.setSelectedObjectId}
                  onObjectModified={handleObjectModified}
                  offsetObjectIds={offsetIds}
                />
              </div>
            </div>
            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden sticky top-8">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Editar com IA</h3>
                </div>
                <ChatPanel
                  selectedObject={slideState.selectedObject}
                  onEdit={handleEditObject}
                  isEditing={isEditing}
                />
                {slideState.selectedObject && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <IconPicker
                      selectedObject={slideState.selectedObject}
                      onSelectIcon={handleSelectIcon}
                      onSelectFlaticonIcon={handleSelectFlaticonIcon}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Premium Progress Overlay */}
        {slideState.isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white/95 border border-gray-100 p-8 rounded-3xl max-w-sm w-full shadow-2xl backdrop-blur-xl animate-scale-up space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#E60000] border-t-transparent animate-spin"></div>
                  <span className="text-xl">✨</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">A replicar o seu slide</h3>
                <p className="text-xs text-gray-400">Multi-agent AI a cooperar em tempo real</p>
              </div>

              {/* List of Steps */}
              <div className="space-y-3 pt-2">
                {[
                  "Classificando layout e extraindo conteúdo...",
                  "Processando resultados...",
                  "✅ Réplica concluída!"
                ].map((step, idx) => {
                  const isCompleted = slideState.steps.includes(step);
                  const isCurrent = slideState.currentStep === step;

                  return (
                    <div key={idx} className="flex items-center gap-3 transition-all duration-300">
                      {isCompleted ? (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-50 text-green-600 text-xs font-bold">✓</span>
                      ) : isCurrent ? (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-50 text-[#E60000] text-xs animate-pulse font-bold">●</span>
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 text-gray-300 text-xs font-bold">•</span>
                      )}
                      <span className={`text-sm ${isCompleted ? 'text-gray-500 line-through decoration-gray-300' : isCurrent ? 'text-gray-900 font-medium animate-pulse' : 'text-gray-300'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}

                {/* Dynamic Adjusting/Retry Step */}
                {slideState.currentStep && (slideState.currentStep.startsWith("A ajustar") || slideState.currentStep.startsWith("⚠️ Ajustando")) && (
                  <div className="flex items-center gap-3 transition-all duration-300 animate-pulse border-t border-gray-100 pt-3">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 text-xs font-bold">⚠</span>
                    <span className="text-sm text-amber-600 font-semibold">
                      {slideState.currentStep}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

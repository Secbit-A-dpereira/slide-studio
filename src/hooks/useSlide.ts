'use client';
import { useState, useCallback } from 'react';
import type { Slide, SlideObject, AuditReport } from '@/lib/slide/types';
import { DEFAULT_SLIDE } from '@/lib/slide/defaults';

export function useSlide() {
  const [slide, setSlide] = useState<Slide>(DEFAULT_SLIDE);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const selectedObject = selectedObjectId 
    ? slide.objects.find(o => o.id === selectedObjectId) ?? null
    : null;

  const loadSlide = useCallback((newSlide: Slide, newAuditReport?: AuditReport) => {
    setSlide(newSlide);
    setSelectedObjectId(null);
    setAuditReport(newAuditReport || null);
    setError(null);
  }, []);

  const updateObject = useCallback((objectId: string, updates: Partial<SlideObject>) => {
    setSlide(prev => ({
      ...prev,
      objects: prev.objects.map(obj => 
        obj.id === objectId ? { ...obj, ...updates } : obj
      ),
    }));
  }, []);

  const replaceObject = useCallback((newObj: Partial<SlideObject> & { id: string }) => {
    setSlide(prev => ({
      ...prev,
      objects: prev.objects.map(obj => 
        obj.id === newObj.id ? { ...obj, ...newObj } : obj
      ),
    }));
  }, []);

  const removeObject = useCallback((objectId: string) => {
    setSlide(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== objectId),
    }));
    setSelectedObjectId(prev => prev === objectId ? null : prev);
  }, []);

  const addObject = useCallback((obj: SlideObject) => {
    setSlide(prev => ({
      ...prev,
      objects: [...prev.objects, obj],
    }));
  }, []);

  const reset = useCallback(() => {
    setSlide(DEFAULT_SLIDE);
    setSelectedObjectId(null);
    setAuditReport(null);
    setError(null);
    setCurrentStep(null);
    setSteps([]);
  }, []);

  return {
    slide,
    layoutType: slide.layoutType,
    layoutContent: slide.layoutContent,
    selectedObjectId,
    selectedObject,
    auditReport,
    setAuditReport,
    isLoading,
    setIsLoading,
    error,
    setError,
    setSelectedObjectId,
    loadSlide,
    updateObject,
    replaceObject,
    removeObject,
    addObject,
    reset,
    currentStep,
    setCurrentStep,
    steps,
    setSteps,
  };
}
'use client';

import { useState, useCallback } from 'react';
import type { SlideObject } from '@/lib/slide/types';

interface ChatPanelProps {
  selectedObject: SlideObject | null;
  onEdit: (objectId: string, prompt: string) => Promise<void>;
  isEditing: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Melhorar', prompt: 'Improve this text — make it more professional and clear' },
  { label: 'Bold', prompt: 'Make this text bold' },
  { label: 'Reduzir', prompt: 'Reduce the font size slightly' },
  { label: 'Vermelho', prompt: 'Change the color to Vodafone red (#E60000)' },
  { label: 'Maior', prompt: 'Make this element bigger' },
];

export function ChatPanel({ selectedObject, onEdit, isEditing }: ChatPanelProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(async (p: string) => {
    if (!selectedObject || !p.trim() || isEditing) return;
    await onEdit(selectedObject.id, p.trim());
    setPrompt('');
  }, [selectedObject, onEdit, isEditing]);

  const handleQuickAction = useCallback(async (actionPrompt: string) => {
    if (!selectedObject || isEditing) return;
    await onEdit(selectedObject.id, actionPrompt);
  }, [selectedObject, onEdit, isEditing]);

  if (!selectedObject) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <p className="text-sm text-gray-400 font-medium">Seleciona um objeto</p>
        <p className="text-xs text-gray-300 mt-1">clica no slide para editar com IA</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Object info */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E60000] bg-red-50 px-2 py-0.5 rounded-md">
            {selectedObject.type}
          </span>
          <span className="text-xs text-gray-400 truncate">
            {selectedObject.text?.slice(0, 40) || selectedObject.iconName || selectedObject.shapeType || 'objeto'}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Ações rápidas</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isEditing}
              className="px-3 py-1.5 text-xs bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Comando personalizado</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: muda para azul escuro..."
          className="w-full h-20 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900/20 transition-all"
        />
        <button
          onClick={() => handleSubmit(prompt)}
          disabled={!prompt.trim() || isEditing}
          className="mt-2.5 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isEditing ? 'A editar...' : 'Aplicar'}
        </button>
      </div>
    </div>
  );
}

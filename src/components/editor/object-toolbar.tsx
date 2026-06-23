'use client';

import type { SlideObject } from '@/lib/slide/types';

interface ObjectToolbarProps {
  selectedObject: SlideObject | null;
  onDelete: (id: string) => void;
  onDuplicate: (obj: SlideObject) => void;
}

export function ObjectToolbar({ selectedObject, onDelete, onDuplicate }: ObjectToolbarProps) {
  if (!selectedObject) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <span className="text-xs text-gray-500 mr-2">
        {selectedObject.type}
      </span>
      <button
        onClick={() => onDuplicate({ ...selectedObject, id: crypto.randomUUID(), x: selectedObject.x + 20, y: selectedObject.y + 20 })}
        className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
        title="Duplicar"
      >
        📋 Duplicar
      </button>
      <button
        onClick={() => onDelete(selectedObject.id)}
        className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200"
        title="Eliminar"
      >
        🗑️ Eliminar
      </button>
    </div>
  );
}
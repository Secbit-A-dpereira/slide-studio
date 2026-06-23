'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { SlideObject } from '@/lib/slide/types';

interface FlaticonResult {
  id: string;
  name: string;
  cdnUrl: string;
  thumbnailUrl: string;
}

// Common Lucide icons for presentations (local fallback)
const COMMON_ICONS = [
  'chart', 'chart-bar', 'chart-pie', 'trending-up', 'trending-down',
  'star', 'heart', 'check', 'check-circle', 'x-circle',
  'alert-circle', 'info', 'help-circle', 'lightbulb',
  'mail', 'phone', 'map-pin', 'clock', 'calendar',
  'users', 'user', 'user-plus', 'settings', 'search',
  'download', 'upload', 'share', 'link', 'external-link',
  'file-text', 'folder', 'bookmark', 'tag', 'flag',
  'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
  'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
  'plus', 'minus', 'more-horizontal', 'more-vertical',
  'globe', 'target', 'zap', 'shield', 'lock',
];

interface IconPickerProps {
  selectedObject: SlideObject | null;
  onSelectIcon: (objectId: string, iconName: string) => void;
  /** Called when user picks a real PNG icon from Flaticon */
  onSelectFlaticonIcon?: (objectId: string, iconData: { iconSrc: string; iconName: string }) => void;
}

export function IconPicker({ selectedObject, onSelectIcon, onSelectFlaticonIcon }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [flaticonResults, setFlaticonResults] = useState<FlaticonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return COMMON_ICONS;
    const q = search.toLowerCase();
    return COMMON_ICONS.filter(name => name.includes(q));
  }, [search]);

  // Search Flaticon when user stops typing
  const searchFlaticon = useCallback(async (q: string) => {
    if (!q.trim()) {
      setFlaticonResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/icons/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.icons) {
        setFlaticonResults(data.icons.slice(0, 20));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchFlaticon(val), 500);
  };

  const handleFlaticonPick = (icon: FlaticonResult) => {
    if (!selectedObject || !onSelectFlaticonIcon) return;
    // Convert CDN URL to base64 via proxy so it works offline and in PPTX
    fetch(`/api/icons/download?id=${icon.id}&size=512`)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          onSelectFlaticonIcon(selectedObject.id, {
            iconSrc: reader.result as string, // base64 data URL
            iconName: icon.name,
          });
        };
        reader.readAsDataURL(blob);
      });
  };

  if (!selectedObject || selectedObject.type !== 'icon') return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-medium">Icones</p>

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Pesquisar na Flaticon..."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Flaticon results */}
      {loading && (
        <p className="text-xs text-gray-400 italic">A pesquisar na Flaticon...</p>
      )}

      {flaticonResults.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Flaticon:</p>
          <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-1">
            {flaticonResults.map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleFlaticonPick(icon)}
                className={`p-1 rounded border transition-all hover:border-blue-400 hover:shadow-sm ${
                  selectedObject.iconSrc?.includes(icon.id)
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200'
                }`}
                title={icon.name}
              >
                <img
                  src={`/api/icons/download?id=${icon.id}&size=128`}
                  alt={icon.name}
                  className="w-8 h-8 object-contain mx-auto"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lucide icons (local fallback) */}
      <div>
        <p className="text-xs text-gray-400 mb-1">Lucide:</p>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {filteredIcons.map((name) => (
            <button
              key={name}
              onClick={() => onSelectIcon(selectedObject.id, name)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedObject.iconName === name && !selectedObject.iconSrc
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
              title={name}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

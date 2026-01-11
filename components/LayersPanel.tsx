/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Layer } from '../types';
import { EyeIcon, TrashIcon } from './icons';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: number | null;
  onSetActiveLayer: (id: number) => void;
  onSetVisibility: (id: number, visible: boolean) => void;
  onDeleteLayer: (id: number) => void;
  onMoveLayer: (id: number, direction: 'up' | 'down') => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSetActiveLayer,
  onSetVisibility,
  onDeleteLayer,
  onMoveLayer,
}) => {
  const { t } = useLanguage();
  const reversedLayers = [...layers].reverse();

  return (
    <div className="w-full flex flex-col gap-2 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('layersPanel.title')}</h3>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
        {reversedLayers.map((layer, reverseIndex) => {
          const originalIndex = layers.length - 1 - reverseIndex;
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSetActiveLayer(layer.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500'
                  : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={layer.imageUrl}
                alt={layer.name}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-gray-200 checkerboard-bg"
              />
              <span
                className={`flex-grow text-sm font-semibold truncate ${
                  isActive ? 'text-indigo-800' : 'text-gray-700'
                }`}
              >
                {layer.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onSetVisibility(layer.id, !layer.visible); }}
                    data-tooltip={t('layersPanel.toggleVisibility')}
                    className={`p-1 rounded-full ${layer.visible ? 'text-gray-600 hover:bg-gray-200' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                    <EyeIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                    disabled={layers.length <= 1}
                    data-tooltip={t('layersPanel.delete')}
                    className="p-1 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayersPanel;
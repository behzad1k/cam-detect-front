'use client';

import { Camera } from '@/types';
import { useState } from 'react';
import { Settings, X } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  color: string;
}

interface FloatingControlsProps {
  selectedModels: string[];
  onModelToggle: (modelId: string) => void;
  availableModels: Model[];
  availableCameras: Camera[];
  selectedCamera: Camera;
  setSelectedCamera: React.Dispatch<React.SetStateAction<Camera>>
}

export default function FloatingControls({
   selectedModels,
   onModelToggle,
   availableModels,
   availableCameras,
   selectedCamera,
   setSelectedCamera,
 }: FloatingControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-20">
      {/* Settings Toggle Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg ${
          showSettings
            ? 'bg-blue-500/90 text-white'
            : 'bg-black/60 text-white hover:bg-black/80'
        }`}
      >
        {showSettings ? <X size={20} /> : <Settings size={20} />}
      </button>

      {/* Model Selection Panel */}
      {showSettings && (
        <div className="mt-3 p-4 bg-black/90 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl min-w-[200px]">
          <h3 className="text-white font-semibold mb-3 text-sm">Detection Models</h3>
          <div className="space-y-3">
            {availableModels.map((model) => (
              <label
                key={model.id}
                className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => onModelToggle(model.id)}
                  className="w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: model.color }}
                />
                <span className="text-white text-sm flex-1">{model.name}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
              </label>
            ))}
          </div>
          <h3 className="text-white font-semibold mb-3 text-sm border-t border-t-amber-700 mt-2 pt-1">Camera</h3>
          <form className="space-y-3">

            {availableCameras.map((model) => (
              <label
                key={model.slug}
                className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  checked={selectedCamera.slug === model.slug}
                  onChange={() => setSelectedCamera(model)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-white text-sm flex-1">{model.title}</span>
                <div
                  className="w-3 h-3 rounded-full"
                />
              </label>
            ))}

          </form>

          {selectedModels.length === 0 && (
            <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-xs">
                Select at least one model to start detection
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { Camera, ModelInfo } from '@/types';
import { AVAILABLE_MODELS } from '@/types/constants';
import { useState } from 'react';
import { Settings, X, ChevronDown, ChevronRight, Filter, Loader2 } from 'lucide-react';

interface FloatingControlsProps {
  selectedModels: any;
  availableCameras: Camera[];
  selectedCamera: Camera;
  setSelectedCamera: (camera: Camera) => void;
  availableClasses: Record<string, string[]>;
  getModelClassFilter: (modelName: string) => string[];
  models: ModelInfo[];
  onLoadModel: (modelName: string) => Promise<boolean>;
  onClassToggle: (modelId: string, className: string) => void;
}

export default function FloatingControls({
                                           selectedModels,
                                           availableCameras,
                                           selectedCamera,
                                           setSelectedCamera,
                                           availableClasses,
                                           getModelClassFilter,
                                           models,
                                           onLoadModel,
  onClassToggle
                                         }: FloatingControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());

  const toggleModelExpansion = async (modelId: string) => {
    await handleModelToggle(modelId);
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelId)) {
      newExpanded.delete(modelId);
    } else {
      newExpanded.add(modelId);
    }
    setExpandedModels(newExpanded);
  };

  const handleModelToggle = async (modelId: string) => {
    // If model is being selected and not loaded, load it first
      const modelInfo = models.find(m => m.name === modelId);
      if (modelInfo && !modelInfo.loaded) {
        setLoadingModels(prev => new Set(prev).add(modelId));
        try {
          await onLoadModel(modelId);
        } catch (error) {
          console.error(`Failed to load model ${modelId}:`, error);
        } finally {
          setLoadingModels(prev => {
            const newSet = new Set(prev);
            newSet.delete(modelId);
            return newSet;
          });
        }
      }

    // onModelToggle(modelId);
  };

  const getModelStatus = (modelId: string) => {
    const modelInfo = models?.find(m => m.name === modelId);
    if (loadingModels.has(modelId)) return 'loading';
    if (!modelInfo) return 'unknown';
    if (!modelInfo.loaded) return 'not-loaded';
    return 'loaded';
  };

  const getFilterSummary = (modelId: string) => {
    const filter = getModelClassFilter(modelId);
    const totalClasses = availableClasses[modelId]?.length || 0;

    if (filter.length === 0) return 'All classes';
    if (filter.length === totalClasses) return 'All classes';
    return `${filter.length}/${totalClasses} classes`;
  };

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

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-3 p-4 bg-black/90 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl min-w-[320px] max-w-[400px] max-h-[80vh] overflow-y-auto">
          <h3 className="text-white font-semibold mb-3 text-sm">Detection Models</h3>

          <div className="space-y-2">
            {AVAILABLE_MODELS.map((model) => {
              const isExpanded = expandedModels.has(model.id);
              const modelStatus = getModelStatus(model.id);
              //@ts-ignore
              const hasClasses = availableClasses[model.id]?.length > 0
              const currentFilter = getModelClassFilter(model.id);

              return (
                <div key={model.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Model Header */}
                  <div className="flex items-center p-3 hover:bg-white/5 transition-colors">
                    {/* Model Checkbox */}
                    <label className="flex items-center space-x-3 cursor-pointer flex-1" htmlFor={model.id + '_expand'}>
                      <div className="relative">
                        {modelStatus === 'loading' && (
                          <Loader2 className="absolute -top-1 -left-1 w-6 h-6 animate-spin text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white text-sm font-medium">{model.name}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: model.color }}
                          />
                        </div>

                        {/* Model Status */}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            modelStatus === 'loaded'
                              ? 'bg-green-500/20 text-green-300'
                              : modelStatus === 'loading'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {modelStatus === 'loaded' ? 'Loaded' :
                              modelStatus === 'loading' ? 'Loading...' : 'Not Loaded'}
                          </span>

                          {hasClasses && (
                            <span className="text-xs text-gray-400 flex items-center space-x-1" >
                              <Filter size={12} />
                              <span>{getFilterSummary(model.id)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Expand Button */}
                      <button
                        id={model.id + '_expand'}
                        onClick={() => toggleModelExpansion(model.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </button>
                  </div>

                  {/* Class Filter Section */}
                  {isExpanded && hasClasses && (
                    <div className="border-t border-white/10 p-3 bg-white/5">
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {availableClasses[model.id]?.map((className) => (
                          <label
                            key={className}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={currentFilter.includes(className)}
                              onChange={() => onClassToggle(model.id, className)}
                              className="w-3 h-3 rounded"
                              style={{ accentColor: model.color }}
                            />
                            <span className="text-gray-300 truncate" title={className}>
                              {className}
                            </span>
                          </label>
                        ))}
                      </div>

                      {currentFilter.length === 0 && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                          All classes will be detected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Camera Selection */}
          <div className="border-t border-white/20 mt-4 pt-4">
            <h3 className="text-white font-semibold mb-3 text-sm">Camera</h3>
            <div className="space-y-2">
              {availableCameras.map((camera) => (
                <label
                  key={camera.slug}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    checked={selectedCamera.slug === camera.slug}
                    onChange={() => setSelectedCamera(camera)}
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm flex-1">{camera.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Warning Messages */}
          {selectedModels.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-xs">
                Select at least one model to start detection
              </p>
            </div>
          )}

          {selectedModels.some((modelId: string) => getModelStatus(modelId) === 'not-loaded') && (
            <div className="mt-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-xs">
                Some models need to be loaded. They will load automatically when selected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

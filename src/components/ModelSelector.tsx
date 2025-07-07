import React from 'react';
import { ModelOption } from '@/types/detection';

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModels: string[];
  onModelToggle: (modelId: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
                                                       models,
                                                       selectedModels,
                                                       onModelToggle,
                                                       className = ''
                                                     }) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Select Detection Models:</h3>
      <div className="flex flex-wrap gap-4">
        {models.map((model) => (
          <label key={model.id} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedModels.includes(model.name)}
              onChange={() => onModelToggle(model.name)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">{model.label}</span>
            {model.color && (
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: model.color }}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;

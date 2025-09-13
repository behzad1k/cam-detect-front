import { ClassModelMapper } from '@/utils/classModelMapper';
import { getCategoryColor } from '@/utils'
import React, { useState } from 'react';
import { MultiSelect } from './MultiSelect';
import {
  ALL_CLASSES,
  CLASSES_BY_CATEGORY,
  QUICK_SELECTION_PRESETS,
  MODEL_DEFINITIONS
} from '@/utils/modelDefinitions';

interface UnifiedClassSelectorProps {
  selectedClasses: string[];
  onClassesChange: (classes: string[]) => void;
  disabled?: boolean;
  showModelInfo?: boolean;
}

export const UnifiedClassSelector: React.FC<UnifiedClassSelectorProps> = ({
                                                                            selectedClasses,
                                                                            onClassesChange,
                                                                            disabled = false,
                                                                            showModelInfo = true
                                                                          }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredClasses = React.useMemo(() => {
    let classes = selectedCategory === 'all'
      ? ALL_CLASSES
      : CLASSES_BY_CATEGORY[selectedCategory] || [];

    if (searchTerm) {
      classes = classes.filter(cls =>
        cls.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return classes;
  }, [searchTerm, selectedCategory]);

  const requiredModels = React.useMemo(() => {
    return ClassModelMapper.getRequiredModels(selectedClasses);
  }, [selectedClasses]);

  const modelInfo = React.useMemo(() => {
    return ClassModelMapper.getModelInfo(selectedClasses);
  }, [selectedClasses]);

  const totalEstimatedRAM = React.useMemo(() => {
    return modelInfo.reduce((total, info) => {
      const ramNum = parseFloat(info.estimatedRAM.replace(/[^\d.]/g, ''));
      return total + ramNum;
    }, 0);
  }, [modelInfo]);

  const applyPreset = (presetName: string) => {
    const presetClasses = QUICK_SELECTION_PRESETS[presetName] || [];
    onClassesChange(presetClasses);
  };

  return (
    <div className="unified-class-selector">
      <h4>Detection Classes Selection</h4>

      {/* Quick Presets */}
      <div className="presets-section">
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
          Quick Presets:
        </label>
        <div className="presets-grid">
          {Object.keys(QUICK_SELECTION_PRESETS).map(presetName => (
            <button
              key={presetName}
              onClick={() => applyPreset(presetName)}
              disabled={disabled}
              className="preset-btn"
              title={`Classes: ${QUICK_SELECTION_PRESETS[presetName].slice(0, 5).join(', ')}${QUICK_SELECTION_PRESETS[presetName].length > 5 ? '...' : ''}`}
            >
              {presetName}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="filters-section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={disabled}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="all">All Categories</option>
            {Object.keys(CLASSES_BY_CATEGORY).map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Selection */}
      <div className="class-selection-section">
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
          Select Classes to Detect:
          <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
            ({selectedClasses.length} selected from {filteredClasses.length} available)
          </span>
        </label>

        <MultiSelect
          options={filteredClasses}
          selected={selectedClasses}
          onChange={onClassesChange}
          placeholder="Select classes to detect..."
          disabled={disabled}
          maxHeight="250px"
        />
      </div>

      {/* Selected Classes Summary */}
      {selectedClasses.length > 0 && (
        <div className="selection-summary">
          <h5>Selected Classes ({selectedClasses.length}):</h5>
          <div className="selected-classes-grid">
            {selectedClasses.map(className => {
              const modelName = ClassModelMapper.getClassModel(className);
              const model = MODEL_DEFINITIONS[modelName];

              return (
                <div key={className} className="selected-class-item">
                  <span className="class-name">{className}</span>
                  <span
                    className="model-indicator"
                    style={{
                      backgroundColor: getCategoryColor(model?.category || 'detection'),
                      color: 'white'
                    }}
                    title={`Model: ${modelName} (${model?.estimatedRAM})`}
                  >
                    {modelName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Models Info */}
      {showModelInfo && requiredModels.length > 0 && (
        <div className="models-info-section">
          <h5>
            Required Models ({requiredModels.length})
            <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '10px', color: '#666' }}>
              Estimated RAM: {totalEstimatedRAM.toFixed(0)}MB
            </span>
          </h5>

          <div className="models-grid">
            {modelInfo.map(({ modelName, classes, description, estimatedRAM }) => (
              <div key={modelName} className="model-info-card">
                <div className="model-info-header">
                  <strong>{modelName}</strong>
                  <span className="ram-badge">{estimatedRAM}</span>
                </div>
                <div className="model-description">{description}</div>
                <div className="model-classes">
                  <strong>Classes needed:</strong> {classes.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .unified-class-selector {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .unified-class-selector h4 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .presets-section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #ddd;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }

        .preset-btn {
          padding: 8px 12px;
          font-size: 12px;
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #2196f3;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .preset-btn:hover:not(:disabled) {
          background: #2196f3;
          color: white;
        }

        .preset-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filters-section {
          margin-bottom: 15px;
        }

        .class-selection-section {
          margin-bottom: 20px;
        }

        .selection-summary {
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .selection-summary h5 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .selected-classes-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .selected-class-item {
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 15px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }

        .class-name {
          padding: 4px 8px;
          font-size: 12px;
          color: #333;
        }

        .model-indicator {
          padding: 4px 8px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .models-info-section {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .models-info-section h5 {
          margin: 0 0 15px 0;
          color: #333;
          display: flex;
          align-items: center;
        }

        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
        }

        .model-info-card {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }

        .model-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .ram-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: bold;
        }

        .model-description {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          font-style: italic;
        }

        .model-classes {
          font-size: 11px;
          color: #555;
        }

        @media (max-width: 768px) {
          .presets-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters-section > div {
            flex-direction: column;
          }

          .models-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

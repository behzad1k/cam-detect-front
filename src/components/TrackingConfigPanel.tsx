import { DEFAULT_DETECTION_CONFIG } from '@/types/constants';
import React, { useState, useEffect } from 'react';
import { UnifiedClassSelector } from './UnifiedClassSelector';
import { ClassModelMapper } from '@/utils/classModelMapper';

interface SimplifiedTrackingConfigPanelProps {
  onConfigChange: (config: any) => void;
  initialConfig?: any;
  disabled?: boolean;
}

export const TrackingConfigPanel: React.FC<SimplifiedTrackingConfigPanelProps> = ({
                                                                                              onConfigChange,
                                                                                              initialConfig = {},
                                                                                              disabled = false
                                                                                            }) => {
  const [config, setConfig] = useState({
    tracker_type: 'centroid',
    max_disappeared: 30,
    max_distance: 100,
    use_kalman: true,
    fps: DEFAULT_DETECTION_CONFIG.fps,
    pixel_to_meter_ratio: 1.0,
    ...initialConfig
  });

  const [selectedClasses, setSelectedClasses] = useState<string[]>(['person']);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Automatically generate models configuration from selected classes
  useEffect(() => {
    const requiredModels = ClassModelMapper.getRequiredModels(selectedClasses);

    onConfigChange({
      trackingConfig: config,
      models: requiredModels,
      selectedClasses: selectedClasses
    });
  }, [config, selectedClasses, onConfigChange]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleClassesChange = (classes: string[]) => {
    setSelectedClasses(classes);
  };

  const validation = ClassModelMapper.validateClasses(selectedClasses);
  const requiredModels = ClassModelMapper.getRequiredModels(selectedClasses);

  return (
    <div className="simplified-config-panel">
      <h3>Detection Configuration</h3>

      {/* Class Selection - Main Feature */}
      <UnifiedClassSelector
        selectedClasses={selectedClasses}
        onClassesChange={handleClassesChange}
        disabled={disabled}
        showModelInfo={true}
      />

      {/* Validation Warnings */}
      {validation.invalid.length > 0 && (
        <div className="validation-warning">
          ⚠️ Unknown classes: {validation.invalid.join(', ')}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-info">
          💡 {validation.warnings.join(' ')}
        </div>
      )}

      {/* Quick Settings */}
      <div className="config-section">
        <h4>Quick Settings</h4>

        <div className="quick-settings-grid">
          <label>
            <strong>Processing Speed:</strong>
            <select
              value={config.fps}
              onChange={(e) => handleConfigChange('fps', parseInt(e.target.value))}
              disabled={disabled}
              style={{ marginTop: '5px', padding: '5px', width: '100%' }}
            >
              <option value={10}>Slow (10 FPS) - Better accuracy</option>
              <option value={15}>Balanced (15 FPS) - Recommended</option>
              <option value={30}>Fast (30 FPS) - Real-time</option>
              <option value={60}>Very Fast (60 FPS) - High performance needed</option>
            </select>
          </label>

          <label>
            <strong>Tracking Sensitivity:</strong>
            <select
              value={config.max_distance}
              onChange={(e) => handleConfigChange('max_distance', parseInt(e.target.value))}
              disabled={disabled}
              style={{ marginTop: '5px', padding: '5px', width: '100%' }}
            >
              <option value={50}>High (50px) - Strict tracking</option>
              <option value={100}>Medium (100px) - Balanced</option>
              <option value={150}>Low (150px) - Loose tracking</option>
            </select>
          </label>

          <label>
            <strong>Object Persistence:</strong>
            <select
              value={config.max_disappeared}
              onChange={(e) => handleConfigChange('max_disappeared', parseInt(e.target.value))}
              disabled={disabled}
              style={{ marginTop: '5px', padding: '5px', width: '100%' }}
            >
              <option value={15}>Short (15 frames) - Quick cleanup</option>
              <option value={30}>Medium (30 frames) - Balanced</option>
              <option value={60}>Long (60 frames) - Keep objects longer</option>
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={config.use_kalman}
              onChange={(e) => handleConfigChange('use_kalman', e.target.checked)}
              disabled={disabled}
            />
            <strong>Smart Prediction</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>(Kalman Filter)</span>
          </label>
        </div>
      </div>

      {/* Advanced Settings (Collapsible) */}
      <div className="config-section">
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="advanced-toggle"
          type="button"
        >
          <span>{showAdvancedSettings ? '▼' : '▶'}</span>
          Advanced Settings
        </button>

        {showAdvancedSettings && (
          <div className="advanced-settings">
            <div className="advanced-grid">
              <label>
                <strong>Tracker Algorithm:</strong>
                <select
                  value={config.tracker_type}
                  onChange={(e) => handleConfigChange('tracker_type', e.target.value)}
                  disabled={disabled}
                  style={{ marginTop: '5px', padding: '5px', width: '100%' }}
                >
                  <option value="centroid">Centroid (Fast, Good)</option>
                  <option value="kalman">Kalman (Medium, Better)</option>
                  <option value="deep_sort">DeepSORT (Slow, Best)</option>
                  <option value="byte_track">ByteTrack (Fast, Advanced)</option>
                </select>
              </label>

              <label>
                <strong>Pixel to Meter Ratio:</strong>
                <input
                  type="number"
                  step="0.01"
                  value={config.pixel_to_meter_ratio}
                  onChange={(e) => handleConfigChange('pixel_to_meter_ratio', parseFloat(e.target.value))}
                  disabled={disabled}
                  min="0.001"
                  max="10"
                  style={{ marginTop: '5px', padding: '5px', width: '100%' }}
                />
                <small style={{ color: '#666' }}>For speed calculations (1 pixel = X meters)</small>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="config-summary">
        <h5>Current Configuration</h5>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Classes Selected:</strong> {selectedClasses.length}
          </div>
          <div className="summary-item">
            <strong>Models Required:</strong> {requiredModels.length}
          </div>
          <div className="summary-item">
            <strong>Processing:</strong> {config.fps} FPS
          </div>
          <div className="summary-item">
            <strong>Tracker:</strong> {config.tracker_type}
          </div>
        </div>

        {requiredModels.length > 0 && (
          <div className="models-summary">
            <strong>Auto-detected models:</strong>
            <div className="models-list">
              {requiredModels.map(({ name, classFilter }) => (
                <span key={name} className="model-tag">
                  {name} ({classFilter.length} classes)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
          .simplified-config-panel {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              overflow: auto;
              height: 60%;
          }

          .simplified-config-panel h3 {
              margin: 0 0 20px 0;
              color: #333;
          }

          .validation-warning {
              background: #ffebee;
              color: #c62828;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 15px;
              font-size: 14px;
              border-left: 4px solid #f44336;
          }

          .validation-info {
              background: #e3f2fd;
              color: #1565c0;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 15px;
              font-size: 14px;
              border-left: 4px solid #2196f3;
          }

          .config-section {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #ddd;
          }

          .config-section:last-child {
              border-bottom: none;
          }

          .config-section h4 {
              margin: 0 0 15px 0;
              color: #333;
          }

          .quick-settings-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
          }

          .quick-settings-grid label {
              display: block;
              color: #555;
          }

          .quick-settings-grid small {
              display: block;
              margin-top: 2px;
              font-style: italic;
              color: #888;
          }

          .advanced-toggle {
              background: none;
              border: none;
              padding: 8px 0;
              cursor: pointer;
              font-size: 14px;
              color: #2196f3;
              display: flex;
              align-items: center;
              gap: 8px;
          }

          .advanced-toggle:hover {
              color: #1976d2;
          }

          .advanced-settings {
              margin-top: 15px;
              padding: 15px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
          }

          .advanced-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
          }

          .advanced-grid label {
              display: block;
              color: #555;
          }

          .config-summary {
              background: white;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
          }

          .config-summary h5 {
              margin: 0 0 10px 0;
              color: #333;
          }

          .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 10px;
              margin-bottom: 10px;
          }

          .summary-item {
              font-size: 12px;
              color: #666;
          }

          .models-summary {
              font-size: 12px;
              color: #666;
          }

          .models-list {
              margin-top: 5px;
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
          }

          .model-tag {
              background: #e3f2fd;
              color: #1976d2;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 11px;
          }

          @media (max-width: 768px) {
              .quick-settings-grid {
                  grid-template-columns: 1fr;
              }

              .advanced-grid {
                  grid-template-columns: 1fr;
              }

              .summary-grid {
                  grid-template-columns: repeat(2, 1fr);
              }
          }
      `}</style>
    </div>
  );
};

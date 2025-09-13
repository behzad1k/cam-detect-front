"use client"
import React, { useState, useCallback } from 'react';
import { EnhancedCamera } from '@/components/EnhancedCamera';
import { TrackingConfigPanel } from '@/components/TrackingConfigPanel';
import { TrackingDashboard } from '@/components/TrackingDashboard';
import { ApiHealthIndicator } from '@/components/ApiHealthIndicator';
import { useTracking } from '@/hooks/useTracking';

const TrackingPage: React.FC = () => {
  const [config, setConfig] = useState({
    trackingConfig: {
      tracker_type: 'centroid' as const,
      max_disappeared: 30,
      max_distance: 100,
      use_kalman: true,
      fps: 5, // Start with lower FPS for better performance
      pixel_to_meter_ratio: 10000
    },
    models: [
      { name: 'PPE', classFilter: ['person'] }
    ],
    selectedClasses: ['person']
  });

  const [visualConfig, setVisualConfig] = useState({
    showBoundingBoxes: true,
    showTrajectories: true,
    showVelocityVectors: true,
    showZones: true,
    showObjectInfo: true,
    showSpeedInfo: true
  });

  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);

  // Use the tracking hook for state management
  const {
    isConnected,
    isTracking,
    statistics,
    trackedObjects,
    zoneOccupancy,
    detections,
    error,
    startTracking,
    stopTracking,
    clearError,
    configure
  } = useTracking({
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    autoConnect: true,
    trackingConfig: config.trackingConfig,
    models: config.models
  });

  const handleConfigChange = useCallback((newConfig: any) => {
    console.log('New config:', newConfig);
    setConfig(newConfig);

    if (isConnected) {
      configure(newConfig.trackingConfig);
    }
  }, [isConnected, configure]);

  const handleDetection = useCallback((detections: any[]) => {
    console.log(`Detections: ${detections.length} objects`);
  }, []);

  const handleTracking = useCallback((results: any) => {
    console.log(`Tracking: ${Object.keys(results.tracked_objects || {}).length} objects`);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error('Tracking error:', errorMessage);
  }, []);

  const exportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      configuration: config,
      statistics,
      trackedObjects,
      zoneOccupancy,
      detections
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetTracking = async () => {
    if (window.confirm('Reset all tracking data?')) {
      await stopTracking();
      setTimeout(() => startTracking(), 1000);
    }
  };

  return (
    <div className="final-tracking-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Object Detection & Tracking</h1>
          <ApiHealthIndicator showDetails={false} />
        </div>

        <div className="header-controls">
          <button
            onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
            className={`control-btn ${isConfigPanelOpen ? 'active' : ''}`}
          >
            ⚙️ Configure
          </button>
          <button
            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
            className={`control-btn ${isDashboardOpen ? 'active' : ''}`}
          >
            📊 Analytics
          </button>

          {/* Quick Status */}
          <div className="quick-status">
            <span className={`ws-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'} WS
            </span>
            <span className={`tracking-status ${isTracking ? 'active' : 'inactive'}`}>
              {isTracking ? '🎯' : '⏸️'} Track
            </span>
            <span className="objects-count">
              👥 {statistics.activeTracks}
            </span>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={clearError} className="error-dismiss">×</button>
        </div>
      )}

      <div className="page-content">
        {/* Configuration Panel */}
        {isConfigPanelOpen && (
          <div className="config-panel-container">
            <TrackingConfigPanel
              onConfigChange={handleConfigChange}
              initialConfig={config}
              disabled={isTracking}
            />

            {/* Visualization Quick Toggles */}
            <div className="visualization-quick-controls">
              <h4>Display Options</h4>
              <div className="toggle-grid">
                {Object.entries(visualConfig).map(([key, value]) => (
                  <label key={key} className="toggle-item">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setVisualConfig(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                    />
                    <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          <div className="camera-section">
            <EnhancedCamera
              wsUrl={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'}
              onDetection={handleDetection}
              onTracking={handleTracking}
              onError={handleError}
              models={config.models}
              trackingConfig={config.trackingConfig}
              visualizationConfig={visualConfig}
              enableDebugLogs={true}
            />
          </div>

          {/* Dashboard */}
          {isDashboardOpen && (
            <div className="dashboard-section">
              <TrackingDashboard
                statistics={statistics}
                zoneOccupancy={zoneOccupancy}
                trackedObjects={trackedObjects}
                onExportData={exportData}
                onResetTracking={resetTracking}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
          .final-tracking-page {
              min-height: 100vh;
              background: #f5f5f5;
          }

          .page-header {
              background: white;
              padding: 15px 20px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
          }

          .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
          }

          .page-header h1 {
              margin: 0;
              color: #333;
              font-size: 24px;
          }

          .header-controls {
              display: flex;
              align-items: center;
              gap: 15px;
              flex-wrap: wrap;
          }

          .control-btn {
              padding: 8px 15px;
              border: 2px solid #ddd;
              background: white;
              border-radius: 20px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 14px;
          }

          .control-btn:hover {
              border-color: #2196f3;
          }

          .control-btn.active {
              background: #2196f3;
              color: white;
              border-color: #2196f3;
          }

          .quick-status {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 6px 12px;
              background: #f8f9fa;
              border-radius: 15px;
              font-size: 12px;
              font-weight: bold;
          }

          .ws-status.connected { color: #4caf50; }
          .ws-status.disconnected { color: #f44336; }
          .tracking-status.active { color: #2196f3; }
          .tracking-status.inactive { color: #757575; }
          .objects-count { color: #ff9800; }

          .error-banner {
              background: #f44336;
              color: white;
              padding: 12px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
          }

          .error-dismiss {
              background: none;
              border: none;
              color: white;
              font-size: 18px;
              cursor: pointer;
          }

          .page-content {
              display: flex;
              gap: 20px;
              padding: 20px;
              max-width: 1400px;
              margin: 0 auto;
              width: 100vw;
              height: 100vh;
          }

          .config-panel-container {
              flex: 0 0 380px;
              display: flex;
              flex-direction: column;
              gap: 20px;
              overflow: auto;
          }

          .visualization-quick-controls {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
          }

          .visualization-quick-controls h4 {
              margin: 0 0 12px 0;
              color: #333;
          }

          .toggle-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
          }

          .toggle-item {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              cursor: pointer;
          }

          .main-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 20px;
              overflow: auto;
          }

          .camera-section {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .dashboard-section {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          @media (max-width: 1200px) {
              .page-content {
                  flex-direction: column;
              }

              .config-panel-container {
                  flex: none;
                  order: -1;
              }
          }

          @media (max-width: 768px) {
              .page-header {
                  flex-direction: column;
                  align-items: stretch;
              }

              .header-left {
                  justify-content: center;
              }

              .header-controls {
                  justify-content: center;
              }

              .quick-status {
                  justify-content: center;
              }

              .toggle-grid {
                  grid-template-columns: 1fr;
              }
          }
      `}</style>
    </div>
  );
};

export default TrackingPage;

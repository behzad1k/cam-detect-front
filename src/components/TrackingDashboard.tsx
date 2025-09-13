
// components/TrackingDashboard.tsx
import React, { useState } from 'react';

interface TrackingDashboardProps {
  statistics: {
    totalTracks: number;
    activeTracks: number;
    classDistribution: Record<string, number>;
  };
  zoneOccupancy: Record<string, string[]>;
  trackedObjects: Record<string, any>;
  onExportData?: () => void;
  onResetTracking?: () => void;
}

export const TrackingDashboard: React.FC<TrackingDashboardProps> = ({
                                                                      statistics,
                                                                      zoneOccupancy,
                                                                      trackedObjects,
                                                                      onExportData,
                                                                      onResetTracking
                                                                    }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const formatSpeed = (speed: number, unit: string) => {
    return `${speed.toFixed(2)} ${unit}`;
  };

  // const formatTime = (timestamp: number) => {
  //   return new Date(timestamp * 1000).toLocaleTimeString();
  // };

  return (
    <div className="tracking-dashboard">
      <div className="dashboard-header">
        <h3>Tracking Dashboard</h3>
        <div className="dashboard-actions">
          {onExportData && (
            <button onClick={onExportData} className="export-btn">
              Export Data
            </button>
          )}
          {onResetTracking && (
            <button onClick={onResetTracking} className="reset-btn">
              Reset Tracking
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={selectedTab === 'overview' ? 'tab-active' : 'tab'}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={selectedTab === 'objects' ? 'tab-active' : 'tab'}
          onClick={() => setSelectedTab('objects')}
        >
          Objects
        </button>
        <button
          className={selectedTab === 'zones' ? 'tab-active' : 'tab'}
          onClick={() => setSelectedTab('zones')}
        >
          Zones
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Active Tracks</h4>
                <div className="stat-value">{Object.keys(statistics.classDistribution).length}</div>
              </div>
            </div>

            <div className="class-distribution-chart">
              <h4>Class Distribution</h4>
              {Object.entries(statistics.classDistribution).map(([className, count]) => (
                <div key={className} className="class-bar">
                  <span className="class-name">{className}</span>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        width: `${(count / Math.max(...Object.values(statistics.classDistribution))) * 100}%`
                      }}
                    />
                    <span className="count">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'objects' && (
          <div className="objects-tab">
            <div className="objects-list">
              {Object.entries(trackedObjects).map(([trackId, obj]) => (
                <div key={trackId} className="object-card">
                  <div className="object-header">
                    <h5>ID: {trackId.substring(0, 8)}</h5>
                    <span className={`status ${obj.time_since_update < 5 ? 'active' : 'inactive'}`}>
    {obj.time_since_update < 5 ? 'Active' : 'Inactive'}
    </span>
                  </div>
                  <div className="object-details">
                    <p><strong>Class:</strong> {obj.class_name}</p>
                    <p><strong>Confidence:</strong> {(obj.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Age:</strong> {obj.age} frames</p>
                    <p><strong>Position:</strong> ({obj.centroid[0].toFixed(0)}, {obj.centroid[1].toFixed(0)})</p>
                    {obj.speed_info && (
                      <>
                        <p><strong>Speed:</strong> {formatSpeed(obj.speed_info.speed_px_per_sec, 'px/s')}</p>
                        {obj.speed_info.speed_m_per_sec !== obj.speed_info.speed_px_per_sec && (
                          <p><strong>Speed (m/s):</strong> {formatSpeed(obj.speed_info.speed_m_per_sec, 'm/s')}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {Object.keys(trackedObjects).length === 0 && (
                <div className="no-objects">No tracked objects</div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'zones' && (
          <div className="zones-tab">
            {Object.entries(zoneOccupancy).map(([zoneId, occupants]) => (
              <div key={zoneId} className="zone-card">
                <div className="zone-header">
                  <h5>{zoneId}</h5>
                  <span className={`occupancy ${occupants.length > 0 ? 'occupied' : 'empty'}`}>
      {occupants.length} objects
  </span>
                </div>
                {occupants.length > 0 && (
                  <div className="zone-occupants">
                    <strong>Occupants:</strong>
                    {occupants.map(trackId => (
                      <span key={trackId} className="occupant-id">
        {trackId.substring(0, 6)}
        </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(zoneOccupancy).length === 0 && (
              <div className="no-zones">No zones defined</div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .tracking-dashboard {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .dashboard-header h3 {
          margin: 0;
          color: #333;
        }

        .dashboard-actions {
          display: flex;
          gap: 10px;
        }

        .export-btn, .reset-btn {
          padding: 8px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }

        .export-btn {
          background-color: #4caf50;
          color: white;
        }

        .reset-btn {
          background-color: #f44336;
          color: white;
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }

        .tab, .tab-active {
          padding: 15px 25px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          color: #666;
        }

        .tab-active {
          border-bottom-color: #2196f3;
          color: #2196f3;
          font-weight: bold;
        }

        .dashboard-content {
          padding: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .class-distribution-chart {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .class-distribution-chart h4 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .class-bar {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .class-name {
          width: 120px;
          font-size: 12px;
          color: #666;
        }

        .bar-container {
          flex: 1;
          display: flex;
          align-items: center;
          margin-left: 10px;
        }

        .bar {
          height: 20px;
          background: linear-gradient(90deg, #4caf50, #2196f3);
          border-radius: 10px;
          min-width: 2px;
        }

        .count {
          margin-left: 10px;
          font-size: 12px;
          color: #333;
          font-weight: bold;
        }

        .objects-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .object-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .object-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .object-header h5 {
          margin: 0;
          color: #333;
        }

        .status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .status.active {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .status.inactive {
          background: #ffcdd2;
          color: #c62828;
        }

        .object-details p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }

        .zone-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .zone-header h5 {
          margin: 0;
          color: #333;
        }

        .occupancy {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .occupancy.occupied {
          background: #ffcdd2;
          color: #c62828;
        }

        .occupancy.empty {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .zone-occupants {
          font-size: 14px;
          color: #666;
        }

        .occupant-id {
          display: inline-block;
          background: #e3f2fd;
          padding: 2px 6px;
          margin: 2px;
          border-radius: 10px;
          font-size: 12px;
        }

        .no-objects, .no-zones {
          text-align: center;
          color: #999;
          padding: 40px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .dashboard-actions {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .objects-list {
            grid-template-columns: 1fr;
          }

          .class-name {
            width: 80px;
          }

          .tab, .tab-active {
            padding: 12px 15px;
          }
        }
      `}</style>
    </div>
  );
}
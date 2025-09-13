
// components/ApiHealthIndicator.tsx
import React from 'react';
import { useApiHealth } from '../hooks/useApiHealth';

interface ApiHealthIndicatorProps {
  showDetails?: boolean;
  onRetry?: () => void;
}

export const ApiHealthIndicator: React.FC<ApiHealthIndicatorProps> = ({
                                                                        showDetails = false,
                                                                        onRetry
                                                                      }) => {
  const { isHealthy, lastCheck, error, checkHealth } = useApiHealth();

  const getStatusColor = () => {
    if (isHealthy === null) return '#ff9800'; // Loading
    return isHealthy ? '#4caf50' : '#f44336'; // Healthy/Unhealthy
  };

  const getStatusText = () => {
    if (isHealthy === null) return 'Checking...';
    return isHealthy ? 'API Online' : 'API Offline';
  };

  const getStatusIcon = () => {
    if (isHealthy === null) return '🔄';
    return isHealthy ? '🟢' : '🔴';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '20px',
      fontSize: '14px',
      border: `2px solid ${getStatusColor()}`
    }}>
      <span>{getStatusIcon()}</span>
      <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
  {getStatusText()}
  </span>

      {showDetails && lastCheck && (
        <span style={{ fontSize: '12px', color: '#666' }}>
    ({lastCheck.toLocaleTimeString()})
    </span>
      )}

      {!isHealthy && (
        <button
          onClick={() => {
            checkHealth();
            onRetry?.();
          }}
          style={{
            padding: '2px 6px',
            fontSize: '11px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      )}

      {error && showDetails && (
        <span style={{ fontSize: '11px', color: '#f44336', marginLeft: '5px' }}>
    {error}
    </span>
      )}
    </div>
  );
};
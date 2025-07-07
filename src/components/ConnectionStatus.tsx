import React from 'react';
import { ConnectionStatus as ConnectionStatusType } from '@/types/detection';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()} ${className}`}>
      WebSocket: {status}
    </div>
  );
};

export default ConnectionStatus;

'use client';

import { Camera, CameraOff, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface StatusIndicatorsProps {
  isConnected: boolean;
  isStreaming: boolean;
  error?: string | null;
}

export default function StatusIndicators({
                                           isConnected,
                                           isStreaming,
                                           error
                                         }: StatusIndicatorsProps) {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-md bg-red-500/90 max-w-xs">
          <AlertCircle size={16} />
          <span className="text-white text-xs font-medium truncate">
            {error}
          </span>
        </div>
      )}

      {/* Connection Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-200 ${
        isConnected ? 'bg-green-500/90' : 'bg-red-500/90'
      }`}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span className="text-white text-xs font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Camera Status */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-200 ${
        isStreaming ? 'bg-green-500/90' : 'bg-red-500/90'
      }`}>
        {isStreaming ? <Camera size={16} /> : <CameraOff size={16} />}
        <span className="text-white text-xs font-medium">
          {isStreaming ? 'Camera On' : 'Camera Off'}
        </span>
      </div>
    </div>
  );
}

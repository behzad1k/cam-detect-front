'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from '@/components/CameraView';
import FloatingControls from '@/components/FloatingControls';
import StatusIndicators from '@/components/StatusIndicators';
import StatsPanel from '@/components/StatsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Model } from '@/types';

const AVAILABLE_MODELS: Model[] = [
  { id: 'face_detection', name: 'Face Detection', color: '#ef4444' },
  { id: 'cap_detection', name: 'Cap Detection', color: '#3b82f6' }
];

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<string[]>(['face_detection']);
  // const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { isStreaming, error: cameraError, stream, stopCamera } = useCamera();
  const { isConnected, detections, error: wsError, sendFrame, stats } = useWebSocket();

  // Combined error state
  const error = cameraError || wsError;

  // Handle model selection
  const handleModelToggle = useCallback((modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  }, []);

  // Handle frame capture
  const handleFrameCapture = useCallback((canvas: HTMLCanvasElement) => {
    if (!isConnected || selectedModels.length === 0) return;

    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      sendFrame(imageData, selectedModels);
    } catch (err) {
      console.error('Error capturing frame:', err);
    }
  }, [isConnected, selectedModels, sendFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [stopCamera]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Main Camera View */}
      <CameraView
        isStreaming={isStreaming}
        detections={detections}
        stream={stream}
        onFrameCapture={handleFrameCapture}
      />

      {/* Floating Controls */}
      <FloatingControls
        selectedModels={selectedModels}
        onModelToggle={handleModelToggle}
        availableModels={AVAILABLE_MODELS}
      />

      {/* Status Indicators */}
      <StatusIndicators
        isConnected={isConnected}
        isStreaming={isStreaming}
        error={error}
      />

      {/* Stats Panel */}
      <StatsPanel
        stats={stats}
        detections={detections}
        availableModels={AVAILABLE_MODELS}
      />
    </div>
  );
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from '@/components/CameraView';
import FloatingControls from '@/components/FloatingControls';
import StatusIndicators from '@/components/StatusIndicators';
import StatsPanel from '@/components/StatsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Camera, Model } from '@/types';

interface AvailableCameras {
  [key: string]: Camera
}

const AVAILABLE_CAMERAS: AvailableCameras = {
  environment: { slug: 'environment', title: 'Rear', icon: '#ef4444' },
  user: { slug: 'user', title: 'Selfie', icon: '#3b82f6' }
}
const AVAILABLE_MODELS: Model[] = [
  { id: 'face_detection', name: 'Face Detection', color: '#ef4444' },
  { id: 'cap_detection', name: 'Cap Detection', color: '#3b82f6' }
];

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<string[]>(['face_detection']);
  const [selectedCamera, setSelectedCamera] = useState<Camera>(AVAILABLE_CAMERAS.user!);

  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { isStreaming, error: cameraError, stream, stopCamera } = useCamera(selectedCamera);
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
      const imageData = canvas.toDataURL('image/jpeg', 0.5);
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
        availableCameras={Object.values(AVAILABLE_CAMERAS)}
        selectedCamera={selectedCamera}
        setSelectedCamera={setSelectedCamera}
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

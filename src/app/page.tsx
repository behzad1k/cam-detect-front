'use client';

import { DEFAULT_CAMERA_CONFIG } from '@/types/constants';
import { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from '@/components/CameraView';
import FloatingControls from '@/components/FloatingControls';
import StatusIndicators from '@/components/StatusIndicators';
import StatsPanel from '@/components/StatsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Camera, Model } from '@/types';

interface AvailableCameras {
  [key: string]: Camera;
}

const AVAILABLE_CAMERAS: AvailableCameras = {
  environment: {
    slug: 'environment',
    title: 'Rear',
    icon: '#ef4444'
  },
  user: {
    slug: 'user',
    title: 'Selfie',
    icon: '#3b82f6'
  }
};
const AVAILABLE_MODELS: Model[] = [
  {
    id: 'face_detection',
    name: 'Face-Mask Detection',
    color: '#ef4444'
  },
  {
    id: 'cap_detection',
    name: 'Cap Detection',
    color: '#3b82f6'
  }
];

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<string[]>(['cap_detection']);
  const [selectedCamera, setSelectedCamera] = useState<Camera>(AVAILABLE_CAMERAS.environment!);

  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentTimeRef = useRef<number>(0);

  // Custom hooks
  const {
    isStreaming,
    error: cameraError,
    stream,
    stopCamera
  } = useCamera(selectedCamera);
  const {
    isConnected,
    detections,
    error: wsError,
    sendFrame,
    stats
  } = useWebSocket();

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
  interface FrameSender {
    (frameData: ArrayBuffer, models: string[]): void;
  }

  const captureAndSendFrame = async (
    canvas: HTMLCanvasElement,
    sendFrame: FrameSender,
    selectedModels: string[],
    quality = 0.6
  ): Promise<void> => {
    try {
      const now = Date.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;

      // If less than 500ms (2fps = 1 frame every 500ms) has passed since last send
      if (timeSinceLastSend < DEFAULT_CAMERA_CONFIG.frameRate * 1000 / 2) {
        // Skip this frame or queue it (implementation below)
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Convert to Blob (more efficient than base64)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });

      if (!blob) {
        throw new Error('Failed to convert canvas to blob');
      }

      // Read blob as ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error('Unexpected reader result type'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });

      // Update last sent time and send the frame
      lastSentTimeRef.current = now;
      sendFrame(arrayBuffer, selectedModels);

    } catch (err) {
      console.error('Error capturing frame:', err instanceof Error ? err.message : err);
      // Consider adding error handling/recovery logic here
    }
  };

  // Usage example:
  // Handle frame capture
  const handleFrameCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!isConnected || selectedModels.length === 0) return;

    await captureAndSendFrame(canvas, sendFrame, selectedModels, 0.6);

    // try {
    //   const imageData = canvas.toDataURL('image/jpeg', 0.5);
    //   sendFrame(imageData, selectedModels);
    // } catch (err) {
    //   console.error('Error capturing frame:', err);
    // }
  }, [isConnected, selectedModels, sendFrame, selectedCamera]);

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

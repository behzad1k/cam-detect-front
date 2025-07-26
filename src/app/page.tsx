'use client';

import { DEFAULT_CAMERA_CONFIG } from '@/types/constants';
import { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from '@/components/CameraView';
import FloatingControls from '@/components/FloatingControls';
import StatusIndicators from '@/components/StatusIndicators';
import StatsPanel from '@/components/StatsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useModels } from '@/hooks/useModels';
import { Camera, ModelRequest } from '@/types';

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


export default function Home() {
  const [selectedModels, setSelectedModels] = useState<ModelRequest[]>([
    { name: 'cap_detection', classFilter: ['cap'] }
  ]);
  const [selectedCamera, setSelectedCamera] = useState<Camera>(AVAILABLE_CAMERAS.environment!);
  const [availableClasses, setAvailableClasses] = useState<Record<string, string[]>>({});

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

  const {
    models,
    // loading: modelsLoading,
    error: modelsError,
    loadModel,
    getModelClasses
  } = useModels();

  // Combined error state
  const error = cameraError || wsError || modelsError;

  // Load available classes for models
  useEffect(() => {
    const loadAvailableClasses = async () => {
      const classesMap: Record<string, string[]> = {};

      for (const model of models.filter(m => m.loaded)) {
        if (model.available_classes) {
          classesMap[model.name] = model.available_classes;
        } else {
          const classes = await getModelClasses(model.name);
          if (classes) {
            classesMap[model.name] = classes;
          }
        }
      }

      setAvailableClasses(classesMap);
    };

    if (models.length > 0) {
      loadAvailableClasses();
    }
  }, [models, getModelClasses]);

  // Load model if not already loaded
  const ensureModelLoaded = useCallback(async (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    if (model && !model.loaded) {
      await loadModel(modelName);
    }
  }, [models, loadModel]);

  const captureAndSendFrame = async (
    canvas: HTMLCanvasElement,
    sendFrame: (frameData: ArrayBuffer, models: ModelRequest[]) => void,
    selectedModels: ModelRequest[],
    quality = 0.6
  ): Promise<void> => {
    try {
      const now = Date.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;

      // Rate limiting: respect the configured frame rate
      if (timeSinceLastSend < 1000 / DEFAULT_CAMERA_CONFIG.frameRate) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Ensure all selected models are loaded
      for (const model of selectedModels) {
        await ensureModelLoaded(model.name);
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
    }
  };

  const handleClassToggle = (modelId: string, className: string) => {
    setSelectedModels(prev => {
      const cp = [...prev]
      let modelIndex = cp.findIndex(e => e.name == modelId)
      let model: ModelRequest = {...(cp[modelIndex] || { name: modelId, classFilter: [] })};

      model.classFilter = getModelClassFilter(modelId)?.includes(className)
        ? model.classFilter?.filter(c => c !== className)
        : [...model.classFilter, className]

      if (modelIndex < 0){
        cp.push(model)
      } else {
        cp[modelIndex] = model;
      }
      return cp;
    })
  };

  // Handle frame capture
  const handleFrameCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!isConnected || selectedModels.length === 0) return;

    await captureAndSendFrame(canvas, sendFrame, selectedModels, 0.6);
  }, [isConnected, selectedModels, sendFrame, ensureModelLoaded]);

  // Get class filter for a specific model
  const getModelClassFilter = useCallback((modelName: string) => {
    let model = selectedModels.find(m => m.name === modelName);
    return model?.classFilter || [];
  }, [selectedModels]);
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
        availableCameras={Object.values(AVAILABLE_CAMERAS)}
        selectedCamera={selectedCamera}
        setSelectedCamera={setSelectedCamera}
        // New props for class filtering
        availableClasses={availableClasses}
        getModelClassFilter={getModelClassFilter}
        models={models}
        onLoadModel={loadModel}
        onClassToggle={handleClassToggle}
      />

      {/* Status Indicators */}
      <StatusIndicators
        isConnected={isConnected}
        isStreaming={isStreaming}
        error={error}
        // modelsLoading={modelsLoading}
      />

      {/* Stats Panel */}
      <StatsPanel
        stats={stats}
        detections={detections}
        // selectedModels={selectedModels}
      />
    </div>
  );
}

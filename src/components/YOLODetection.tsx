'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DetectionResults, ModelOption } from '@/types/detection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useCamera } from '@/hooks/useCamera';
import ModelSelector from './ModelSelector';
import DetectionCanvas, { DetectionCanvasRef } from './DetectionCanvas';
import ConnectionStatus from './ConnectionStatus';

const YOLODetection: React.FC = () => {
  const canvasRef = useRef<DetectionCanvasRef>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [detectionResults, setDetectionResults] = useState<DetectionResults>({});
  const [availableModels] = useState<ModelOption[]>([
    {
      id: 'face_detection',
      name: 'face_detection',
      label: 'Face Detection',
      color: '#ff0000'
    },
    {
      id: 'cap_detection',
      name: 'cap_detection',
      label: 'Cap Detection',
      color: '#00ff00'
    }
  ]);

  const { videoRef, isStreaming, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera({
    width: 640,
    height: 480
  });

  const handleDetections = useCallback((results: DetectionResults) => {
    setDetectionResults(results);
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.drawDetections(results, videoRef.current);
    }
  }, []);

  const handleWebSocketError = useCallback((error: string) => {
    console.error('WebSocket error:', error);
  }, []);

  const { connect, disconnect, sendMessage, connectionStatus, isConnected } = useWebSocket({
    url: 'ws://192.168.1.10:8000/ws',
    onDetections: handleDetections,
    onError: handleWebSocketError
  });

  const handleModelToggle = useCallback((modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  }, []);

  const sendFrame = useCallback(() => {
    if (!isConnected || selectedModels.length === 0) return;

    const imageData = captureFrame();
    if (!imageData) return;

    sendMessage({
      type: 'frame',
      image: imageData,
      models: selectedModels,
      timestamp: Date.now()
    });
  }, [isConnected, selectedModels, captureFrame, sendMessage]);

  // Setup frame sending interval
  useEffect(() => {
    if (!isStreaming || selectedModels.length === 0 || !isConnected) return;

    const interval = setInterval(sendFrame, 100); // 10 FPS
    return () => clearInterval(interval);
  }, [isStreaming, selectedModels, isConnected, sendFrame]);

  // Auto-connect WebSocket when component mounts
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleStartStop = useCallback(() => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isStreaming, startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center p-6 space-y-4 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Real-time YOLO Detection
      </h1>

      {/* Connection Status */}
      <ConnectionStatus status={connectionStatus} />

      {/* Error Display */}
      {cameraError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Camera Error:</strong> {cameraError}
        </div>
      )}

      {/* Model Selection */}
      <ModelSelector
        models={availableModels}
        selectedModels={selectedModels}
        onModelToggle={handleModelToggle}
        className="w-full max-w-2xl"
      />

      {/* Controls */}
      <div className="flex space-x-4">
        <button
          onClick={handleStartStop}
          disabled={!!cameraError}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isStreaming
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {isStreaming ? 'Stop Camera' : 'Start Camera'}
        </button>

        <button
          onClick={connect}
          disabled={connectionStatus === 'connected'}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            connectionStatus === 'connected'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {connectionStatus === 'connected' ? 'Connected' : 'Connect WebSocket'}
        </button>
      </div>

      {/* Video and Canvas Container */}
      <div className="relative">
        <video
          ref={videoRef}
          className="hidden"
          autoPlay
          muted
          playsInline
        />
        <DetectionCanvas
          ref={canvasRef}
          width={640}
          height={480}
          className="max-w-full shadow-lg"
        />
      </div>

      {/* Detection Results Summary */}
      {Object.keys(detectionResults).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-2xl">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Detection Results:</h3>
          <div className="space-y-2">
            {Object.entries(detectionResults).map(([modelName, result]) => (
              <div key={modelName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium capitalize text-gray-700">
                  {modelName.replace('_', ' ')}:
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    result.count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {result.count} detected
                  </span>
                  {result.error && (
                    <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-800">
                      Error
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg max-w-2xl">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Select one or more detection models using the checkboxes above</li>
          <li>Click "Start Camera" to begin video capture</li>
          <li>Ensure WebSocket connection is established</li>
          <li>Detection results will appear as colored bounding boxes on the video</li>
        </ol>
      </div>
    </div>
  );
};

export default YOLODetection;

// components/FixedEnhancedCamera.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrackingWebSocketService } from '@/services/TrackingWebSocketService';

interface DetectionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  label: string;
  class_id: number;
}

interface TrackedObject {
  track_id: string;
  class_name: string;
  bbox: [number, number, number, number];
  centroid: [number, number];
  confidence: number;
  age: number;
  velocity: [number, number];
  speed_info?: {
    speed_px_per_sec: number;
    speed_m_per_sec: number;
    direction: number;
  };
}

interface EnhancedCameraProps {
  wsUrl?: string;
  onDetection?: (detections: DetectionBox[]) => void;
  onTracking?: (results: any) => void;
  onError?: (error: string) => void;
  models?: Array<{
    name: string;
    classFilter?: string[];
  }>;
  trackingConfig?: {
    tracker_type?: 'centroid' | 'kalman' | 'deep_sort' | 'byte_track';
    max_disappeared?: number;
    max_distance?: number;
    use_kalman?: boolean;
    fps?: number;
    pixel_to_meter_ratio?: number;
  };
  visualizationConfig?: {
    showBoundingBoxes: boolean;
    showTrajectories: boolean;
    showVelocityVectors: boolean;
    showZones: boolean;
    showObjectInfo: boolean;
    showSpeedInfo: boolean;
  };
  enableDebugLogs?: boolean;
}

export const EnhancedCamera: React.FC<EnhancedCameraProps> = ({
                                                                          wsUrl = 'ws://localhost:8000/ws',
                                                                          onDetection,
                                                                          onTracking,
                                                                          onError,
                                                                          models = [{ name: 'ppe_detection' }],
                                                                          trackingConfig = {},
                                                                          visualizationConfig = {
                                                                            showBoundingBoxes: true,
                                                                            showTrajectories: true,
                                                                            showVelocityVectors: true,
                                                                            showZones: true,
                                                                            showObjectInfo: true,
                                                                            showSpeedInfo: true,
                                                                          },
                                                                          enableDebugLogs = true
                                                                        }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsServiceRef = useRef<TrackingWebSocketService | null>(null);

  // State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isSendingFrames, setIsSendingFrames] = useState(false);
  const [detections, setDetections] = useState<DetectionBox[]>([]);
  const [trackedObjects, setTrackedObjects] = useState<Record<string, TrackedObject>>({});
  const [statistics, setStatistics] = useState({
    totalTracks: 0,
    activeTracks: 0,
    classDistribution: {} as Record<string, number>,
    framesSent: 0,
    lastFrameTime: 0
  });
  const [debugInfo, setDebugInfo] = useState({
    cameraReady: false,
    canvasReady: false,
    websocketReady: false,
    frameCapture: false,
    lastError: ''
  });
  const log = useCallback((message: string, data?: any) => {
    if (enableDebugLogs) {
      console.log(`[Camera Debug] ${message}`, data || '');
    }
  }, [enableDebugLogs]);

  const logError = useCallback((message: string, error?: any) => {
    console.error(`[Camera Error] ${message}`, error || '');
    setDebugInfo(prev => ({ ...prev, lastError: message }));
    onError?.(message);
  }, [onError]);

  // Initialize camera
  useEffect(() => {
    log('Initializing camera...');
    initializeCamera();
    return () => {
      cleanup();
    };
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    log('Initializing WebSocket...');
    initializeWebSocket();
  }, [wsUrl]);

  const initializeCamera = async () => {
    try {
      log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        }
      });

      log('Camera access granted, setting up video element...');
      setMediaStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          log('Video metadata loaded', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight
          });

          setDebugInfo(prev => ({ ...prev, cameraReady: true }));
          setupCanvases();
        };

        videoRef.current.onplay = () => {
          log('Video started playing');
          setDebugInfo(prev => ({ ...prev, frameCapture: true }));
        };
      }
    } catch (error) {
      logError('Failed to access camera', error);
      setDebugInfo(prev => ({ ...prev, cameraReady: false }));
    }
  };

  const setupCanvases = () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
      log('Canvas elements not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    // Set canvas dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    overlayCanvas.width = video.videoWidth || 640;
    overlayCanvas.height = video.videoHeight || 480;

    log('Canvas setup complete', {
      width: canvas.width,
      height: canvas.height
    });

    setDebugInfo(prev => ({ ...prev, canvasReady: true }));
  };

  const initializeWebSocket = async () => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }

    wsServiceRef.current = new TrackingWebSocketService(wsUrl);

    // Set up event handlers
    wsServiceRef.current.onConnectionChange = (connected) => {
      log(`WebSocket connection changed: ${connected}`);
      setIsConnected(connected);
      setDebugInfo(prev => ({ ...prev, websocketReady: connected }));

      if (connected) {
        configureTracking();
      }
    };

    wsServiceRef.current.onTrackingResults = (results) => {
      log('Received tracking results', { objectCount: Object.keys(results.tracked_objects).length });
      setTrackedObjects(results.tracked_objects);
      setStatistics(prev => ({
        ...prev,
        totalTracks: results.summary.total_tracks,
        activeTracks: results.summary.active_tracks,
        classDistribution: results.summary.class_counts
      }));
      onTracking?.(results);
      drawTrackingOverlay(results.tracked_objects);
    };

    wsServiceRef.current.onDetectionResults = (detections) => {
      log('Received detection results', { detectionCount: detections.length });
      setDetections(detections);
      onDetection?.(detections);
      drawDetectionOverlay(detections);
    };

    wsServiceRef.current.onError = (error) => {
      logError('WebSocket error', error);
    };

    // Connect
    try {
      const connected = await wsServiceRef.current.connect();
      log(`WebSocket connection result: ${connected}`);
    } catch (error) {
      logError('Failed to connect WebSocket', error);
    }
  };

  const configureTracking = async () => {
    if (!wsServiceRef.current || !isConnected) {
      log('Cannot configure tracking - WebSocket not ready');
      return;
    }

    log('Configuring tracking...', trackingConfig);

    try {
      await wsServiceRef.current.configureTracking({
        tracker_type: trackingConfig.tracker_type || 'centroid',
        tracker_params: {
          max_disappeared: trackingConfig.max_disappeared || 30,
          max_distance: trackingConfig.max_distance || 100,
          use_kalman: trackingConfig.use_kalman !== false
        },
        speed_config: {
          fps: trackingConfig.fps || 30,
          pixel_to_meter_ratio: trackingConfig.pixel_to_meter_ratio || 30
        }
      });
      log('Tracking configured successfully');
    } catch (error) {
      logError('Failed to configure tracking', error);
    }
  };

  const startTracking = async () => {
    if (!isConnected || !wsServiceRef.current) {
      logError('Cannot start tracking - WebSocket not connected');
      return;
    }

    log('Starting tracking...');

    try {
      await wsServiceRef.current.startTracking();
      setIsTracking(true);
      startFrameCapture();
      log('Tracking started successfully');
    } catch (error) {
      logError('Failed to start tracking', error);
    }
  };

  const stopTracking = async () => {
    log('Stopping tracking...');
    setDetections([])
    if (wsServiceRef.current) {
      await wsServiceRef.current.stopTracking();
    }

    setIsTracking(false);
    stopFrameCapture();
    log('Tracking stopped');
  };

  const startFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    if (!videoRef.current || !canvasRef.current) {
      logError('Video or canvas not ready for frame capture');
      return;
    }

    const fps = trackingConfig.fps || 15; // Default to 15 FPS for better performance
    const interval = 1000 / fps;

    log(`Starting frame capture at ${fps} FPS (${interval}ms interval)`);
    setIsSendingFrames(true);

    frameIntervalRef.current = setInterval(() => {
      captureAndSendFrame();
    }, interval);
  };

  const stopFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsSendingFrames(false);
    log('Frame capture stopped');
  };

  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !wsServiceRef.current || !isConnected) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      logError('Cannot get canvas context');
      return;
    }

    try {
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        log('Video not ready, skipping frame');
        return;
      }

      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          logError('Failed to create blob from canvas');
          return;
        }

        try {
          const arrayBuffer = await blob.arrayBuffer();
          await wsServiceRef.current!.sendFrame(arrayBuffer, models);

          // Update statistics
          setStatistics(prev => ({
            ...prev,
            framesSent: prev.framesSent + 1,
            lastFrameTime: Date.now()
          }));

          if (statistics.framesSent % 30 === 0) { // Log every 30 frames
            log(`Sent ${statistics.framesSent} frames`);
          }
        } catch (error) {
          logError('Failed to send frame', error);
        }
      }, 'image/jpeg', 0.8);

    } catch (error) {
      logError('Error in frame capture', error);
    }
  };

  const drawDetectionOverlay = (detections: DetectionBox[]) => {
    console.log(detections);
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!visualizationConfig.showBoundingBoxes) return;

    detections.forEach((detection) => {
      const { x1, y1, x2, y2, confidence, label } = detection;

      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      if (visualizationConfig.showObjectInfo) {
        const labelText = `${label} ${(confidence * 100).toFixed(0)}%`;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(x1, y1 - 25, ctx.measureText(labelText).width + 10, 20);

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(labelText, x1 + 5, y1 - 8);
      }
    });
  };

  const drawTrackingOverlay = (objects: Record<string, TrackedObject>) => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Object.entries(objects).forEach(([trackId, obj]) => {
      const color = getTrackColor(trackId);
      const [x1, y1, x2, y2] = obj.bbox;
      const [cx, cy] = obj.centroid;

      // Draw bounding box
      if (visualizationConfig.showBoundingBoxes) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }

      // Draw centroid
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw object info
      if (visualizationConfig.showObjectInfo) {
        const info = [
          `ID: ${trackId.substring(0, 6)}`,
          `${obj.class_name}`,
          `Speed: ${ Math.floor(obj.speed_info.speed_m_per_sec)}`,
          `Avg Speed: ${Math.floor((obj as any).speed_info.avg_speed_m_per_sec)}`
        ];

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x1, y1 - info.length * 16 - 5, 120, info.length * 16 + 10);

        ctx.fillStyle = color;
        ctx.font = '13px Arial';
        info.forEach((line, index) => {
          ctx.fillText(line, x1 + 5, y1 - info.length * 16 + index * 16 + 12);
        });
      }
    });
  };

  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const trackColors = useRef(new Map<string, string>());

  const getTrackColor = (trackId: string): string => {
    if (!trackColors.current.has(trackId)) {
      const colorIndex = trackColors.current.size % colorPalette.length;
      trackColors.current.set(trackId, colorPalette[colorIndex]);
    }
    return trackColors.current.get(trackId)!;
  };

  const cleanup = () => {
    log('Cleaning up camera component...');

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        log('Camera track stopped');
      });
    }

    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  };

  return (
    <div className="fixed-enhanced-camera">
      {/* Video Container */}
      <div className="video-container" style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            maxWidth: '800px',
            height: 'auto',
            border: '2px solid #333'
          }}
        />

        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />

        {/* Status Indicators */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{
            padding: '5px 10px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: isConnected ? '#4CAF50' : '#F44336'
          }}>
            WS: {isConnected ? 'Connected' : 'Disconnected'}
          </div>

          {isTracking && (
            <div style={{
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: isSendingFrames ? '#2196F3' : '#FF9800'
            }}>
              Frames: {isSendingFrames ? 'Sending' : 'Stopped'}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="controls" style={{ marginTop: '20px' }}>
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={!isConnected || !debugInfo.cameraReady || !debugInfo.canvasReady}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isTracking ? '#F44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (!isConnected || !debugInfo.cameraReady || !debugInfo.canvasReady) ? 'not-allowed' : 'pointer',
            opacity: (!isConnected || !debugInfo.cameraReady || !debugInfo.canvasReady) ? 0.5 : 1
          }}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>

        <button
          onClick={() => log('Manual frame capture test', {
            videoReady: videoRef.current?.readyState === 4,
            canvasReady: !!canvasRef.current,
            wsReady: isConnected
          })}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Frame Capture
        </button>
      </div>

      {/* Statistics */}
      <div className="statistics" style={{
        marginTop: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px'
      }}>
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <strong>Active Tracks:</strong> {statistics.activeTracks}
        </div>
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <strong>Total Tracks:</strong> {statistics.totalTracks}
        </div>
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <strong>Frames Sent:</strong> {statistics.framesSent}
        </div>
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <strong>Detections:</strong> {detections.length}
        </div>
      </div>

      {/* Debug Information */}
      {enableDebugLogs && (
        <div className="debug-info" style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h4>Debug Information:</h4>
          <div>Camera Ready: {debugInfo.cameraReady ? '✅' : '❌'}</div>
          <div>Canvas Ready: {debugInfo.canvasReady ? '✅' : '❌'}</div>
          <div>WebSocket Ready: {debugInfo.websocketReady ? '✅' : '❌'}</div>
          <div>Frame Capture: {debugInfo.frameCapture ? '✅' : '❌'}</div>
          <div>Is Tracking: {isTracking ? '✅' : '❌'}</div>
          <div>Is Sending Frames: {isSendingFrames ? '✅' : '❌'}</div>
          <div>Last Frame: {statistics.lastFrameTime ? new Date(statistics.lastFrameTime).toLocaleTimeString() : 'Never'}</div>
          {debugInfo.lastError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Last Error: {debugInfo.lastError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
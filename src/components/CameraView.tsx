'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { DetectionResult } from '@/types';

interface CameraViewProps {
  isStreaming: boolean;
  detections: Record<string, DetectionResult>;
  stream: MediaStream | null;
  onFrameCapture: (canvas: HTMLCanvasElement) => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'face_detection',
    name: 'Face Detection',
    color: '#ef4444'
  },
  {
    id: 'cap_detection',
    name: 'Cap Detection',
    color: '#3b82f6'
  }
];

export default function CameraView({
                                     isStreaming,
                                     detections,
                                     onFrameCapture,
  stream
                                   }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Draw detections overlay
  const drawDetections = useCallback(() => {
    if (!videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors (video actual size vs display size)
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    // Draw detections for each model
    Object.entries(detections).forEach(([modelName, result]) => {
      const modelConfig = AVAILABLE_MODELS.find(m => m.id === modelName);
      const color = modelConfig?.color || '#ffffff';

      result.detections.forEach((detection) => {
        const x1 = detection.x1 * scaleX;
        const y1 = detection.y1 * scaleY;
        const x2 = detection.x2 * scaleX;
        const y2 = detection.y2 * scaleY;
        const width = x2 - x1;
        const height = y2 - y1;

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        // Draw label background
        const label = `${detection.label} ${(detection.confidence * 100).toFixed(0)}%`;
        ctx.font = '14px Arial';
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 16;

        // Background with padding
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - textHeight - 6, textWidth + 8, textHeight + 4);

        // Label text
        ctx.fillStyle = 'white';
        ctx.fillText(label, x1 + 4, y1 - 6);
      });
    });
  }, [detections]);

  // Handle video metadata loaded
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setIsVideoReady(true);

      if (canvasRef.current) {
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  }, []);

  // Capture frame for processing
  // In the captureFrame function, add logging:
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isVideoReady) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onFrameCapture(canvas);
  }, [onFrameCapture, isVideoReady]);
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawDetections();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawDetections]);

  // Draw detections when they update
  useEffect(() => {
    drawDetections();
  }, [drawDetections]);

  // Expose capture function
  useEffect(() => {
    if (!isVideoReady) return;

    const interval = setInterval(captureFrame, 100);
    return () => clearInterval(interval);
  }, [captureFrame, isVideoReady]);
  ;

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onLoadedMetadata={handleVideoLoaded}
      />

      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Detection overlay canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* No camera message */}
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📷</div>
            <div className="text-xl">Camera not available</div>
          </div>
        </div>
      )}
    </div>
  );
}

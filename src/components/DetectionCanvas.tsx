import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { DetectionResults } from '@/types/detection';

interface DetectionCanvasProps {
  width: number;
  height: number;
  className?: string;
}

export interface DetectionCanvasRef {
  drawDetections: (results: DetectionResults, videoElement: HTMLVideoElement) => void;
  clearCanvas: () => void;
}

const DetectionCanvas = forwardRef<DetectionCanvasRef, DetectionCanvasProps>(
  ({ width, height, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []);

    const drawDetections = useCallback((results: DetectionResults, videoElement: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas || !videoElement) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Color map for different models
      const colors: { [key: string]: string } = {
        face_detection: '#ff0000',
        cap_detection: '#00ff00',
        // Add more colors for additional models
      };

      // Draw detections for each model
      Object.entries(results).forEach(([modelName, result]) => {
        const color = colors[modelName] || '#ffffff';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.font = '14px Arial';

        result.detections.forEach((detection) => {
          const { x1, y1, x2, y2, confidence, label } = detection;

          // Scale coordinates to canvas size
          const scaleX = canvas.width / videoElement.videoWidth;
          const scaleY = canvas.height / videoElement.videoHeight;

          const scaledX1 = x1 * scaleX;
          const scaledY1 = y1 * scaleY;
          const scaledX2 = x2 * scaleX;
          const scaledY2 = y2 * scaleY;

          // Draw bounding box
          ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);

          // Draw label with confidence
          const text = `${label} (${(confidence * 100).toFixed(1)}%)`;
          const textMetrics = ctx.measureText(text);

          ctx.fillRect(scaledX1, scaledY1 - 20, textMetrics.width + 8, 20);
          ctx.fillStyle = '#000000';
          ctx.fillText(text, scaledX1 + 4, scaledY1 - 6);
          ctx.fillStyle = color;
        });
      });
    }, []);

    useImperativeHandle(ref, () => ({
      drawDetections,
      clearCanvas
    }), [drawDetections, clearCanvas]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`border-2 border-gray-300 rounded-lg ${className}`}
      />
    );
  }
);

DetectionCanvas.displayName = 'DetectionCanvas';

export default DetectionCanvas;

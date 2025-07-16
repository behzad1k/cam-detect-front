'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DetectionResult } from '@/types';

interface WebSocketMessage {
  type: string;
  results?: Record<string, DetectionResult>;
  timestamp?: number;
  message?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  detections: Record<string, DetectionResult>;
  error: string | null;
  sendFrame: (imageData: ArrayBuffer, models: string[]) => void;
  stats: { fps: number; latency: number };
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState<Record<string, DetectionResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ fps: 0, latency: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.1.10:8000/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'detections' && message.results) {
            setDetections(message.results);

            // Calculate latency
            if (message.timestamp) {
              const latency = Date.now() - message.timestamp;
              setStats(prev => ({ ...prev, latency }));
            }

            // Update FPS
            const now = Date.now();
            frameCountRef.current++;
            if (now - lastFrameTimeRef.current >= 1000) {
              setStats(prev => ({ ...prev, fps: frameCountRef.current }));
              frameCountRef.current = 0;
              lastFrameTimeRef.current = now;
            }
          } else if (message.type === 'error') {
            console.error('WebSocket error:', message.message);
            setError(message.message || 'Unknown error');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setError('Failed to parse server response');
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setError('WebSocket connection failed');
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, []);

  const sendFrame = useCallback((imageData: ArrayBuffer, models: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || models.length === 0) {
      return;
    }

    const timestamp = Date.now();
    try {
      // Convert models to bytes (UTF-8 encoded)
      const modelNamesBytes = models.map(model => {
        const encoder = new TextEncoder();
        return encoder.encode(model);
      });

      // Calculate total buffer size
      const totalLength =
        4 + // timestamp (4 bytes)
        1 + // model count (1 byte)
        modelNamesBytes.reduce((sum, bytes) => sum + 1 + bytes.length, 0) + // models data
        imageData.byteLength; // image data

      // Create combined buffer
      const buffer = new Uint8Array(totalLength);
      const view = new DataView(buffer.buffer);

      // Write timestamp (4 bytes, big-endian)
      view.setUint32(0, Math.floor(timestamp / 1000));

      // Write model count (1 byte)
      buffer[4] = models.length;

      // Write model names (each prefixed with 1 byte length)
      let position = 5;
      for (const modelBytes of modelNamesBytes) {
        buffer[position] = modelBytes.length; // 1 byte length prefix
        position += 1;
        buffer.set(modelBytes, position); // model name bytes
        position += modelBytes.length;
      }

      // Append image data
      buffer.set(new Uint8Array(imageData), position);

      // Send binary data
      wsRef.current.send(buffer.buffer);
    } catch (err) {
      console.error('Error sending frame:', err);
      setError('Failed to send frame to server');
    }
  }, []);
  // Initialize connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return {
    isConnected,
    detections,
    error,
    sendFrame,
    stats
  };
}

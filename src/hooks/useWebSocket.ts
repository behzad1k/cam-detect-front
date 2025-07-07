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
  sendFrame: (imageData: string, models: string[]) => void;
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

  const sendFrame = useCallback((imageData: string, models: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || models.length === 0) {
      return;
    }

    const message = {
      type: 'frame',
      image: imageData,
      models: models,
      timestamp: Date.now()
    };

    try {
      wsRef.current.send(JSON.stringify(message));
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

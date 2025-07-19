export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DEFAULT_CAMERA_CONFIG = {
  width: 640,
  height: 480,
  frameRate: 2
} as const;

export const DEFAULT_DETECTION_CONFIG = {
  confidenceThreshold: 0.5,
  maxDetections: 100,
  frameInterval: 100, // milliseconds (10 FPS)
} as const;

export const MODEL_COLORS: Record<string, string> = {
  face_detection: '#ff0000',
  cap_detection: '#00ff00',
  person_detection: '#0000ff',
  vehicle_detection: '#ff00ff',
  animal_detection: '#ffff00',
  object_detection: '#ff8000',
} as const;

export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
} as const;

import { Model } from '@/types/index';

export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DEFAULT_CAMERA_CONFIG = {
  width: 640,
  height: 480,
  frameRate: 1
} as const;

export const DEFAULT_DETECTION_CONFIG = {
  confidenceThreshold: 0.5,
  maxDetections: 100,
  frameInterval: 100, // milliseconds (10 FPS)
} as const;

export const MODEL_COLORS: Record<string, string> = {
  face_detection: '#ff0000',
  cap_detection: '#00ff00',
  ppe_detection: '#0000ff',
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

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'face_detection',
    name: 'Face-Mask Detection',
    color: '#2faee4'
  },
  {
    id: 'cap_detection',
    name: 'Cap Detection',
    color: '#3bf6be'
  },
  {
    id: 'ppe_detection',
    name: 'PPE Detection',
    color: '#317503'
  },
  {
    id: 'weapon_detection',
    name: 'Weapon Detection',
    color: '#fff016'
  },
  {
    id: 'fire_detection',
    name: 'Fire Detection',
    color: '#ff1616'
  },
  {
    id: 'others_detection',
    name: 'Other Objects',
    color: '#da4fef'
  }
] as const
export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class: number;
  label: string;
}

export interface DetectionResult {
  detections: Detection[];
  count: number;
  model: string;
  error?: string;
}

export interface Model {
  id: string;
  name: string;
  color: string;
}

export interface Stats {
  fps: number;
  latency: number;
}

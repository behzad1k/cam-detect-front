'use client';

import { DetectionResult } from '@/types';
import { DEFAULT_CAMERA_CONFIG } from '@/types/constants';

interface Stats {
  fps: number;
  latency: number;
}

interface StatsPanelProps {
  stats: Stats;
  detections: Record<string, DetectionResult>;
  availableModels: Array<{
    id: string;
    name: string;
    color: string
  }>;
}

export default function StatsPanel({
                                     stats,
                                     detections,
                                     availableModels
                                   }: StatsPanelProps) {
  const hasStats = stats.fps > 0 || stats.latency > 0;
  const hasDetections = Object.keys(detections).length > 0;

  if (!hasStats && !hasDetections) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between">
      {/* Performance Stats */}
      {hasStats && (
        <div className="px-3 py-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/20">
          <div className="text-white text-xs space-y-1">
            <div className="flex items-center space-x-4">
              <span>FPS: <span className="font-mono">{DEFAULT_CAMERA_CONFIG.frameRate}</span></span>
              <span>Latency: <span className="font-mono">{stats.latency}ms</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Detection Counts */}
      {hasDetections && (
        <div className="px-3 py-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/20">
          <div className="text-white text-xs space-y-1">
            {Object.entries(detections).map(([modelName, result]) => {
              const modelConfig = availableModels.find(m => m.id === modelName);
              return (
                <div key={modelName} className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: modelConfig?.color || '#ffffff' }}
                  />
                  <span className="font-mono">
                    {modelConfig?.name || modelName}: {result.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

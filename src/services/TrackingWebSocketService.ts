// services/TrackingWebSocketService.ts
interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_id: number;
  label: string;
}

interface TrackedObject {
  track_id: string;
  class_name: string;
  class_id: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
  confidence: number;
  age: number;
  hits: number;
  time_since_update: number;
  velocity: [number, number];
  speed_info: {
    speed_px_per_sec: number;
    speed_m_per_sec: number;
    direction: number;
    avg_speed_px_per_sec: number;
    avg_speed_m_per_sec: number;
  };
  trajectory_length: number;
}

interface TrackingResults {
  tracked_objects: Record<string, TrackedObject>;
  zone_occupancy: Record<string, string[]>;
  speed_analysis: Record<string, any>;
  summary: {
    total_tracks: number;
    active_tracks: number;
    class_counts: Record<string, number>;
  };
}

interface TrackingConfig {
  tracker_type: 'centroid' | 'kalman' | 'deep_sort' | 'byte_track';
  tracker_params: {
    max_disappeared?: number;
    max_distance?: number;
    use_kalman?: boolean;
  };
  speed_config?: {
    fps: number;
    pixel_to_meter_ratio: number;
  };
}

interface ModelConfig {
  name: string;
  classFilter?: string[];
}

export class TrackingWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Event handlers
  public onTrackingResults: ((results: TrackingResults) => void) | null = null;
  public onDetectionResults: ((detections: Detection[]) => void) | null = null;
  public onConnectionChange: ((connected: boolean) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  // State
  private streamId = `stream_${Date.now()}`;
  private isConnected = false;
  private trackingEnabled = false;
  private currentConfig: TrackingConfig = {
    tracker_type: 'centroid',
    tracker_params: {
      max_disappeared: 30,
      max_distance: 100,
      use_kalman: true
    },
    speed_config: {
      fps: 5,
      pixel_to_meter_ratio: .01
    }
  };

  // Statistics
  private stats = {
    totalTracks: 0,
    activeTracks: 0,
    classDistribution: {} as Record<string, number>
  };

  constructor(private wsUrl: string = 'ws://localhost:8000/ws') {}

  // Connection Management
  public async connect(): Promise<boolean> {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        return true;
      }

      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.clearReconnectInterval();
        this.onConnectionChange?.(true);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.onConnectionChange?.(false);

        if (event.code !== 1000) { // Not a normal closure
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError?.('WebSocket connection error');
      };

      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve(true);
          } else if (this.ws?.readyState === WebSocket.CLOSED) {
            resolve(false);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });

    } catch (error) {
      console.error('Failed to connect:', error);
      this.onError?.(`Connection failed: ${error}`);
      return false;
    }
  }

  public disconnect(): void {
    this.clearReconnectInterval();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onError?.('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private clearReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Message Handling
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'tracking_results':
          this.handleTrackingResults(message);
          break;
        case 'detections':
          this.handleDetectionResults(message);
          break;
        case 'tracking_configured':
          console.log('Tracking configured successfully');
          break;
        case 'tracking_started':
          this.trackingEnabled = true;
          console.log('Tracking started');
          break;
        case 'tracking_stopped':
          this.trackingEnabled = false;
          console.log('Tracking stopped');
          break;
        case 'tracker_stats':
          this.updateStats(message.stats);
          break;
        case 'zone_defined':
          console.log('Zone defined:', message.zone_id);
          break;
        case 'error':
          console.error('Server error:', message.message);
          this.onError?.(message.message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.onError?.('Failed to parse server response');
    }
  }

  private handleTrackingResults(message: any): void {
    const results: TrackingResults = message.results;

    // Update statistics
    this.stats = {
      totalTracks: results.summary.total_tracks,
      activeTracks: results.summary.active_tracks,
      classDistribution: results.summary.class_counts || {}
    };

    this.onTrackingResults?.(results);
  }

  private handleDetectionResults(message: any): void {
    // Handle regular detection results (without tracking)
    this.onDetectionResults?.(Object.values(message.results).map((e: any) => e.detections).flat());
  }

  private updateStats(stats: any): void {
    this.stats = { ...this.stats, ...stats };
  }

  // Tracking Configuration
  public async configureTracking(config: any = {}): Promise<void> {
    console.log(config, 'conf');
    const fullConfig: TrackingConfig = { ...this.currentConfig, ...config, speed_config: { ...this.currentConfig?.speed_config, pixel_to_meter_ratio: config?.pixel_to_meter_ratio} };
    this.currentConfig = fullConfig;

    const message = {
      type: 'configure_tracking',
      config: fullConfig
    };

    this.sendMessage(message);
  }

  public async startTracking(): Promise<void> {
    const message = {
      type: 'start_tracking',
      stream_id: this.streamId
    };

    this.sendMessage(message);
  }

  public async stopTracking(): Promise<void> {
    const message = {
      type: 'stop_tracking',
      stream_id: this.streamId
    };

    this.sendMessage(message);
  }

  public async getTrackerStats(): Promise<void> {
    const message = {
      type: 'get_tracker_stats',
      stream_id: this.streamId
    };

    this.sendMessage(message);
  }

  // Zone Management
  public defineZone(zoneId: string, polygonPoints: [number, number][], zoneType = 'detection'): void {
    const message = {
      type: 'define_zone',
      zone_id: zoneId,
      polygon_points: polygonPoints,
      zone_type: zoneType
    };

    this.sendMessage(message);
  }

  // Image Processing
  public async sendFrame(imageData: ArrayBuffer, models: ModelConfig[] = []): Promise<void> {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      // Create binary message following your existing format
      const timestamp = Math.floor(Date.now() / 1000);
      const modelCount = models.length;

      // Calculate buffer size
      let bufferSize = 4 + 1; // timestamp + model count

      models.forEach(model => {
        bufferSize += 1 + new TextEncoder().encode(model.name).length; // name length + name
        bufferSize += 1; // has class filter flag
        if (model.classFilter) {
          bufferSize += 1; // class count
          model.classFilter.forEach(className => {
            bufferSize += 1 + new TextEncoder().encode(className).length;
          });
        }
      });

      bufferSize += imageData.byteLength; // image data

      // Create buffer
      const buffer = new ArrayBuffer(bufferSize);
      const view = new DataView(buffer);
      let offset = 0;

      // Timestamp
      view.setUint32(offset, timestamp, true);
      offset += 4;

      // Model count
      view.setUint8(offset, modelCount);
      offset += 1;

      // For each model
      models.forEach(model => {
        const nameBytes = new TextEncoder().encode(model.name);
        view.setUint8(offset, nameBytes.length);
        offset += 1;

        for (let i = 0; i < nameBytes.length; i++) {
          view.setUint8(offset + i, nameBytes[i]);
        }
        offset += nameBytes.length;

        // Class filter
        if (model.classFilter && model.classFilter.length > 0) {
          view.setUint8(offset, 1); // has filter
          offset += 1;
          view.setUint8(offset, model.classFilter.length);
          offset += 1;

          model.classFilter.forEach(className => {
            const classBytes = new TextEncoder().encode(className);
            view.setUint8(offset, classBytes.length);
            offset += 1;

            for (let i = 0; i < classBytes.length; i++) {
              view.setUint8(offset + i, classBytes[i]);
            }
            offset += classBytes.length;
          });
        } else {
          view.setUint8(offset, 0); // no filter
          offset += 1;
        }
      });

      // Image data
      const imageBytes = new Uint8Array(imageData);
      for (let i = 0; i < imageBytes.length; i++) {
        view.setUint8(offset + i, imageBytes[i]);
      }

      // Send binary data
      this.ws.send(buffer);
    } catch (error) {
      console.error('Error sending frame:', error);
      this.onError?.('Failed to send frame data');
    }
  }

  // Utility Methods
  private sendMessage(message: any): void {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      this.onError?.('Failed to send message');
    }
  }

  // Getters
  public get connectionStatus(): boolean {
    return this.isConnected;
  }

  public get isTrackingEnabled(): boolean {
    return this.trackingEnabled;
  }

  public get statistics() {
    return { ...this.stats };
  }

  public get configuration(): TrackingConfig {
    return { ...this.currentConfig };
  }

  // Configuration Helpers
  public setTrackerType(type: TrackingConfig['tracker_type']): void {
    this.currentConfig.tracker_type = type;
  }

  public setMaxDisappeared(frames: number): void {
    this.currentConfig.tracker_params.max_disappeared = frames;
  }

  public setMaxDistance(pixels: number): void {
    this.currentConfig.tracker_params.max_distance = pixels;
  }

  public setSpeedConfig(fps: number, pixelToMeterRatio = 1.0): void {
    this.currentConfig.speed_config = {
      fps,
      pixel_to_meter_ratio: pixelToMeterRatio
    };
  }
}
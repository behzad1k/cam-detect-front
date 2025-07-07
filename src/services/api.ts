const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.10:8000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AvailableModelsResponse {
  models: string[];
  device: string;
}

export interface LoadModelResponse {
  success: boolean;
  model: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async getAvailableModels(): Promise<ApiResponse<AvailableModelsResponse>> {
    return this.request<AvailableModelsResponse>('/models');
  }

  async loadModel(modelName: string): Promise<ApiResponse<LoadModelResponse>> {
    return this.request<LoadModelResponse>(`/models/${modelName}/load`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();

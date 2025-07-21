'use client';

import { ModelInfo, UseModelsReturn } from '@/types';
import { useState, useEffect, useCallback } from 'react';


export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.10:8000';

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/models`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ModelInfo[] = await response.json();
      setModels(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const loadModel = useCallback(async (modelName: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/models/${modelName}/load`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh models list after loading
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Error loading model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model');
      return false;
    }
  }, [apiUrl, fetchModels]);

  const getModelClasses = useCallback(async (modelName: string): Promise<string[] | null> => {
    try {
      const response = await fetch(`${apiUrl}/models/${modelName}/classes`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.class_names || null;
    } catch (err) {
      console.error('Error fetching model classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch model classes');
      return null;
    }
  }, [apiUrl]);

  const refreshModels = useCallback(async () => {
    await fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    loadModel,
    getModelClasses,
    refreshModels
  };
}

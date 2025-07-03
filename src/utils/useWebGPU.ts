'use client';

import { useState, useEffect } from 'react';

// Extend Navigator interface to include gpu property
declare global {
  interface Navigator {
    gpu?: GPU;
  }
  
  // Minimal WebGPU type definitions
  interface GPU {
    requestAdapter(options?: object): Promise<GPUAdapter | null>;
  }
  
  interface GPUAdapter {
    readonly __brand: 'GPUAdapter'; // Brand to make it non-empty
  }
}

interface WebGPUSupport {
  supported: boolean;
  loading: boolean;
  error?: string;
}

export function useWebGPU(): WebGPUSupport {
  const [state, setState] = useState<WebGPUSupport>({
    supported: false,
    loading: true,
  });

  useEffect(() => {
    async function checkWebGPUSupport() {
      try {
        // Check if WebGPU is available
        if (!navigator.gpu) {
          setState({
            supported: false,
            loading: false,
            error: 'WebGPU not available in this browser',
          });
          return;
        }

        // Try to request a WebGPU adapter
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setState({
            supported: false,
            loading: false,
            error: 'WebGPU adapter not available',
          });
          return;
        }

        // WebGPU is supported and working
        setState({
          supported: true,
          loading: false,
        });
      } catch (error) {
        console.warn('WebGPU support check failed:', error);
        setState({
          supported: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown WebGPU error',
        });
      }
    }

    checkWebGPUSupport();
  }, []);

  return state;
} 
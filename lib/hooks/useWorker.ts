import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerMessage<T = any> {
  id: string;
  type: 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload: T;
}

export interface WorkerRequest<T = any> {
  id: string;
  type: string;
  payload: T;
}

export function useWorker(createWorker: () => Worker | null) {
  const callbacksRef = useRef<
    Map<
      string,
      {
        onSuccess: (data: any) => void;
        onError: (error: Error) => void;
        onProgress?: (progress: number, message?: string) => void;
      }
    >
  >(new Map());
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker client-side
  useEffect(() => {
    const activeWorker = createWorker();
    if (!activeWorker) return;

    workerRef.current = activeWorker;

    activeWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = event.data;
      const callbacks = callbacksRef.current.get(id);

      if (!callbacks) return;

      if (type === 'SUCCESS') {
        callbacks.onSuccess(payload);
        callbacksRef.current.delete(id);
      } else if (type === 'ERROR') {
        callbacks.onError(new Error(payload?.message || 'Worker processing failed'));
        callbacksRef.current.delete(id);
      } else if (type === 'PROGRESS') {
        if (callbacks.onProgress) {
          callbacks.onProgress(payload.progress, payload.message);
        }
      }
    };

    return () => {
      // Reject any pending promises before terminating
      callbacksRef.current.forEach((callbacks) => {
        callbacks.onError(new Error('Worker was terminated during cleanup'));
      });
      callbacksRef.current.clear();

      activeWorker.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  const postTask = useCallback(
    <Req = any, Res = any>(
      type: string,
      payload: Req,
      onProgress?: (progress: number, message?: string) => void
    ): Promise<Res> => {
      return new Promise<Res>((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = Math.random().toString(36).substring(2, 9);
        callbacksRef.current.set(id, {
          onSuccess: resolve,
          onError: reject,
          onProgress,
        });

        workerRef.current.postMessage({
          id,
          type,
          payload,
        } as WorkerRequest);
      });
    },
    []
  );

  return { postTask };
}

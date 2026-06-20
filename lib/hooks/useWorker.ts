import { useEffect, useRef, useCallback } from 'react';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload: T;
}

export interface WorkerRequest<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

interface WorkerStatusPayload {
  message?: string;
  progress?: number;
}

function toWorkerError(message: string, event?: ErrorEvent | MessageEvent) {
  if (event && 'message' in event && event.message) {
    return new Error(event.message);
  }
  return new Error(message);
}

export function useWorker(createWorker: () => Worker | null) {
  const callbacksRef = useRef<
    Map<
      string,
      {
        onSuccess: (data: unknown) => void;
        onError: (error: Error) => void;
        onProgress?: (progress: number, message?: string) => void;
      }
    >
  >(new Map());
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker client-side
  useEffect(() => {
    const callbacks = callbacksRef.current;
    const activeWorker = createWorker();
    if (!activeWorker) return;

    workerRef.current = activeWorker;

    activeWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = event.data;
      const activeCallbacks = callbacks.get(id);
      const status = payload as WorkerStatusPayload;

      if (!activeCallbacks) return;

      if (type === 'SUCCESS') {
        activeCallbacks.onSuccess(payload);
        callbacks.delete(id);
      } else if (type === 'ERROR') {
        activeCallbacks.onError(new Error(status.message || 'Worker processing failed'));
        callbacks.delete(id);
      } else if (type === 'PROGRESS') {
        if (activeCallbacks.onProgress && typeof status.progress === 'number') {
          activeCallbacks.onProgress(status.progress, status.message);
        }
      }
    };

    activeWorker.onerror = (event) => {
      callbacks.forEach((pending) => {
        pending.onError(toWorkerError('Worker failed to load or crashed', event));
      });
      callbacks.clear();
    };

    activeWorker.onmessageerror = (event) => {
      callbacks.forEach((pending) => {
        pending.onError(toWorkerError('Worker sent an unreadable message', event));
      });
      callbacks.clear();
    };

    return () => {
      // Reject any pending promises before terminating
      callbacks.forEach((pending) => {
        pending.onError(new Error('Worker was terminated during cleanup'));
      });
      callbacks.clear();

      activeWorker.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  const postTask = useCallback(
    <Req = unknown, Res = unknown>(
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
          onSuccess: (data) => resolve(data as Res),
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

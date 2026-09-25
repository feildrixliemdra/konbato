import { useEffect, useRef, useCallback } from 'react';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: 'READY' | 'PROGRESS' | 'SUCCESS' | 'ERROR' | 'PAGE';
  payload: T;
}

export interface WorkerRequest<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

/** A single page of a streamed multi-page result (see `PDF_TO_IMAGE`). */
export interface WorkerPagePayload {
  pageIndex: number;
  buffer: ArrayBuffer;
  mimeType: string;
}

interface WorkerStatusPayload {
  message?: string;
  progress?: number;
}

interface PendingTask {
  onSuccess: (data: unknown) => void;
  onError: (error: Error) => void;
  onProgress?: (progress: number, message?: string) => void;
  onPage?: (page: WorkerPagePayload) => void;
}

function toWorkerError(message: string, event?: ErrorEvent | MessageEvent) {
  if (event && 'message' in event && event.message) {
    return new Error(event.message);
  }
  return new Error(message);
}

export function useWorker(createWorker: () => Worker | null) {
  const callbacksRef = useRef<Map<string, PendingTask>>(new Map());
  const workerRef = useRef<Worker | null>(null);
  const isReadyRef = useRef(false);
  const queueRef = useRef<WorkerRequest[]>([]);

  // Initialize worker client-side
  useEffect(() => {
    const callbacks = callbacksRef.current;
    const activeWorker = createWorker();
    if (!activeWorker) return;

    workerRef.current = activeWorker;

    // A worker that dies never reports readiness again, so the queue would
    // never drain and every later postTask would hang forever. Rejecting the
    // pending tasks and dropping the queue keeps the failure visible.
    const failEverything = (message: string, event?: ErrorEvent | MessageEvent) => {
      queueRef.current = [];
      isReadyRef.current = false;

      callbacks.forEach((pending) => {
        pending.onError(toWorkerError(message, event));
      });
      callbacks.clear();
    };

    isReadyRef.current = false;
    queueRef.current = [];

    activeWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = event.data;

      // The worker announces readiness once its module has finished evaluating.
      // Work must not be posted before that: a `type: 'module'` worker whose
      // imports use top-level await (MuPDF's WASM init) has not installed its
      // handler yet, so messages posted in the meantime are dispatched with no
      // listener and silently lost, leaving the promise pending forever.
      if (type === 'READY') {
        isReadyRef.current = true;
        const queued = queueRef.current;
        queueRef.current = [];
        queued.forEach((request) => activeWorker.postMessage(request));
        return;
      }

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
      } else if (type === 'PAGE') {
        if (activeCallbacks.onPage) activeCallbacks.onPage(payload as WorkerPagePayload);
      }
    };

    activeWorker.onerror = (event) => {
      failEverything('Worker failed to load or crashed', event);
    };

    activeWorker.onmessageerror = (event) => {
      failEverything('Worker sent an unreadable message', event);
    };

    return () => {
      failEverything('Worker was terminated during cleanup');
      activeWorker.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  const postTask = useCallback(
    <Req = unknown, Res = unknown>(
      type: string,
      payload: Req,
      onProgress?: (progress: number, message?: string) => void,
      onPage?: (page: WorkerPagePayload) => void
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
          onPage,
        });

        const request = { id, type, payload } as WorkerRequest;

        if (isReadyRef.current) {
          workerRef.current.postMessage(request);
        } else {
          // Held until the worker reports READY.
          queueRef.current.push(request);
        }
      });
    },
    []
  );

  return { postTask };
}

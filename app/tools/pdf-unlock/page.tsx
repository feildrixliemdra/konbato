'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { FieldInput } from '@/components/tools/field-input';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';

const tool = requireTool('pdf-unlock');

interface PdfFile { name: string; size: number; buffer: ArrayBuffer; }
interface UnlockResult { buffer: ArrayBuffer; }

interface Unlocked { name: string; blobUrl: string; }

export default function PdfUnlockPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<Unlocked | null>(null);

  useEffect(() => {
    return () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); };
  }, [result]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    setResult(null);
    setPassword('');
    const target = selected[0];
    const loaded = await task.runTask(
      async () => ({ name: target.name, size: target.size, buffer: await target.arrayBuffer() }),
      { initialMessage: 'Reading document…', errorMessage: 'Could not read this PDF file.' }
    );
    if (loaded.ok) setFile(loaded.value);
  };

  const handleUnlock = async () => {
    if (!file) return;
    const outcome = await task.runTask(
      async () => {
        const response = await postTask<{ buffer: ArrayBuffer; password?: string }, UnlockResult>(
          'UNLOCK_PDF',
          { buffer: file.buffer.slice(0), password: password || undefined }
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return { name: `unlocked_${file.name}`, blobUrl: URL.createObjectURL(blob) };
      },
      { initialMessage: 'Removing password…', errorMessage: 'Could not unlock this PDF. Check the password and try again.' }
    );
    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => { setFile(null); setResult(null); setPassword(''); task.reset(); };

  return (
    <ToolPageShell title={tool.title} description="Remove a password from a PDF entirely in your browser — nothing is uploaded." icon={tool.icon} category={tool.category}>
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload password-protected PDF to unlock" />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <ToolPanel>
                <h2 className="text-sm font-bold font-manrope">File Details</h2>
                <p className="truncate text-xs text-muted-foreground font-dm-sans">{file.name} · {formatSize(file.size)}</p>
              </ToolPanel>
            </div>
            <ToolPanel title="Unlock" sticky>
              <FieldInput id="unlock-password" type="password" placeholder="Password (if protected)" value={password} onChange={(e) => setPassword(e.target.value)} disabled={task.isProcessing} />
              <PanelPrimaryAction category={tool.category} onClick={handleUnlock} disabled={task.isProcessing}>
                {task.isProcessing ? 'Unlocking…' : 'Unlock PDF'}
              </PanelPrimaryAction>
              <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>Change File</PanelSecondaryAction>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard title="PDF Unlocked" description="The password was removed in your browser." actions={
          <>
            <Button variant="outline" onClick={clearWorkspace} className="flex-1 py-5 text-xs font-semibold">Start Over</Button>
            <Button asChild className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}>
              <a href={result.blobUrl} download={result.name}>
                <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                Download PDF
              </a>
            </Button>
          </>
        } />
      )}
      {task.isProcessing && <ProcessingOverlay category={tool.category} message={task.message} progress={task.progress} />}
    </ToolPageShell>
  );
}

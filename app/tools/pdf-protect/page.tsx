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

const tool = requireTool('pdf-protect');

interface PdfFile { name: string; size: number; buffer: ArrayBuffer; }
interface ProtectResult { buffer: ArrayBuffer; }
interface Protected { name: string; blobUrl: string; }

export default function PdfProtectPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [result, setResult] = useState<Protected | null>(null);

  useEffect(() => {
    return () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); };
  }, [result]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    setResult(null);
    setPassword('');
    setConfirm('');
    const target = selected[0];
    const loaded = await task.runTask(
      async () => ({ name: target.name, size: target.size, buffer: await target.arrayBuffer() }),
      { initialMessage: 'Reading document…', errorMessage: 'Could not read this PDF file.' }
    );
    if (loaded.ok) setFile(loaded.value);
  };

  const passwordValid = password.length > 0 && password === confirm && !/[,=:]/.test(password);

  const handleProtect = async () => {
    if (!file || !passwordValid) return;
    const outcome = await task.runTask(
      async () => {
        const response = await postTask<{ buffer: ArrayBuffer; userPassword: string; ownerPassword?: string }, ProtectResult>(
          'PROTECT_PDF',
          { buffer: file.buffer.slice(0), userPassword: password, ownerPassword: password }
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return { name: `protected_${file.name}`, blobUrl: URL.createObjectURL(blob) };
      },
      { initialMessage: 'Encrypting document…', errorMessage: 'Could not protect this PDF.' }
    );
    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => { setFile(null); setResult(null); setPassword(''); setConfirm(''); task.reset(); };

  return (
    <ToolPageShell title={tool.title} description="Add a password and encryption to a PDF without uploading it." icon={tool.icon} category={tool.category}>
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload PDF document to protect" />
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
            <ToolPanel title="Protect" sticky>
              <FieldInput id="protect-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={task.isProcessing} />
              <FieldInput id="protect-confirm" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={task.isProcessing} />
              <p className="text-xs text-muted-foreground font-dm-sans">Passwords cannot contain , = or :</p>
              <PanelPrimaryAction category={tool.category} onClick={handleProtect} disabled={!passwordValid || task.isProcessing}>
                {task.isProcessing ? 'Protecting…' : 'Protect PDF'}
              </PanelPrimaryAction>
              <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>Change File</PanelSecondaryAction>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard title="PDF Protected" description="Your PDF is now encrypted with a password." actions={
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

'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';

const tool = requireTool('pdf-page-number');

interface PdfFile { name: string; buffer: ArrayBuffer; }
interface NumberResult { buffer: ArrayBuffer; }
interface Numbered { name: string; blobUrl: string; }

export default function PdfPageNumberPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PdfFile | null>(null);
  const [result, setResult] = useState<Numbered | null>(null);

  useEffect(() => {
    return () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); };
  }, [result]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    setResult(null);
    const target = selected[0];
    const loaded = await task.runTask(
      async () => ({ name: target.name, buffer: await target.arrayBuffer() }),
      { initialMessage: 'Reading document…', errorMessage: 'Could not read this PDF file.' }
    );
    if (loaded.ok) setFile(loaded.value);
  };

  const handleNumber = async () => {
    if (!file) return;
    const outcome = await task.runTask(
      async (report) => {
        const response = await postTask<{ buffer: ArrayBuffer; color?: string }, NumberResult>(
          'PAGE_NUMBER_PDF',
          { buffer: file.buffer.slice(0), color: '#000000' },
          (progress, message) => report(progress, message)
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return { name: `numbered_${file.name}`, blobUrl: URL.createObjectURL(blob) };
      },
      { initialMessage: 'Adding page numbers…', errorMessage: 'Could not add page numbers.' }
    );
    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => { setFile(null); setResult(null); task.reset(); };

  return (
    <ToolPageShell title={tool.title} description='Stamp "Page N of M" onto every page of a PDF locally.' icon={tool.icon} category={tool.category}>
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload PDF document to add page numbers" />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <ToolPanel title="Numbering">
            <p className="truncate text-xs font-semibold text-foreground font-dm-sans">{file.name}</p>
            <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
              Adds &ldquo;Page N of M&rdquo; at the bottom-center of every page.
            </p>
            <PanelPrimaryAction category={tool.category} onClick={handleNumber} disabled={task.isProcessing}>
              {task.isProcessing ? 'Numbering…' : 'Add Page Numbers'}
            </PanelPrimaryAction>
            <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>Change File</PanelSecondaryAction>
          </ToolPanel>
        </div>
      ) : (
        <SuccessCard title="Page Numbers Added" description="Every page now carries a page number." actions={
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

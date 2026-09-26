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

const tool = requireTool('pdf-crop');

interface PdfFile { name: string; buffer: ArrayBuffer; }
interface CropResult { buffer: ArrayBuffer; }
interface Cropped { name: string; blobUrl: string; }

export default function PdfCropPage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PdfFile | null>(null);
  const [margins, setMargins] = useState({ top: '0', right: '0', bottom: '0', left: '0' });
  const [result, setResult] = useState<Cropped | null>(null);

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

  const setMargin = (key: 'top' | 'right' | 'bottom' | 'left', value: string) =>
    setMargins((prev) => ({ ...prev, [key]: value }));

  const handleCrop = async () => {
    if (!file) return;
    const outcome = await task.runTask(
      async () => {
        const response = await postTask<{ buffer: ArrayBuffer; margins: { top: number; right: number; bottom: number; left: number } }, CropResult>(
          'CROP_PDF',
          {
            buffer: file.buffer.slice(0),
            margins: {
              top: Number(margins.top) || 0,
              right: Number(margins.right) || 0,
              bottom: Number(margins.bottom) || 0,
              left: Number(margins.left) || 0,
            },
          }
        );
        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return { name: `cropped_${file.name}`, blobUrl: URL.createObjectURL(blob) };
      },
      { initialMessage: 'Cropping pages…', errorMessage: 'PDF crop failed.' }
    );
    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => { setFile(null); setResult(null); task.reset(); };

  return (
    <ToolPageShell title={tool.title} description="Trim margins from every page of a PDF locally." icon={tool.icon} category={tool.category}>
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload PDF document to crop" />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <ToolPanel>
                <h2 className="text-sm font-bold font-manrope">File Details</h2>
                <p className="truncate text-xs text-muted-foreground font-dm-sans">{file.name}</p>
              </ToolPanel>
            </div>
            <ToolPanel title="Crop margins (points)" sticky>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput id="crop-top" type="number" placeholder="Top (pt)" value={margins.top} onChange={(e) => setMargin('top', e.target.value)} disabled={task.isProcessing} />
                <FieldInput id="crop-right" type="number" placeholder="Right (pt)" value={margins.right} onChange={(e) => setMargin('right', e.target.value)} disabled={task.isProcessing} />
                <FieldInput id="crop-bottom" type="number" placeholder="Bottom (pt)" value={margins.bottom} onChange={(e) => setMargin('bottom', e.target.value)} disabled={task.isProcessing} />
                <FieldInput id="crop-left" type="number" placeholder="Left (pt)" value={margins.left} onChange={(e) => setMargin('left', e.target.value)} disabled={task.isProcessing} />
              </div>
              <PanelPrimaryAction category={tool.category} onClick={handleCrop} disabled={task.isProcessing}>
                {task.isProcessing ? 'Cropping…' : 'Crop PDF'}
              </PanelPrimaryAction>
              <PanelSecondaryAction onClick={clearWorkspace} disabled={task.isProcessing}>Change File</PanelSecondaryAction>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard title="PDF Cropped" description="Margins were trimmed from every page." actions={
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

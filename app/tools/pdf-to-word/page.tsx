'use client';

import { useEffect, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { Button } from '@/components/ui/button';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { pdfToWordBlob } from '@/lib/pdf-word';

const tool = requireTool('pdf-to-word');

export default function PdfToWordPage() {
  const task = useToolTask();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    return () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); };
  }, [downloadUrl]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');

    const target = selected[0];
    const outcome = await task.runTask(
      async () => {
        const blob = await pdfToWordBlob(await target.arrayBuffer());
        return { blob, base: target.name.replace(/\.pdf$/i, '') };
      },
      { initialMessage: 'Building Word document…', errorMessage: 'Could not convert this PDF to Word.' }
    );

    if (outcome.ok) {
      const name = `${outcome.value.base}.docx`;
      setDownloadName(name);
      setDownloadUrl(URL.createObjectURL(outcome.value.blob));
    }
  };

  const reset = () => { setDownloadUrl(''); setDownloadName(''); };

  return (
    <ToolPageShell title={tool.title} description="Extract a PDF as an editable .docx locally — text only, no upload." icon={tool.icon} category={tool.category}>
      <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
      {!downloadUrl ? (
        <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload PDF document to convert to Word" />
      ) : (
        <SuccessCard title="Word Document Ready" description="Your document was extracted locally." actions={
          <>
            <Button variant="outline" onClick={reset} className="flex-1 py-5 text-xs font-semibold">Start Over</Button>
            <Button asChild className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}>
              <a href={downloadUrl} download={downloadName}>
                <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                Download .docx
              </a>
            </Button>
          </>
        } />
      )}
      {task.isProcessing && <ProcessingOverlay category={tool.category} message={task.message} progress={task.progress} />}
    </ToolPageShell>
  );
}

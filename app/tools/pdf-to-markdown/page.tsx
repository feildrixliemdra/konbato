'use client';

import { useEffect, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { Button } from '@/components/ui/button';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { pdfToMarkdown } from '@/lib/pdf-markdown';

const tool = requireTool('pdf-to-markdown');

export default function PdfToMarkdownPage() {
  const task = useToolTask();
  const [markdown, setMarkdown] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');

  useEffect(() => {
    return () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); };
  }, [downloadUrl]);

  const handleFilesSelected = async (selected: File[]) => {
    if (selected.length === 0) return;
    setMarkdown('');
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');

    const target = selected[0];
    const outcome = await task.runTask(
      async () => {
        const text = await pdfToMarkdown(await target.arrayBuffer());
        return { text, base: target.name.replace(/\.pdf$/i, '') };
      },
      { initialMessage: 'Extracting text…', errorMessage: 'Could not extract text from this PDF.' }
    );

    if (outcome.ok) {
      setMarkdown(outcome.value.text);
      const name = `${outcome.value.base}.md`;
      setDownloadName(name);
      setDownloadUrl(URL.createObjectURL(new Blob([outcome.value.text], { type: 'text/markdown' })));
    }
  };

  return (
    <ToolPageShell title={tool.title} description="Extract a PDF as Markdown text locally — nothing is uploaded." icon={tool.icon} category={tool.category}>
      <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
      {!markdown ? (
        <FileUploadZone accept="application/pdf" multiple={false} onFilesSelected={handleFilesSelected} description="Upload PDF document to extract as Markdown" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button asChild className={`text-xs font-semibold ${ACCENTS[tool.category].button}`}>
              <a href={downloadUrl} download={downloadName}>
                <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                Download {downloadName}
              </a>
            </Button>
            <Button variant="outline" onClick={() => { setMarkdown(''); setDownloadUrl(''); }} className="text-xs font-semibold">
              Start Over
            </Button>
          </div>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border/50 bg-muted/20 p-4 text-xs font-dm-sans text-foreground">
            {markdown}
          </pre>
        </div>
      )}
      {task.isProcessing && <ProcessingOverlay category={tool.category} message={task.message} progress={task.progress} />}
    </ToolPageShell>
  );
}

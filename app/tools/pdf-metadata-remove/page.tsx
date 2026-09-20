'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { ProcessingOverlay } from '@/components/tools/processing-overlay';
import { TaskErrorBanner } from '@/components/tools/task-error-banner';
import { SuccessCard } from '@/components/tools/success-card';
import { PanelPrimaryAction, PanelSecondaryAction, ToolPanel } from '@/components/tools/tool-panel';
import { NotePanel } from '@/components/tools/note-panel';
import { Button } from '@/components/ui/button';
import { useWorker } from '@/lib/hooks/useWorker';
import { useToolTask } from '@/lib/hooks/useToolTask';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, FileEditIcon } from '@hugeicons/core-free-icons';
import { ACCENTS, requireTool } from '@/lib/tools';
import { formatSize } from '@/lib/format';

const tool = requireTool('pdf-metadata-remove');

interface PDFFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface PDFWorkerResult {
  buffer: ArrayBuffer;
}

interface MetadataResult {
  name: string;
  originalSize: number;
  scrubbedSize: number;
  blobUrl: string;
}

interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

const pdfMetadataFields = [
  { key: 'info:Title', label: 'Title', token: 'Title' },
  { key: 'info:Author', label: 'Author', token: 'Author' },
  { key: 'info:Subject', label: 'Subject', token: 'Subject' },
  { key: 'info:Keywords', label: 'Keywords', token: 'Keywords' },
  { key: 'info:Creator', label: 'Creator', token: 'Creator' },
  { key: 'info:Producer', label: 'Producer', token: 'Producer' },
  { key: 'info:CreationDate', label: 'Creation date', token: 'CreationDate' },
  { key: 'info:ModDate', label: 'Modified date', token: 'ModDate' },
  { key: 'info:Trapped', label: 'Trapped flag', token: 'Trapped' },
];

function decodePdfString(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped: string) => {
      if (escaped === 'n') return '\n';
      if (escaped === 'r') return '\r';
      if (escaped === 't') return '\t';
      if (escaped === 'b') return '\b';
      if (escaped === 'f') return '\f';
      return escaped;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) =>
      String.fromCharCode(parseInt(octal, 8))
    )
    .trim();
}

function inspectPdfMetadata(buffer: ArrayBuffer): MetadataEntry[] {
  const source = new TextDecoder('latin1', { fatal: false }).decode(
    new Uint8Array(buffer)
  );

  return pdfMetadataFields.flatMap(({ key, label, token }) => {
    const literalMatch = source.match(new RegExp(`/${token}\\s*\\(([^)]*)\\)`));
    if (literalMatch?.[1]) {
      return [{ key, label, value: decodePdfString(literalMatch[1]) }];
    }

    const nameMatch = source.match(new RegExp(`/${token}\\s*/([^\\s<>\\[\\]()/]+)`));
    if (nameMatch?.[1]) {
      return [{ key, label, value: nameMatch[1].trim() }];
    }

    return [];
  });
}

export default function PDFMetadataRemovePage() {
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
      type: 'module',
    });
  }, []);
  const { postTask } = useWorker(createWorker);
  const task = useToolTask();

  const [file, setFile] = useState<PDFFile | null>(null);
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);

  useEffect(() => {
    return () => {
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    };
  }, [result]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setResult(null);
    setMetadata([]);

    const targetFile = selectedFiles[0];
    const loaded = await task.runTask(
      async () => {
        const buffer = await targetFile.arrayBuffer();
        return {
          name: targetFile.name,
          size: targetFile.size,
          buffer,
          metadata: inspectPdfMetadata(buffer),
        };
      },
      {
        initialMessage: 'Reading document…',
        errorMessage: 'Could not read this PDF file.',
      }
    );

    if (!loaded.ok) return;
    setMetadata(loaded.value.metadata);
    setFile({
      name: loaded.value.name,
      size: loaded.value.size,
      buffer: loaded.value.buffer,
    });
  };

  const handleRemoveMetadata = async () => {
    if (!file) return;

    const outcome = await task.runTask(
      async () => {
        const response = await postTask<{ buffer: ArrayBuffer }, PDFWorkerResult>(
          'STRIP_PDF_METADATA',
          { buffer: file.buffer.slice(0) }
        );

        const blob = new Blob([response.buffer], { type: 'application/pdf' });
        return {
          name: `metadata_removed_${file.name}`,
          originalSize: file.size,
          scrubbedSize: blob.size,
          blobUrl: URL.createObjectURL(blob),
        };
      },
      {
        initialMessage: 'Clearing document information fields…',
        errorMessage: 'PDF metadata removal failed.',
      }
    );

    if (outcome.ok) setResult(outcome.value);
  };

  const clearWorkspace = () => {
    setFile(null);
    setResult(null);
    setMetadata([]);
    task.reset();
  };

  return (
    <ToolPageShell
      title={tool.title}
      description="Remove common document information fields from a PDF locally. This privacy scrub does not guarantee forensic sanitization."
      icon={tool.icon}
      category={tool.category}
    >
      {!file ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to scrub metadata"
          />
        </div>
      ) : !result ? (
        <div className="flex flex-col gap-6">
          <TaskErrorBanner message={task.error} onDismiss={task.clearError} />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <ToolPanel>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENTS[tool.category].tile}`}
                  >
                    <HugeiconsIcon icon={FileEditIcon} className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold font-manrope">File Details</h2>
                    <p className="truncate text-xs text-muted-foreground font-dm-sans">
                      {file.name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-dm-sans">
                      Original Size
                    </span>
                    <p className="mt-1 text-sm font-bold font-manrope">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-dm-sans">
                      Output Name
                    </span>
                    <p className="mt-1 truncate text-sm font-bold font-manrope">
                      metadata_removed_{file.name}
                    </p>
                  </div>
                </div>

                <NotePanel>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold font-manrope">Metadata Found</h3>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${ACCENTS[tool.category].tile}`}
                    >
                      {metadata.length} field{metadata.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {metadata.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-dm-sans">
                      No common title, author, subject, keyword, creator, producer, or date
                      fields were detected.
                    </p>
                  ) : (
                    <div className="grid gap-2 text-xs font-dm-sans sm:grid-cols-2">
                      {metadata.map((entry) => (
                        <div
                          key={entry.key}
                          className="rounded-lg border border-border/40 bg-background/70 p-3"
                        >
                          <div className="font-semibold text-foreground">{entry.label}</div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {entry.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </NotePanel>
              </ToolPanel>
            </div>

            <ToolPanel title="Export" sticky>
              <p className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
                The PDF is saved again with common info fields cleared while preserving the
                document structure.
              </p>
              <PanelPrimaryAction category={tool.category}
                onClick={handleRemoveMetadata}
                disabled={task.isProcessing}
              >
                {task.isProcessing ? 'Removing Metadata…' : 'Remove Metadata'}
              </PanelPrimaryAction>
              <PanelSecondaryAction
                onClick={clearWorkspace}
                disabled={task.isProcessing}
              >
                Change File
              </PanelSecondaryAction>
            </ToolPanel>
          </div>
        </div>
      ) : (
        <SuccessCard
          title="Metadata Removed"
          description="Common PDF document information fields were cleared in your browser."
          actions={
            <>
              <Button
                variant="outline"
                onClick={clearWorkspace}
                className="flex-1 py-5 text-xs font-semibold"
              >
                Start Over
              </Button>
              <Button
                asChild
                className={`flex-1 py-5 text-xs font-semibold ${ACCENTS[tool.category].button}`}
              >
                <a href={result.blobUrl} download={result.name}>
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 size-4" aria-hidden />
                  Download PDF
                </a>
              </Button>
            </>
          }
        >
          <div className="grid w-full grid-cols-2 divide-x divide-border/50 overflow-hidden rounded-xl border border-border/50 bg-muted/20 text-center font-dm-sans">
            <div className="py-4">
              <span className="text-xs font-semibold text-muted-foreground">
                ORIGINAL
              </span>
              <p className="text-sm font-bold">{formatSize(result.originalSize)}</p>
            </div>
            <div className="py-4">
              <span className="text-xs font-semibold text-muted-foreground">
                SCRUBBED
              </span>
              <p className="text-sm font-bold text-success">
                {formatSize(result.scrubbedSize)}
              </p>
            </div>
          </div>
        </SuccessCard>
      )}

      {task.isProcessing && (
        <ProcessingOverlay
          category={tool.category}
          message={task.message}
          progress={task.progress}
        />
      )}
    </ToolPageShell>
  );
}

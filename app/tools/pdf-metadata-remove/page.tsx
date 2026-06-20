'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useWorker } from '@/lib/hooks/useWorker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  Download01Icon,
  FileEditIcon,
  Shield01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';

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

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
}

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
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(parseInt(octal, 8)))
    .trim();
}

function inspectPdfMetadata(buffer: ArrayBuffer): MetadataEntry[] {
  const source = new TextDecoder('latin1', { fatal: false }).decode(new Uint8Array(buffer));

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
    return new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  }, []);
  const { postTask } = useWorker(createWorker);

  const [file, setFile] = useState<PDFFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
  const [isInspecting, setIsInspecting] = useState(false);

  useEffect(() => {
    return () => {
      if (result?.blobUrl) {
        URL.revokeObjectURL(result.blobUrl);
      }
    };
  }, [result]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const targetFile = selectedFiles[0];
    setResult(null);
    setMetadata([]);
    setProgressMessage('');
    setIsInspecting(true);
    const buffer = await targetFile.arrayBuffer();
    setFile({
      name: targetFile.name,
      size: targetFile.size,
      buffer,
    });

    try {
      setMetadata(inspectPdfMetadata(buffer));
    } catch (err) {
      console.error(err);
      setProgressMessage('Could not inspect PDF metadata.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleRemoveMetadata = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setProgressMessage('Reading PDF metadata...');

    try {
      const response = await postTask<{ buffer: ArrayBuffer }, PDFWorkerResult>(
        'STRIP_PDF_METADATA',
        { buffer: file.buffer.slice(0) },
        (pct, msg) => {
          setProgress(pct);
          if (msg) setProgressMessage(msg);
        }
      );

      const blob = new Blob([response.buffer], { type: 'application/pdf' });
      setResult({
        name: `metadata_removed_${file.name}`,
        originalSize: file.size,
        scrubbedSize: blob.size,
        blobUrl: URL.createObjectURL(blob),
      });
      setProgress(100);
      setProgressMessage('Metadata removal complete.');
    } catch (err) {
      console.error(err);
      setProgressMessage('PDF metadata removal failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setResult(null);
    setMetadata([]);
    setProgressMessage('');
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-slate-500/20 bg-background">
      <SiteHeader />

      <main className="flex-1 container py-8 md:py-12 max-w-4xl">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          Back to Tools
        </Link>

        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 border border-slate-500/20">
              <HugeiconsIcon icon={Shield01Icon} className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope">PDF Metadata Remover</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-dm-sans max-w-2xl">
            Remove common document information fields from a PDF locally. This privacy scrub does not guarantee forensic sanitization.
          </p>
        </div>

        {!file ? (
          <FileUploadZone
            accept="application/pdf"
            multiple={false}
            onFilesSelected={handleFilesSelected}
            description="Upload PDF document to scrub metadata"
          />
        ) : !result ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600">
                    <HugeiconsIcon icon={FileEditIcon} className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm font-manrope">File Details</h3>
                    <p className="truncate text-xs text-muted-foreground font-dm-sans">{file.name}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-dm-sans">
                      Original Size
                    </span>
                    <p className="mt-1 text-sm font-bold font-manrope">{formatSize(file.size)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-dm-sans">
                      Output Name
                    </span>
                    <p className="mt-1 truncate text-sm font-bold font-manrope">metadata_removed_{file.name}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/5 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold font-manrope">Metadata Found</h4>
                    <span className="rounded-md bg-slate-500/10 px-2 py-1 text-[10px] font-bold text-slate-700">
                      {isInspecting ? 'Scanning...' : `${metadata.length} field${metadata.length === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {isInspecting ? (
                    <p className="text-xs text-muted-foreground font-dm-sans">
                      Reading common PDF document information fields...
                    </p>
                  ) : metadata.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-dm-sans">
                      No common title, author, subject, keyword, creator, producer, or date fields were detected.
                    </p>
                  ) : (
                    <div className="grid gap-2 text-xs font-dm-sans sm:grid-cols-2">
                      {metadata.map((entry) => (
                        <div key={entry.key} className="rounded-lg border border-border/40 bg-background/70 p-3">
                          <div className="font-semibold text-foreground">{entry.label}</div>
                          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{entry.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col gap-5 md:sticky md:top-6 md:self-start">
              <h3 className="font-bold text-sm font-manrope border-b border-border/40 pb-3">
                Export
              </h3>
              <p className="text-xs text-muted-foreground font-dm-sans leading-relaxed">
                The PDF is saved again with common info fields cleared while preserving the document structure.
              </p>
              <Button
                onClick={handleRemoveMetadata}
                disabled={isProcessing || isInspecting}
                className="w-full font-semibold font-manrope bg-slate-700 hover:bg-slate-800 text-white shadow-lg shadow-slate-600/15"
              >
                {isProcessing ? 'Removing Metadata...' : 'Remove Metadata'}
              </Button>
              <Button variant="ghost" onClick={clearWorkspace} disabled={isProcessing} className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground">
                Change File
              </Button>
            </Card>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
            <Card className="p-8 border-border/60 bg-background/50 backdrop-blur-sm flex flex-col items-center gap-6 text-center shadow-xl">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <HugeiconsIcon icon={Tick01Icon} className="size-7" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-2xl font-manrope">Metadata Removed</h3>
                <p className="text-sm text-muted-foreground font-dm-sans">
                  Common PDF document information fields were cleared in your browser.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl border border-border/50 bg-muted/20 text-center font-dm-sans divide-x divide-border/50">
                <div className="py-4">
                  <span className="text-[10px] font-semibold text-muted-foreground">ORIGINAL</span>
                  <p className="text-sm font-bold">{formatSize(result.originalSize)}</p>
                </div>
                <div className="py-4">
                  <span className="text-[10px] font-semibold text-muted-foreground">SCRUBBED</span>
                  <p className="text-sm font-bold text-emerald-600">{formatSize(result.scrubbedSize)}</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={clearWorkspace} className="flex-1 font-semibold text-xs py-5">
                  Start Over
                </Button>
                <Button asChild className="flex-1 font-semibold text-xs py-5 bg-slate-700 hover:bg-slate-800 text-white shadow-lg shadow-slate-600/15">
                  <a href={result.blobUrl} download={result.name}>
                    <HugeiconsIcon icon={Download01Icon} className="size-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-6 max-w-sm w-full mx-4 border-border/60 flex flex-col items-center gap-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
              <div className="flex flex-col gap-1 w-full">
                <span className="text-sm font-semibold font-manrope">{progressMessage}</span>
                <span className="text-xs text-muted-foreground font-dm-sans">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

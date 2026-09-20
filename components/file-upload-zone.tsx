'use client';

import React, { useRef, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Upload01Icon,
  Cancel01Icon,
  File01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { DeviceWarning } from './device-warning';
import { formatSize } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  accept: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  description?: string;
}

interface RejectedFile {
  name: string;
  reason: string;
}

export function FileUploadZone({
  accept,
  multiple = false,
  maxSizeMB = 500,
  onFilesSelected,
  className = '',
  description = 'Drag and drop files here or click to browse',
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const processFiles = useCallback(
    (files: FileList) => {
      const validFiles: File[] = [];
      const rejected: RejectedFile[] = [];
      let sizeSum = 0;

      const acceptTypes = accept.split(',').map((t) => t.trim().toLowerCase());

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const matchesMime = acceptTypes.some((acceptType) => {
          if (acceptType.startsWith('.')) {
            return fileExtension === acceptType;
          }
          if (acceptType.endsWith('/*')) {
            const category = acceptType.replace('/*', '');
            return file.type.startsWith(category);
          }
          return file.type === acceptType;
        });

        if (!matchesMime) {
          rejected.push({ name: file.name, reason: 'Unsupported file type' });
          continue;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          rejected.push({
            name: file.name,
            reason: `Larger than the ${maxSizeMB} MB limit`,
          });
          continue;
        }

        validFiles.push(file);
        sizeSum += file.size;
      }

      setRejectedFiles(rejected);
      if (rejected.length > 0) {
        toast.error(
          `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped`,
          {
            description: rejected
              .slice(0, 3)
              .map((file) => `${file.name}: ${file.reason}`)
              .join('\n'),
          }
        );
      }

      if (validFiles.length > 0) {
        const updatedFiles = multiple
          ? [...selectedFiles, ...validFiles]
          : [validFiles[0]];
        setSelectedFiles(updatedFiles);
        setTotalSize(multiple ? totalSize + sizeSum : sizeSum);
        onFilesSelected(updatedFiles);
      }
    },
    [accept, multiple, maxSizeMB, selectedFiles, totalSize, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles]
  );

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updated);

    const newSize = updated.reduce((acc, f) => acc + f.size, 0);
    setTotalSize(newSize);
    onFilesSelected(updated);
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Device Resource Warning */}
      {totalSize > 0 && <DeviceWarning fileSizeInBytes={totalSize} />}

      {/* Main Drag-Drop Box */}
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={description}
        whileHover={{ scale: 0.995 }}
        whileTap={{ scale: 0.985 }}
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-[background-color,border-color] duration-300 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-[220px] sm:p-12 ${
          isDragActive
            ? 'border-primary bg-primary/5 shadow-inner'
            : 'border-border/80 bg-background/50 hover:border-primary/40 hover:bg-muted/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border/40 bg-muted/60 text-muted-foreground sm:size-14">
            <HugeiconsIcon
              icon={Upload01Icon}
              className="size-5 text-muted-foreground/80 sm:size-6"
              aria-hidden
            />
          </div>
          <div className="flex max-w-sm flex-col gap-1">
            <span className="text-xs font-semibold font-manrope text-foreground sm:text-sm">
              {description}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
              Files are processed 100% locally on your machine.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Rejected Files */}
      <div aria-live="polite">
        <AnimatePresence>
          {rejectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold font-manrope text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-4" aria-hidden />
                {rejectedFiles.length} file
                {rejectedFiles.length > 1 ? 's' : ''} could not be added
              </div>
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground font-dm-sans">
                {rejectedFiles.slice(0, 4).map((file) => (
                  <li key={file.name} className="truncate">
                    <span className="font-semibold text-foreground/80">
                      {file.name}
                    </span>
                    : {file.reason}
                  </li>
                ))}
                {rejectedFiles.length > 4 && (
                  <li>and {rejectedFiles.length - 4} more…</li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground font-dm-sans">
              <span>Selected Files ({selectedFiles.length})</span>
              <span>Total Size: {formatSize(totalSize)}</span>
            </div>

            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-xl border border-border/40 bg-muted/10 p-1">
              {selectedFiles.map((file, idx) => (
                <motion.div
                  key={file.name + '-' + idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background p-3"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
                      <HugeiconsIcon icon={File01Icon} className="size-4" aria-hidden />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-xs font-semibold font-manrope text-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-dm-sans">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    aria-label={`Remove ${file.name}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground/60 transition-[color,background-color] hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" aria-hidden />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

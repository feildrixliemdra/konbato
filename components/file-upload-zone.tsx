'use client';

import React, { useRef, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Upload01Icon,
  Cancel01Icon,
  File01Icon,
} from '@hugeicons/core-free-icons';
import { DeviceWarning } from './device-warning';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadZoneProps {
  accept: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  description?: string;
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

  const processFiles = useCallback((files: FileList) => {
    const validFiles: File[] = [];
    let sizeSum = 0;

    // Convert file accepted extensions to regex
    const acceptTypes = accept
      .split(',')
      .map((t) => t.trim().toLowerCase());

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

      if (matchesMime && file.size <= maxSizeMB * 1024 * 1024) {
        validFiles.push(file);
        sizeSum += file.size;
      }
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : [validFiles[0]];
      setSelectedFiles(updatedFiles);
      setTotalSize(multiple ? totalSize + sizeSum : sizeSum);
      onFilesSelected(updatedFiles);
    }
  }, [accept, multiple, maxSizeMB, selectedFiles, totalSize, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (indexToRemove: number) => {
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updated);
    
    const newSize = updated.reduce((acc, f) => acc + f.size, 0);
    setTotalSize(newSize);
    onFilesSelected(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        onClick={onButtonClick}
        whileHover={{ scale: 0.995 }}
        whileTap={{ scale: 0.985 }}
        className={`relative flex flex-col items-center justify-center p-6 sm:p-12 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 min-h-[160px] sm:min-h-[220px] ${
          isDragActive
            ? 'border-primary bg-primary/5 shadow-inner'
            : 'border-border/80 hover:border-primary/40 hover:bg-muted/10 bg-background/50'
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
          <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground transition-transform group-hover:scale-105 border border-border/40">
            <HugeiconsIcon icon={Upload01Icon} className="size-5 sm:size-6 text-muted-foreground/80" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="text-xs sm:text-sm font-semibold font-manrope text-foreground">
              {description}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-dm-sans leading-relaxed">
              Files are processed 100% locally on your machine.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground px-1 font-dm-sans">
              <span>Selected Files ({selectedFiles.length})</span>
              <span>Total Size: {formatSize(totalSize)}</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto flex flex-col gap-2 p-1 border border-border/40 rounded-xl bg-muted/10">
              {selectedFiles.map((file, idx) => (
                <motion.div
                  key={file.name + '-' + idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 bg-background border border-border/40 rounded-lg justify-between"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                      <HugeiconsIcon icon={File01Icon} className="size-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-foreground truncate font-manrope">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-dm-sans">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all shrink-0"
                    title="Remove file"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
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

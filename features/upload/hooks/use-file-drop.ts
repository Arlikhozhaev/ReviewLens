"use client";

import { useState, useCallback, useRef } from "react";
import type { DragEvent, ChangeEvent, RefObject } from "react";

interface UseFileDropReturn {
  isDragging: boolean;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  openFilePicker: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function useFileDrop(onFile: (file: File) => void): UseFileDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      // Accept .csv by MIME type OR extension — OS/browser MIME for CSV
      // is inconsistent (text/csv, application/csv, text/plain).
      // Real content validation happens inside useCsvParser.
      const isValidMime = ["text/csv", "application/csv", "text/plain"].includes(
        file.type
      );
      const isCSVExtension = file.name.toLowerCase().endsWith(".csv");

      if (!isValidMime && !isCSVExtension) return;

      onFile(file);
    },
    [onFile]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear dragging state when leaving the drop zone itself,
    // not when moving over a child element inside it
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be selected again
      e.target.value = "";
    },
    [processFile]
  );

  return {
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    openFilePicker,
    fileInputRef,
    onFileInputChange,
  };
}
import { useEffect, useMemo, useRef, useState } from "react";
import { processImageInBrowser } from "../imageProcessor";
import type { OutputFormat, OutputListItem, ResizeOutput } from "../types";
import { readImageAspectRatio } from "../utils/resizeMath";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 20 * 1024 * 1024;

export interface QueueItem extends OutputListItem {
  file: File;
  aspectRatio: number;
  customOutput?: ResizeOutput;
  customKeepAspect?: boolean;
}

interface StartResizeParams {
  defaultOutput: ResizeOutput;
}

export function useImageQueue() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outputItems, setOutputItems] = useState<QueueItem[]>([]);
  const outputItemsRef = useRef<QueueItem[]>([]);

  useEffect(() => {
    outputItemsRef.current = outputItems;
  }, [outputItems]);

  useEffect(() => {
    return () => {
      for (const item of outputItemsRef.current) {
        URL.revokeObjectURL(item.thumbnailUrl);
        if (item.downloadUrl?.startsWith("blob:")) URL.revokeObjectURL(item.downloadUrl);
      }
    };
  }, []);

  const fileSummary = useMemo(() => {
    const readyItems = outputItems.filter((item) => item.status === "READY");
    if (readyItems.length === 0) return "";
    if (readyItems.length === 1) return readyItems[0].fileName;
    return `${readyItems.length}개 파일 선택됨`;
  }, [outputItems]);

  const canStart = useMemo(() => outputItems.some((item) => item.status === "READY") && !busy, [outputItems, busy]);

  const addFiles = (incomingFiles: File[], baseAspectRatio: number, onFirstRatio?: (ratio: number) => void) => {
    if (incomingFiles.length === 0) return;

    const validFiles: File[] = [];
    const invalidMessages: string[] = [];
    const oversizeFileNames: string[] = [];

    for (const selected of incomingFiles) {
      if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
        invalidMessages.push(`${selected.name}: 형식 오류`);
        continue;
      }
      if (selected.size > MAX_BYTES) {
        invalidMessages.push(`${selected.name}: 20MB 초과`);
        oversizeFileNames.push(selected.name);
        continue;
      }
      validFiles.push(selected);
    }

    if (oversizeFileNames.length > 0) {
      window.alert(`20MB를 초과한 파일이 있습니다:\n${oversizeFileNames.join("\n")}`);
    }

    if (validFiles.length > 0) {
      const nextItems: QueueItem[] = validFiles.map((file) => ({
        id: createLocalId(),
        file,
        fileName: file.name,
        sourceSize: file.size,
        thumbnailUrl: URL.createObjectURL(file),
        status: "READY",
        progress: 0,
        useCustomOptions: false,
        aspectRatio: baseAspectRatio
      }));
      setOutputItems((prev) => [...prev, ...nextItems]);

      readImageAspectRatio(validFiles[0]).then((ratio) => {
        if (ratio > 0) onFirstRatio?.(ratio);
      });

      for (const item of nextItems) {
        readImageAspectRatio(item.file).then((ratio) => {
          if (ratio > 0) updateItem(item.id, { aspectRatio: ratio });
        });
      }
    }

    setError(invalidMessages.length > 0 ? invalidMessages.join(" / ") : "");
  };

  const startResize = async ({ defaultOutput }: StartResizeParams) => {
    const readyItems = outputItemsRef.current.filter((item) => item.status === "READY");
    if (readyItems.length === 0) {
      setError("먼저 처리할 이미지를 선택해주세요.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      for (const item of readyItems) {
        await processSingleItem(item.id, item.file, defaultOutput);
      }
    } finally {
      setBusy(false);
    }
  };

  const processSingleItem = async (itemId: string, file: File, defaultOutput: ResizeOutput) => {
    const target = outputItemsRef.current.find((item) => item.id === itemId);
    if (!target) return;

    const effectiveOutput = target.useCustomOptions && target.customOutput ? target.customOutput : defaultOutput;
    updateItem(itemId, { status: "PROCESSING", progress: 8, error: "", downloadUrl: "" });

    try {
      const processed = await processImageInBrowser({
        file,
        output: effectiveOutput,
        onProgress: (value) => updateItem(itemId, { status: "PROCESSING", progress: Math.max(8, value) })
      });

      if (!outputItemsRef.current.some((item) => item.id === itemId)) return;
      const downloadUrl = URL.createObjectURL(processed.blob);
      updateItem(itemId, { status: "DONE", progress: 100, downloadUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.";
      updateItem(itemId, { status: "FAILED", error: message, progress: 0 });
    }
  };

  const downloadItem = (itemId: string, fallbackFormat: OutputFormat) => {
    const target = outputItemsRef.current.find((item) => item.id === itemId);
    if (!target?.downloadUrl) return;

    const downloadName = buildDownloadName(target.fileName, target.customOutput?.format ?? fallbackFormat);
    if (isMobileLikeBrowser()) {
      triggerMobileDownload(target.downloadUrl, downloadName);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = target.downloadUrl;
    anchor.download = downloadName;
    anchor.rel = "noreferrer noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const removeItem = (itemId: string) => {
    setOutputItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (target) {
        URL.revokeObjectURL(target.thumbnailUrl);
        if (target.downloadUrl?.startsWith("blob:")) URL.revokeObjectURL(target.downloadUrl);
      }
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const updateItem = (itemId: string, patch: Partial<QueueItem>) => {
    setOutputItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.downloadUrl && patch.downloadUrl && item.downloadUrl !== patch.downloadUrl && item.downloadUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.downloadUrl);
        }
        return { ...item, ...patch };
      })
    );
  };

  const getItem = (itemId: string) => outputItemsRef.current.find((item) => item.id === itemId);

  return {
    busy,
    error,
    outputItems,
    fileSummary,
    canStart,
    addFiles,
    startResize,
    downloadItem,
    removeItem,
    updateItem,
    getItem
  };
}

function createLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildDownloadName(fileName: string, format: OutputFormat): string {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = format === "jpeg" ? "jpg" : format;
  return `${baseName}-resized.${extension}`;
}

function isIosLikeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function isMobileLikeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function triggerMobileDownload(downloadUrl: string, downloadName: string): void {
  if (isIosLikeBrowser()) {
    window.location.assign(downloadUrl);
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = downloadName;
  anchor.rel = "noreferrer noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

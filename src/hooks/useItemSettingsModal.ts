import { useState } from "react";
import type { ResizeOutput } from "../types";
import type { QueueItem } from "./useImageQueue";
import { normalizeNumber, scaleHeight, scaleWidth } from "../utils/resizeMath";

interface UseItemSettingsModalParams {
  defaultOutput: ResizeOutput;
  keepAspect: boolean;
  baseAspectRatio: number;
  getItem: (itemId: string) => QueueItem | undefined;
  updateItem: (itemId: string, patch: Partial<QueueItem>) => void;
}

export function useItemSettingsModal(params: UseItemSettingsModalParams) {
  const { defaultOutput, keepAspect, baseAspectRatio, getItem, updateItem } = params;
  const [editingItemId, setEditingItemId] = useState("");
  const [editUseCustomOptions, setEditUseCustomOptions] = useState(false);
  const [editKeepAspect, setEditKeepAspect] = useState(true);
  const [editAspectRatio, setEditAspectRatio] = useState(16 / 9);
  const [editOutput, setEditOutput] = useState<ResizeOutput>({
    width: 1920,
    height: 1080,
    fit: "cover",
    format: "webp",
    quality: 82
  });

  const openSettings = (itemId: string) => {
    const target = getItem(itemId);
    if (!target) return;
    setEditingItemId(itemId);
    setEditUseCustomOptions(target.useCustomOptions);
    setEditKeepAspect(target.customKeepAspect ?? keepAspect);
    setEditAspectRatio(target.aspectRatio || baseAspectRatio);
    setEditOutput(target.customOutput ?? defaultOutput);
  };

  const closeSettings = () => setEditingItemId("");

  const saveSettings = () => {
    if (!editingItemId) return;
    const normalized: ResizeOutput = {
      width: normalizeNumber(editOutput.width, 16, 8000, defaultOutput.width),
      height: normalizeNumber(editOutput.height, 16, 8000, defaultOutput.height),
      quality: normalizeNumber(editOutput.quality, 1, 100, defaultOutput.quality),
      fit: editOutput.fit,
      format: editOutput.format
    };

    updateItem(editingItemId, {
      useCustomOptions: editUseCustomOptions,
      customOutput: editUseCustomOptions ? normalized : undefined,
      customKeepAspect: editUseCustomOptions ? editKeepAspect : undefined
    });
    closeSettings();
  };

  const onEditKeepAspectChange = (value: boolean) => {
    setEditKeepAspect(value);
    if (value) {
      setEditOutput((prev) => ({ ...prev, height: scaleHeight(prev.width, editAspectRatio, prev.height) }));
    }
  };

  const onEditWidthChange = (value: number) => {
    setEditOutput((prev) => ({
      ...prev,
      width: value,
      height: editKeepAspect ? scaleHeight(value, editAspectRatio, prev.height) : prev.height
    }));
  };

  const onEditHeightChange = (value: number) => {
    setEditOutput((prev) => ({
      ...prev,
      height: value,
      width: editKeepAspect ? scaleWidth(value, editAspectRatio, prev.width) : prev.width
    }));
  };

  return {
    editingItemId,
    editUseCustomOptions,
    editKeepAspect,
    editOutput,
    setEditUseCustomOptions,
    setEditOutput,
    openSettings,
    closeSettings,
    saveSettings,
    onEditKeepAspectChange,
    onEditWidthChange,
    onEditHeightChange
  };
}

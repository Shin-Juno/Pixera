import { useMemo, useState } from "react";
import type { OutputFormat, ResizeFit, ResizeOutput } from "../types";
import { scaleHeight, scaleWidth } from "../utils/resizeMath";

export function useResizeSettings() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [keepAspect, setKeepAspect] = useState(true);
  const [baseAspectRatio, setBaseAspectRatio] = useState(16 / 9);
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [fit, setFit] = useState<ResizeFit>("cover");

  const defaultOutput = useMemo<ResizeOutput>(
    () => ({
      width,
      height,
      fit,
      format,
      quality
    }),
    [width, height, fit, format, quality]
  );

  const onKeepAspectChange = (value: boolean) => {
    setKeepAspect(value);
    if (value) setHeight(scaleHeight(width, baseAspectRatio, height));
  };

  const onWidthChange = (value: number) => {
    setWidth(value);
    if (keepAspect) setHeight(scaleHeight(value, baseAspectRatio, height));
  };

  const onHeightChange = (value: number) => {
    setHeight(value);
    if (keepAspect) setWidth(scaleWidth(value, baseAspectRatio, width));
  };

  const applyBaseAspectRatio = (ratio: number) => {
    if (!(ratio > 0)) return;
    setBaseAspectRatio(ratio);
    if (keepAspect) setHeight((prev) => scaleHeight(width, ratio, prev));
  };

  return {
    width,
    height,
    keepAspect,
    baseAspectRatio,
    quality,
    format,
    fit,
    defaultOutput,
    setQuality,
    setFormat,
    setFit,
    onKeepAspectChange,
    onWidthChange,
    onHeightChange,
    applyBaseAspectRatio
  };
}

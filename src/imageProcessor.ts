import pica from "pica";
import { encode as encodeJpeg } from "@jsquash/jpeg";
import { encode as encodePng } from "@jsquash/png";
import { encode as encodeWebp } from "@jsquash/webp";
import avifEncFactory from "@jsquash/avif/codec/enc/avif_enc.js";
import { defaultOptions as avifDefaultOptions } from "@jsquash/avif/meta.js";
import { initEmscriptenModule as initAvifEmscriptenModule } from "@jsquash/avif/utils.js";
import type { OutputFormat, ResizeFit, ResizeOutput } from "./types";

interface ProcessImageParams {
  file: File;
  output: ResizeOutput;
  onProgress?: (value: number) => void;
}

interface ProcessImageResult {
  blob: Blob;
  width: number;
  height: number;
  extension: string;
}

const picaInstance = pica();
let avifEncoderModulePromise: Promise<any> | null = null;

export async function processImageInBrowser(params: ProcessImageParams): Promise<ProcessImageResult> {
  const { file, output, onProgress } = params;
  onProgress?.(8);

  const bitmap = await createImageBitmap(file);
  onProgress?.(20);

  try {
    const sourceCanvas = makeCanvas(bitmap.width, bitmap.height);
    const sourceContext = sourceCanvas.getContext("2d");
    if (!sourceContext) {
      throw new Error("소스 캔버스 컨텍스트 생성에 실패했습니다.");
    }
    sourceContext.drawImage(bitmap, 0, 0);

    const plan = buildResizePlan({
      srcWidth: bitmap.width,
      srcHeight: bitmap.height,
      targetWidth: output.width,
      targetHeight: output.height,
      fit: output.fit
    });

    const resizedCanvas = makeCanvas(plan.scaledWidth, plan.scaledHeight);
    await picaInstance.resize(sourceCanvas, resizedCanvas);
    onProgress?.(62);

    const finalCanvas = makeCanvas(plan.resultWidth, plan.resultHeight);
    const finalContext = finalCanvas.getContext("2d");
    if (!finalContext) {
      throw new Error("결과 캔버스 컨텍스트 생성에 실패했습니다.");
    }
    finalContext.clearRect(0, 0, plan.resultWidth, plan.resultHeight);
    finalContext.drawImage(
      resizedCanvas,
      plan.sourceX,
      plan.sourceY,
      plan.sourceWidth,
      plan.sourceHeight,
      plan.destX,
      plan.destY,
      plan.destWidth,
      plan.destHeight
    );
    onProgress?.(78);

    const imageData = finalContext.getImageData(0, 0, plan.resultWidth, plan.resultHeight);
    const encoded = await encodeByFormat(imageData, output.format, output.quality);
    onProgress?.(100);

    return {
      blob: encoded.blob,
      width: plan.resultWidth,
      height: plan.resultHeight,
      extension: encoded.extension
    };
  } finally {
    bitmap.close();
  }
}

interface ResizePlanInput {
  srcWidth: number;
  srcHeight: number;
  targetWidth: number;
  targetHeight: number;
  fit: ResizeFit;
}

interface ResizePlan {
  scaledWidth: number;
  scaledHeight: number;
  resultWidth: number;
  resultHeight: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
}

function buildResizePlan(input: ResizePlanInput): ResizePlan {
  const { srcWidth, srcHeight, targetWidth, targetHeight, fit } = input;

  if (fit === "fill") {
    return {
      scaledWidth: safeSize(targetWidth),
      scaledHeight: safeSize(targetHeight),
      resultWidth: safeSize(targetWidth),
      resultHeight: safeSize(targetHeight),
      sourceX: 0,
      sourceY: 0,
      sourceWidth: safeSize(targetWidth),
      sourceHeight: safeSize(targetHeight),
      destX: 0,
      destY: 0,
      destWidth: safeSize(targetWidth),
      destHeight: safeSize(targetHeight)
    };
  }

  const ratioX = targetWidth / srcWidth;
  const ratioY = targetHeight / srcHeight;
  let scale = 1;

  if (fit === "contain" || fit === "inside") {
    scale = Math.min(ratioX, ratioY);
  } else {
    scale = Math.max(ratioX, ratioY);
  }

  if (fit === "inside" && scale > 1) {
    scale = 1;
  }

  const scaledWidth = safeSize(srcWidth * scale);
  const scaledHeight = safeSize(srcHeight * scale);

  if (fit === "cover") {
    const sourceX = Math.max(0, Math.floor((scaledWidth - targetWidth) / 2));
    const sourceY = Math.max(0, Math.floor((scaledHeight - targetHeight) / 2));
    return {
      scaledWidth,
      scaledHeight,
      resultWidth: safeSize(targetWidth),
      resultHeight: safeSize(targetHeight),
      sourceX,
      sourceY,
      sourceWidth: safeSize(targetWidth),
      sourceHeight: safeSize(targetHeight),
      destX: 0,
      destY: 0,
      destWidth: safeSize(targetWidth),
      destHeight: safeSize(targetHeight)
    };
  }

  if (fit === "contain") {
    const resultWidth = safeSize(targetWidth);
    const resultHeight = safeSize(targetHeight);
    const destX = Math.max(0, Math.floor((resultWidth - scaledWidth) / 2));
    const destY = Math.max(0, Math.floor((resultHeight - scaledHeight) / 2));
    return {
      scaledWidth,
      scaledHeight,
      resultWidth,
      resultHeight,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: scaledWidth,
      sourceHeight: scaledHeight,
      destX,
      destY,
      destWidth: scaledWidth,
      destHeight: scaledHeight
    };
  }

  return {
    scaledWidth,
    scaledHeight,
    resultWidth: scaledWidth,
    resultHeight: scaledHeight,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: scaledWidth,
    sourceHeight: scaledHeight,
    destX: 0,
    destY: 0,
    destWidth: scaledWidth,
    destHeight: scaledHeight
  };
}

function safeSize(value: number): number {
  return Math.max(1, Math.round(value));
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function encodeByFormat(
  imageData: ImageData,
  format: OutputFormat,
  quality: number
): Promise<{ blob: Blob; extension: string }> {
  const safeQuality = Math.max(1, Math.min(100, Math.round(quality)));

  if (format === "webp") {
    const binary = await encodeWebp(imageData, { quality: safeQuality });
    return { blob: new Blob([binary], { type: "image/webp" }), extension: "webp" };
  }

  if (format === "avif") {
    const binary = await encodeAvifSingleThread(imageData, safeQuality);
    return { blob: new Blob([binary], { type: "image/avif" }), extension: "avif" };
  }

  if (format === "jpeg") {
    const binary = await encodeJpeg(imageData, { quality: safeQuality });
    return { blob: new Blob([binary], { type: "image/jpeg" }), extension: "jpg" };
  }

  const binary = await encodePng(imageData);
  return { blob: new Blob([binary], { type: "image/png" }), extension: "png" };
}

async function encodeAvifSingleThread(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  if (!avifEncoderModulePromise) {
    avifEncoderModulePromise = initAvifEmscriptenModule(avifEncFactory);
  }

  const module = await avifEncoderModulePromise;
  const options = { ...avifDefaultOptions, quality };
  const output = module.encode(new Uint8Array(imageData.data.buffer), imageData.width, imageData.height, options);
  if (!output) {
    throw new Error("AVIF 인코딩에 실패했습니다.");
  }
  return output.buffer as ArrayBuffer;
}

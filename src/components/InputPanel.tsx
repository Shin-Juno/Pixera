import { useState } from "react";
import type { ChangeEvent, DragEvent, FocusEvent } from "react";
import type { OutputFormat, ResizeFit } from "../types";

interface InputPanelProps {
  fileSummary: string;
  width: number;
  height: number;
  keepAspect: boolean;
  quality: number;
  format: OutputFormat;
  fit: ResizeFit;
  error: string;
  onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onKeepAspectChange: (value: boolean) => void;
  onQualityChange: (value: number) => void;
  onFormatChange: (value: OutputFormat) => void;
  onFitChange: (value: ResizeFit) => void;
  onDropFiles: (files: File[]) => void;
}

function InputPanel(props: InputPanelProps) {
  const {
    fileSummary,
    width,
    height,
    keepAspect,
    quality,
    format,
    fit,
    error,
    onSelectFile,
    onWidthChange,
    onHeightChange,
    onKeepAspectChange,
    onQualityChange,
    onFormatChange,
    onFitChange,
    onDropFiles
  } = props;
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      onDropFiles(files);
    }
  };

  const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  return (
    <section className="panel reveal-2">
      <div className="panel-title-row">
        <h2>기본 옵션</h2>
        <span className="badge">1장당 최대 20MB</span>
      </div>

      <label className={`file-drop${isDragging ? " is-dragging" : ""}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={onSelectFile} />
        <span>{fileSummary || "이미지를 드롭하거나 클릭해서 업로드"}</span>
      </label>

      <label className="inline-check field-check">
        <input type="checkbox" checked={keepAspect} onChange={(e) => onKeepAspectChange(e.target.checked)} />
        <span>가로세로 비율 유지</span>
      </label>

      <div className="grid input-grid">
        <label className="size-field">
          너비
          <input type="number" min={16} max={8000} value={width} onFocus={selectAllOnFocus} onChange={(e) => onWidthChange(Number(e.target.value))} />
        </label>
        <label className="size-field">
          높이
          <input type="number" min={16} max={8000} value={height} onFocus={selectAllOnFocus} onChange={(e) => onHeightChange(Number(e.target.value))} />
        </label>
        <label>
          품질
          <input type="number" min={1} max={100} value={quality} onChange={(e) => onQualityChange(Number(e.target.value))} />
        </label>
        <label>
          포맷
          <select value={format} onChange={(e) => onFormatChange(e.target.value as OutputFormat)}>
            <option value="webp">webp</option>
            <option value="jpeg">jpeg</option>
            <option value="png">png</option>
            <option value="avif">avif</option>
          </select>
        </label>
        <label>
          맞춤 방식
          <select value={fit} onChange={(e) => onFitChange(e.target.value as ResizeFit)}>
            <option value="cover">꽉 채우기 (cover)</option>
            <option value="contain">전체 보이기 (contain)</option>
            <option value="fill">강제 맞춤 (fill)</option>
            <option value="inside">내부 맞춤 (inside)</option>
            <option value="outside">외부 맞춤 (outside)</option>
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default InputPanel;

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import HeroSection from "./components/HeroSection";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";
import { useImageQueue } from "./hooks/useImageQueue";
import { useItemSettingsModal } from "./hooks/useItemSettingsModal";
import { useResizeSettings } from "./hooks/useResizeSettings";
import type { OutputFormat, ResizeFit } from "./types";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = window.localStorage.getItem("pixera-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const {
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
  } = useResizeSettings();

  const { busy, error, outputItems, fileSummary, canStart, addFiles, startResize, downloadItem, removeItem, updateItem, getItem } = useImageQueue();

  const {
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
  } = useItemSettingsModal({
    defaultOutput,
    keepAspect,
    baseAspectRatio,
    getItem,
    updateItem
  });

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    addFiles(selectedFiles, baseAspectRatio, applyBaseAspectRatio);
    event.target.value = "";
  };

  const onDropFiles = (files: File[]) => {
    addFiles(files, baseAspectRatio, applyBaseAspectRatio);
  };

  const onStartResize = () => {
    void startResize({ defaultOutput });
  };

  const onDownload = (itemId: string) => {
    downloadItem(itemId, format);
  };

  const onRemove = (itemId: string) => {
    removeItem(itemId);
    if (editingItemId === itemId) closeSettings();
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("pixera-theme", theme);
  }, [theme]);

  return (
    <div className="page">
      <button
        type="button"
        className="theme-fab"
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        aria-label={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
      <div className="shape shape-a" />
      <div className="shape shape-b" />

      <main className="layout">
        <HeroSection />
        <InputPanel
          fileSummary={fileSummary}
          width={width}
          height={height}
          keepAspect={keepAspect}
          quality={quality}
          format={format}
          fit={fit}
          error={error}
          onSelectFile={onSelectFile}
          onWidthChange={onWidthChange}
          onHeightChange={onHeightChange}
          onKeepAspectChange={onKeepAspectChange}
          onQualityChange={setQuality}
          onFormatChange={setFormat as (value: OutputFormat) => void}
          onFitChange={setFit as (value: ResizeFit) => void}
          onDropFiles={onDropFiles}
        />
        <OutputPanel
          items={outputItems.map(({ file: _file, aspectRatio: _aspectRatio, customOutput: _customOutput, customKeepAspect: _customKeepAspect, ...item }) => item)}
          onDownload={onDownload}
          onRemove={onRemove}
          onOpenSettings={openSettings}
        />
        <div className="output-action-slot">
          <button type="button" className="action output-action-button" onClick={onStartResize} disabled={!canStart}>
            {busy ? "처리 중..." : "리사이즈 시작"}
          </button>
        </div>
      </main>

      <footer className="site-footer">
        <p className="footer-note">업로드 이미지는 브라우저 내에서만 처리되며 서버에 저장되지 않습니다.</p>
        <p className="footer-copy">© {new Date().getFullYear()} Pixera. All rights reserved.</p>
      </footer>

      {editingItemId && (
        <div className="settings-modal-backdrop" role="presentation" onClick={closeSettings}>
          <section className="settings-modal" role="dialog" aria-modal="true" aria-label="파일 개별 옵션 설정" onClick={(event) => event.stopPropagation()}>
            <h3>파일 개별 옵션 설정</h3>
            <label className="inline-check">
              <input type="checkbox" checked={editUseCustomOptions} onChange={(event) => setEditUseCustomOptions(event.target.checked)} />
              <span>이 파일만 개별 옵션 사용</span>
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={editKeepAspect} onChange={(event) => onEditKeepAspectChange(event.target.checked)} disabled={!editUseCustomOptions} />
              <span>가로세로 비율 유지</span>
            </label>
            <p className="meta">{editUseCustomOptions ? "저장 시 현재 파일에만 적용됩니다." : "현재는 입력 패널의 기본 옵션을 사용합니다."}</p>

            <div className="grid settings-grid">
              <label className="size-field">
                너비
                <input type="number" min={16} max={8000} value={editOutput.width} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onEditWidthChange(Number(event.target.value))} disabled={!editUseCustomOptions} />
              </label>
              <label className="size-field">
                높이
                <input type="number" min={16} max={8000} value={editOutput.height} onFocus={(event) => event.currentTarget.select()} onChange={(event) => onEditHeightChange(Number(event.target.value))} disabled={!editUseCustomOptions} />
              </label>
              <label>
                품질
                <input type="number" min={1} max={100} value={editOutput.quality} onChange={(event) => setEditOutput((prev) => ({ ...prev, quality: Number(event.target.value) }))} disabled={!editUseCustomOptions} />
              </label>
              <label>
                포맷
                <select value={editOutput.format} onChange={(event) => setEditOutput((prev) => ({ ...prev, format: event.target.value as OutputFormat }))} disabled={!editUseCustomOptions}>
                  <option value="webp">webp</option>
                  <option value="jpeg">jpeg</option>
                  <option value="png">png</option>
                  <option value="avif">avif</option>
                </select>
              </label>
              <label>
                맞춤 방식
                <select value={editOutput.fit} onChange={(event) => setEditOutput((prev) => ({ ...prev, fit: event.target.value as ResizeFit }))} disabled={!editUseCustomOptions}>
                  <option value="cover">꽉 채우기 (cover)</option>
                  <option value="contain">전체 보이기 (contain)</option>
                  <option value="fill">강제 맞춤 (fill)</option>
                  <option value="inside">내부 맞춤 (inside)</option>
                  <option value="outside">외부 맞춤 (outside)</option>
                </select>
              </label>
            </div>

            <div className="settings-actions">
              <button type="button" className="action action-cancel" onClick={closeSettings}>
                취소
              </button>
              <button type="button" className="action" onClick={saveSettings}>
                저장
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.2v2.3M12 19.5v2.3M4.2 12h2.3M17.5 12h2.3M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.6 2.8a9.5 9.5 0 1 0 6.6 14.7 8.4 8.4 0 0 1-6.6-14.7Z" />
    </svg>
  );
}

export default App;

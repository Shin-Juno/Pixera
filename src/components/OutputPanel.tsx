import type { OutputListItem, UiJobStatus } from "../types";

interface OutputPanelProps {
  items: OutputListItem[];
  onDownload: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onOpenSettings: (itemId: string) => void;
}

function OutputPanel(props: OutputPanelProps) {
  const { items, onDownload, onRemove, onOpenSettings } = props;
  const totalSize = items.reduce((sum, item) => sum + item.sourceSize, 0);

  return (
    <section className="panel reveal-3">
      <div className="panel-title-row">
        <h2>{"결과 목록"}</h2>
        <span className="badge">
          {items.length}
          {"건 · "}
          {formatBytes(totalSize)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="meta">{"아직 추가된 파일이 없습니다."}</p>
      ) : (
        <div className="output-list">
          {items.map((item) => (
            <article key={item.id} className="output-item">
              <div className="output-thumb-wrap">
                <img className="output-thumb" src={item.thumbnailUrl} alt={item.fileName} />
                <button
                  type="button"
                  className="thumb-remove-button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`${item.fileName} 목록에서 제거`}
                  title="목록에서 제거"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="output-main">
                <div className="output-row">
                  <p className="output-name" title={item.fileName}>
                    {item.fileName}
                  </p>
                  <button
                    type="button"
                    className={`item-settings-button${item.useCustomOptions ? " is-custom" : ""}`}
                    onClick={() => onOpenSettings(item.id)}
                    aria-label={`${item.fileName} 설정`}
                    title={item.useCustomOptions ? "개별 옵션 적용 중" : "기본 옵션 사용 중"}
                  >
                    <GearIcon />
                  </button>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
                </div>

                <div className="output-meta-row">
                  <p className="meta">{item.error || getItemMeta(item.status, item.jobId)}</p>
                  <p className="output-size-meta">{formatBytes(item.sourceSize)}</p>
                </div>
              </div>

              <button
                type="button"
                className="download-icon-button"
                disabled={item.status !== "DONE" || !item.downloadUrl}
                onClick={() => onDownload(item.id)}
                aria-label={`${item.fileName} 다운로드`}
                title={item.status === "DONE" ? "다운로드" : "완료 후 활성화"}
              >
                <DownloadIcon />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function getItemMeta(status: UiJobStatus, jobId?: string): string {
  if (status === "READY") {
    return "처리 대기 중";
  }
  if (status === "QUEUED") {
    return jobId ? `ID: ${jobId} | 큐 대기 중` : "큐 대기 중";
  }
  if (status === "PROCESSING") {
    return jobId ? `ID: ${jobId} | 처리 중` : "처리 중";
  }
  if (status === "DONE") {
    return "다운로드 가능";
  }
  return "처리 실패";
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const digits = index === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[index]}`;
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5v10" />
      <path d="m8.5 11.8 3.5 3.5 3.5-3.5" />
      <path d="M5 18.5h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.7 2.7h2.6l.5 2a7.2 7.2 0 0 1 1.7.7l1.8-1 1.8 1.8-1 1.8c.3.5.6 1.1.7 1.7l2 .5v2.6l-2 .5a7.2 7.2 0 0 1-.7 1.7l1 1.8-1.8 1.8-1.8-1a7.2 7.2 0 0 1-1.7.7l-.5 2h-2.6l-.5-2a7.2 7.2 0 0 1-1.7-.7l-1.8 1-1.8-1.8 1-1.8a7.2 7.2 0 0 1-.7-1.7l-2-.5v-2.6l2-.5c.1-.6.4-1.2.7-1.7l-1-1.8 1.8-1.8 1.8 1a7.2 7.2 0 0 1 1.7-.7l.5-2Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

export default OutputPanel;


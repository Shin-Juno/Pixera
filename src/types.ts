export type OutputFormat = "jpeg" | "png" | "webp" | "avif";
export type ResizeFit = "cover" | "contain" | "fill" | "inside" | "outside";
export type JobStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
export type UiJobStatus = "READY" | JobStatus;

export interface ResizeOutput {
  width: number;
  height: number;
  fit: ResizeFit;
  format: OutputFormat;
  quality: number;
}

export interface PresignRequest {
  filename: string;
  contentType: string;
}

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface CreateJobRequest {
  sourceKey: string;
  output: ResizeOutput;
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobResult {
  objectKey: string;
  downloadUrl: string;
  contentType: string;
  size: number;
}

export interface JobError {
  code: string;
  message: string;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  result?: JobResult;
  error?: JobError;
}

export interface OutputListItem {
  id: string;
  fileName: string;
  sourceSize: number;
  thumbnailUrl: string;
  status: UiJobStatus;
  progress: number;
  useCustomOptions: boolean;
  jobId?: string;
  downloadUrl?: string;
  error?: string;
}

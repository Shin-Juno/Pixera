import type {
  CreateJobRequest,
  CreateJobResponse,
  JobResponse,
  PresignRequest,
  PresignResponse
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/v1";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}): ${body || "no body"}`);
  }

  return (await response.json()) as T;
}

export function createPresignUrl(payload: PresignRequest): Promise<PresignResponse> {
  return fetchJson<PresignResponse>(`${API_BASE}/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function uploadToStorage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}

export function createResizeJob(payload: CreateJobRequest): Promise<CreateJobResponse> {
  return fetchJson<CreateJobResponse>(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function getJob(jobId: string): Promise<JobResponse> {
  return fetchJson<JobResponse>(`${API_BASE}/jobs/${jobId}`);
}

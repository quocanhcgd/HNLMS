import { randomUUID } from "node:crypto";

export type ExportJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface ExportJob {
  id: string;
  organization_id: string;
  requested_by: string;
  resource: string;
  status: ExportJobStatus;
  created_at: string;
  updated_at: string;
  download_url: string | null;
  error_code: string | null;
}

export interface CreateExportJobInput {
  organizationId: string;
  requestedBy: string;
  resource: string;
  now?: Date;
}

const terminalStatuses = new Set<ExportJobStatus>(["completed", "failed", "cancelled"]);

export function createExportJob(input: CreateExportJobInput): ExportJob {
  const timestamp = (input.now ?? new Date()).toISOString();
  return {
    id: randomUUID(),
    organization_id: input.organizationId,
    requested_by: input.requestedBy,
    resource: input.resource,
    status: "queued",
    created_at: timestamp,
    updated_at: timestamp,
    download_url: null,
    error_code: null,
  };
}

export function transitionExportJob(
  job: ExportJob,
  status: ExportJobStatus,
  options: { now?: Date; downloadUrl?: string; errorCode?: string } = {},
): ExportJob {
  if (terminalStatuses.has(job.status)) throw new Error("export_job_terminal");
  const allowed: Record<ExportJobStatus, ExportJobStatus[]> = {
    queued: ["running", "cancelled", "failed"],
    running: ["completed", "cancelled", "failed"],
    completed: [],
    failed: [],
    cancelled: [],
  };
  if (!allowed[job.status].includes(status)) throw new Error("invalid_export_job_transition");
  if (status === "completed" && !options.downloadUrl) throw new Error("export_download_url_required");
  if (status === "failed" && !options.errorCode) throw new Error("export_error_code_required");
  return {
    ...job,
    status,
    updated_at: (options.now ?? new Date()).toISOString(),
    download_url: status === "completed" ? options.downloadUrl! : null,
    error_code: status === "failed" ? options.errorCode! : null,
  };
}

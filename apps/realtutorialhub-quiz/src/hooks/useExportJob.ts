import { useState, useEffect, useCallback, useRef } from "react";

export type ExportStatus = "idle" | "processing" | "ready" | "failed";
type ExportFormat = "json" | "csv" | "student-insight-pdf";

interface ExportRequestContext {
  examId: string;
  userId: string;
  format: ExportFormat;
}

interface ExportJobResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  stage?: string | null;
  progress?: number | null;
  downloadUrl?: string;
  error?: string;
}

export function useExportJob() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [stage, setStage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const exportContextRef = useRef<ExportRequestContext | null>(null);

  const clearPolling = useCallback(() => {
    if (pollInterval.current !== null) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const resolveDownloadUrl = useCallback(async (apiUrl: string, context: ExportRequestContext | null) => {
    if (context === null) return null;
    try {
      const res = await fetch(
        `${apiUrl}/export/urls?examId=${encodeURIComponent(context.examId)}&format=${encodeURIComponent(context.format)}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { url?: string | null };
      return typeof data.url === "string" && data.url.trim() !== "" ? data.url : null;
    } catch {
      return null;
    }
  }, []);

  const checkStatus = useCallback(async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const context = exportContextRef.current;
      const statusUrl = context
        ? `${apiUrl}/export/status/${id}?examId=${encodeURIComponent(context.examId)}&format=${encodeURIComponent(context.format)}`
        : `${apiUrl}/export/status/${id}`;
      const res = await fetch(statusUrl, {
        credentials: "include",
      });

      if (res.status === 404) {
        const fallbackUrl = await resolveDownloadUrl(apiUrl, context);
        if (fallbackUrl !== null) {
          setStatus("ready");
          setStage("ready");
          setDownloadUrl(fallbackUrl);
          setError(null);
          setIsExporting(false);
          clearPolling();
          return;
        }

        setStatus("failed");
        setError("Export job not found");
        setIsExporting(false);
        clearPolling();
        return;
      }

      if (res.status === 401) {
        setStatus("failed");
        setError("Session expired. Please refresh and log in again.");
        setIsExporting(false);
        clearPolling();
        return;
      }

      if (!res.ok) throw new Error("Failed to check export status");

      const data: ExportJobResponse = await res.json();
      if (data.stage !== undefined) setStage(data.stage ?? null);
      if (data.status === "completed") {
        const downloadUrl = data.downloadUrl ?? (await resolveDownloadUrl(apiUrl, context));
        if (downloadUrl !== null) {
          setStatus("ready");
          setStage("ready");
          setDownloadUrl(downloadUrl);
          setError(null);
          setIsExporting(false);
          clearPolling();
          return;
        }
        setStatus("failed");
        setError("Export job not found");
        setIsExporting(false);
        clearPolling();
        return;
      } else if (data.status === "processing" || data.status === "pending") {
        setStatus("processing");
      } else {
        setStatus("failed");
      }
      
      if (data.status === "failed") {
        const fallbackUrl = await resolveDownloadUrl(apiUrl, context);
        if (fallbackUrl !== null) {
          setStatus("ready");
          setStage("ready");
          setDownloadUrl(fallbackUrl);
          setError(null);
          setIsExporting(false);
          clearPolling();
          return;
        }
        setError(sanitizeErrorMessage(data.error ?? "Export failed"));
        setIsExporting(false);
        clearPolling();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsExporting(false);
      clearPolling();
    }
  }, [clearPolling, resolveDownloadUrl]);

  const triggerExport = async (examId: string, userId: string, format: "json" | "csv" | "student-insight-pdf") => {
    setIsExporting(true);
    setDownloadUrl(null);
    setError(null);
    setStatus("processing");
    setStage("queued");
    setJobId(null);
    exportContextRef.current = { examId, userId, format };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      
      // Read CSRF token from cookie for POST authentication
      const csrfToken = typeof document !== 'undefined'
        ? document.cookie
          .split('; ')
          .find(row => row.startsWith('csrfToken='))
          ?.split('=')[1] ?? ''
        : '';

      const res = await fetch(`${apiUrl}/export/trigger`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ examId, userId, format }),
        credentials: "include",
      });

      if (res.status === 401) throw new Error("Session expired. Please refresh and log in again.");
      if (!res.ok) throw new Error("Failed to trigger export");

      const data = (await res.json()) as ExportJobResponse;
      if (data.jobId) setJobId(data.jobId);
      if (data.stage !== undefined) setStage(data.stage ?? "queued");

      // Start polling
      if (data.jobId) {
        pollInterval.current = setInterval(() => checkStatus(data.jobId), 2000);
      } else if (data.downloadUrl) {
        // Dev/non-job response path
        setDownloadUrl(data.downloadUrl);
        setStatus("ready");
        setError(null);
        setIsExporting(false);
      } else {
        throw new Error("Export did not return a jobId");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsExporting(false);
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  return { triggerExport, status, stage, isExporting, downloadUrl, error, jobId };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return sanitizeErrorMessage(error.message);
  return "Unexpected error";
}

function sanitizeErrorMessage(message: string): string {
  const lowered = message.toLowerCase();
  if (
    lowered.includes("upstash workflow") ||
    lowered.includes("workflowabort") ||
    lowered.includes("disabled-qstash") ||
    lowered.includes("failed to authenticate workflow request")
  ) {
    return "Export failed. Please retry.";
  }
  return message;
}

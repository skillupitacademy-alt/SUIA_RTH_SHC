import { useState, useEffect, useCallback, useRef } from "react";

export type ExportStatus = "idle" | "processing" | "ready" | "failed";

interface ExportJobResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  error?: string;
}

export function useExportJob() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/export/status/${id}`, {
        credentials: "include",
      });

      if (res.status === 404) {
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
      if (data.status === "completed") {
        setStatus("ready");
      } else if (data.status === "processing" || data.status === "pending") {
        setStatus("processing");
      } else {
        setStatus("failed");
      }
      
      if (data.status === "completed" && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setIsExporting(false);
        clearPolling();
      } else if (data.status === "failed") {
        setError(sanitizeErrorMessage(data.error ?? "Export failed"));
        setIsExporting(false);
        clearPolling();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsExporting(false);
      clearPolling();
    }
  }, [clearPolling]);

  const triggerExport = async (examId: string, userId: string, format: "json" | "csv") => {
    setIsExporting(true);
    setDownloadUrl(null);
    setError(null);
    setStatus("processing");
    setJobId(null);

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

      // Start polling
      pollInterval.current = setInterval(() => checkStatus(data.jobId), 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsExporting(false);
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, [clearPolling]);

  return { triggerExport, status, isExporting, downloadUrl, error, jobId };
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

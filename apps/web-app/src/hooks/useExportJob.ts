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
        setError(data.error ?? "Export failed");
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/export/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, userId, format }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to trigger export");

      const data = (await res.json()) as ExportJobResponse;

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

  return { triggerExport, status, isExporting, downloadUrl, error };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

import { useState, useEffect, useCallback } from "react";

export type ReportStatus = "pending" | "generating" | "ready" | "failed" | "not_found";

interface ReportStatusResponse {
  status: ReportStatus;
  url?: string;
}

export function useReportStatus(attemptId: string) {
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!attemptId) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/report-status?attemptId=${attemptId}`, {
        credentials: "include",
      });
      
      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to check report status");
      }

      const data: ReportStatusResponse = await res.json();
      setStatus(data.status);
      
      if (data.status === "ready" && data.url) {
        setDownloadUrl(data.url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to check report status";
      setError(message);
      setStatus("failed");
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;

    checkStatus();

    let interval: NodeJS.Timeout | null = null;
    if (status === "pending" || status === "generating") {
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attemptId, status, checkStatus]);

  const triggerGeneration = async (options?: { force?: boolean }) => {
    if (!attemptId) return;
    
    try {
      setStatus("generating");
      setError(null);

      const res = await fetch('/api/queue-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, force: options?.force })
      });

      if (!res.ok) throw new Error("Failed to queue report generation");
      
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to queue report generation";
      setError(message);
      setStatus("failed");
    }
  };

  return { status, downloadUrl, error, triggerGeneration, checkStatus };
}

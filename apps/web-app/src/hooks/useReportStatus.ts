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

    // Initial check
    checkStatus();

    // Polling while generating or pending
    let interval: NodeJS.Timeout | null = null;
    
    if (status === "pending" || status === "generating") {
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attemptId, status, checkStatus]);

  const triggerGeneration = async () => {
    try {
      setStatus("generating");
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/queue-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attemptId })
      });

      if (!res.ok) throw new Error("Failed to queue report generation");
      
      // Force an immediate poll
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to queue report generation";
      setError(message);
      setStatus("failed");
    }
  };

  return { status, downloadUrl, error, triggerGeneration, checkStatus };
}

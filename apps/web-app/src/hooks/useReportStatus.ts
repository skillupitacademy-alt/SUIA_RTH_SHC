import { useState, useEffect, useCallback, useRef } from "react";

export type ReportStatus = "pending" | "generating" | "ready" | "failed" | "not_found";

interface ReportStatusResponse {
  status: ReportStatus;
  url?: string;
}

export function useReportStatus(attemptId: string) {
  // Start with "not_found" to avoid false spinner flash on initial load
  const [status, setStatus] = useState<ReportStatus>("not_found");
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const initialCheckDone = useRef(false);

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
    } finally {
      setLoading(false);
      initialCheckDone.current = true;
    }
  }, [attemptId]);

  // Initial check on mount
  useEffect(() => {
    if (!attemptId) return;
    checkStatus();
  }, [attemptId, checkStatus]);

  // Polling: only start after initial check is done and status warrants it
  useEffect(() => {
    if (!attemptId || !initialCheckDone.current) return;

    let interval: NodeJS.Timeout | null = null;
    if (status === "pending" || status === "generating") {
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attemptId, status, checkStatus]);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerGeneration = async (options?: { force?: boolean }) => {
    if (!attemptId || cooldown > 0) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      // Read CSRF token from cookie for POST authentication
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrfToken='))
        ?.split('=')[1] ?? '';
      const res = await fetch(`${apiUrl}/queue-report`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ attemptId, force: options?.force }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 429) {
          const data = await res.json();
          setCooldown(data.retryAfter || 60);
          return; // Don't change status to failed, just set cooldown
        }
        throw new Error("Failed to queue report generation");
      }
      
      setStatus("generating");
      setError(null);
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to queue report generation";
      setError(message);
      setStatus("failed");
    }
  };

  return { status, loading, downloadUrl, error, triggerGeneration, checkStatus, cooldown };
}

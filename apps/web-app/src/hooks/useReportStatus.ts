import { useState, useEffect, useCallback, useRef } from "react";

export type ReportStatus = "pending" | "generating" | "ready" | "failed" | "not_found";

interface ReportStatusResponse {
  status: ReportStatus;
  stage?: string;
  url?: string;
}

export function useReportStatus(attemptId: string) {
  const [status, setStatus] = useState<ReportStatus>("not_found");
  const [stage, setStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [pollInterval, setPollInterval] = useState(1000); // Start with 1s polling
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

      const data: ReportStatusResponse & { error?: string } = await res.json();
      setStatus(data.status);
      setStage(data.stage ?? null);
      
      if (data.status === "failed") {
        setError(data.error ?? "Generation failed");
      } else if (data.status === "ready" && data.url) {
        setDownloadUrl(data.url);
      }

      // Exponential backoff logic
      if (data.status === "generating" || data.status === "pending") {
        setPollInterval(prev => Math.min(prev * 1.2, 3000)); // Cap at 3s
      } else {
        setPollInterval(1000); // Reset on success/failure
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
      interval = setInterval(checkStatus, pollInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attemptId, status, checkStatus, pollInterval]);

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
          return;
        }
        throw new Error("Failed to queue report generation");
      }
      
      setStatus("generating");
      setStage("queued");
      setError(null);
      setPollInterval(1000); // Start polling immediately
      checkStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to queue report generation";
      setError(message);
      setStatus("failed");
    }
  };

  return { status, stage, loading, downloadUrl, error, triggerGeneration, checkStatus, cooldown };
}

import { useState, useEffect, useCallback, useRef } from "react";

export interface GuidanceSignalRow {
  signalType: "Critical Gap" | "Skill Deficit" | "Time Anomaly" | "Strength Zone" | "Historical Regression" | string;
  hierarchy: string;
  dimension: string;
  currentValue: number;
  historicalTrend?: Array<{ sessionDate: string; value: number }>;
  severity: "HIGH" | "MEDIUM" | "POSITIVE";
  recommendation: string;
}

export interface HistoricalProgressRow {
  sessionId: string;
  sessionDate: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty?: string;
  skillName?: string;
  accuracyPct: number;
  masteryScorePct: number;
  expertDropoff: number;
  readinessLevel: string;
  sessionIndex: number;
  trend: "improving" | "regressing" | "stable";
}

export interface AggregationRow {
  domain?: string;
  subject?: string;
  skillName?: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracyPct: number;
  avgTimeSec: number;
  masteryScorePct: number;
  readinessLevel: "Expert-Ready" | "Intermediate" | "Novice-Stable";
}

interface InsightVectorData {
  guidanceSignals: GuidanceSignalRow[];
  historicalProgress: HistoricalProgressRow[];
  skillData: AggregationRow[];
}

interface ExportJobResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string;
  error?: string;
}

export function useInsightVectorData(examId?: string, userId?: string) {
  const [data, setData] = useState<InsightVectorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const recoveryTimeout = useRef<NodeJS.Timeout | null>(null);
  const recoveryDeadline = useRef<number>(0);

  const clearPolling = useCallback(() => {
    if (pollInterval.current !== null) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  const clearRecovery = useCallback(() => {
    if (recoveryTimeout.current !== null) {
      clearTimeout(recoveryTimeout.current);
      recoveryTimeout.current = null;
    }
    recoveryDeadline.current = 0;
  }, []);

  const fetchPayload = useCallback(async (url: string) => {
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch insight payload");
      const payload = await res.json();
      const content = payload?.content ?? payload;

      setData({
        guidanceSignals: content.guidance_signals || content.guidanceSignals || [],
        historicalProgress: content.historical_progress || content.historicalProgress || [],
        skillData: content.aggregations?.L6_skill || []
      });
      setError(null);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load insight vectors");
      setLoading(false);
    }
  }, []);

  const fetchExistingUrl = useCallback(async () => {
    if (!examId) return null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(`${apiUrl}/export/urls?examId=${encodeURIComponent(examId)}&format=json`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.url === "string" && data.url.trim() !== "" ? data.url : null;
  }, [examId]);

  const recoverFromArtifact = useCallback(async () => {
    const existingUrl = await fetchExistingUrl();
    if (existingUrl) {
      await fetchPayload(existingUrl);
      return true;
    }
    return false;
  }, [fetchExistingUrl, fetchPayload]);

  const retryArtifactRecovery = useCallback((fallbackMessage: string) => {
    if (recoveryDeadline.current === 0) {
      recoveryDeadline.current = Date.now() + 30000;
    }

    if (recoveryTimeout.current !== null) {
      return;
    }

    clearPolling();
    setLoading(true);
    setError(null);

    recoveryTimeout.current = setTimeout(async () => {
      recoveryTimeout.current = null;
      const recovered = await recoverFromArtifact();
      if (recovered) {
        clearRecovery();
        return;
      }

      if (Date.now() < recoveryDeadline.current) {
        retryArtifactRecovery(fallbackMessage);
        return;
      }

      clearRecovery();
      setError(fallbackMessage);
      setLoading(false);
    }, 2000);
  }, [clearPolling, clearRecovery, recoverFromArtifact]);

  const checkStatus = useCallback(async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/export/status/${id}?examId=${encodeURIComponent(examId ?? "")}&format=json`, {
        credentials: "include",
      });

      if (res.status === 404) {
        const recovered = await recoverFromArtifact();
        if (recovered) {
          clearPolling();
          clearRecovery();
          return;
        }
        retryArtifactRecovery("Export job not found");
        return;
      }

      if (!res.ok) throw new Error("Failed to check export status");

      const statusData: ExportJobResponse = await res.json();
      
      if (statusData.status === "completed") {
        if (statusData.downloadUrl) {
          clearPolling();
          clearRecovery();
          await fetchPayload(statusData.downloadUrl);
          return;
        }
        const recovered = await recoverFromArtifact();
        if (recovered) {
          clearPolling();
          clearRecovery();
          return;
        }
        retryArtifactRecovery("Export job not found");
      } else if (statusData.status === "failed") {
        const recovered = await recoverFromArtifact();
        if (recovered) {
          clearPolling();
          clearRecovery();
          return;
        }
        clearPolling();
        clearRecovery();
        setError(statusData.error || "Insight vector generation failed");
        setLoading(false);
      }
    } catch (err: unknown) {
      clearPolling();
      clearRecovery();
      setError(err instanceof Error ? err.message : "Status sync failed");
      setLoading(false);
    }
  }, [clearPolling, clearRecovery, examId, fetchPayload, recoverFromArtifact, retryArtifactRecovery]);

  const trigger = useCallback(async () => {
    if (!examId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const existingUrl = await fetchExistingUrl();
      if (existingUrl) {
        await fetchPayload(existingUrl);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      
      // Read CSRF token from cookie
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
        body: JSON.stringify({ examId, userId, format: "json" }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to trigger insight synthesis");

      const triggerData = (await res.json()) as ExportJobResponse;
      
      if (triggerData.status === "completed" && triggerData.downloadUrl) {
        await fetchPayload(triggerData.downloadUrl);
      } else if (triggerData.jobId) {
        pollInterval.current = setInterval(() => checkStatus(triggerData.jobId), 2000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Synthesis trigger failed");
      setLoading(false);
    }
  }, [examId, userId, checkStatus, fetchPayload, fetchExistingUrl]);

  useEffect(() => {
    if (examId && userId && !data && !loading && !error) {
      trigger();
    }
    return () => {
      clearPolling();
      clearRecovery();
    };
  }, [examId, userId, trigger, data, loading, error, clearPolling, clearRecovery]);

  const retry = useCallback(() => {
    clearRecovery();
    setData(null);
    setError(null);
    trigger();
  }, [clearRecovery, trigger]);

  return { data, loading, error, retry };
}

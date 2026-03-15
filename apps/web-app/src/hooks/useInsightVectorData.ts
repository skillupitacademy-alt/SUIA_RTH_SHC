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

  const clearPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
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
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load insight vectors");
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${apiUrl}/export/status/${id}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to check export status");

      const statusData: ExportJobResponse = await res.json();
      
      if (statusData.status === "completed" && statusData.downloadUrl) {
        clearPolling();
        await fetchPayload(statusData.downloadUrl);
      } else if (statusData.status === "failed") {
        clearPolling();
        setError(statusData.error || "Insight vector generation failed");
        setLoading(false);
      }
    } catch (err: unknown) {
      clearPolling();
      setError(err instanceof Error ? err.message : "Status sync failed");
      setLoading(false);
    }
  }, [clearPolling, fetchPayload]);

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
    return () => clearPolling();
  }, [examId, userId, trigger, data, loading, error, clearPolling]);

  const retry = useCallback(() => {
    setData(null);
    setError(null);
    trigger();
  }, [trigger]);

  return { data, loading, error, retry };
}

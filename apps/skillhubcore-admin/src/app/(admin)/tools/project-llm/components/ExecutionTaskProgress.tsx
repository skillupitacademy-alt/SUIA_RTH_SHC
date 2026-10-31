'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { projectLlmClient } from '@/lib/project-llm/api/projectLlmClient';

type Progress = Awaited<ReturnType<typeof projectLlmClient.getExecutionProgress>>;

export function ExecutionTaskProgress({ workflowId, operation, active }: {
  workflowId: string | null;
  operation: 'composer' | 'learner' | 'qualification';
  active: boolean;
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [now, setNow] = useState(Date.now() / 1000);

  useEffect(() => {
    if (active || !workflowId) return;
    let stopped = false;
    void projectLlmClient.getExecutionProgress(workflowId, operation).then(next => {
      if (!stopped) setProgress(previous => previous?.startedAt === next.startedAt ? next : previous);
    }).catch(() => { /* The gate response remains the authority when polling fails. */ });
    return () => { stopped = true; };
  }, [active, workflowId, operation]);

  useEffect(() => {
    if (!workflowId || !active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now() / 1000;
    setProgress(null);
    setUnavailable(false);
    const poll = async () => {
      try {
        const next = await projectLlmClient.getExecutionProgress(workflowId, operation);
        if (!stopped) {
          if (next.startedAt && next.startedAt >= started - 2) setProgress(next);
          setUnavailable(false);
        }
      } catch {
        if (!stopped) setUnavailable(true);
      } finally {
        if (!stopped) timer = setTimeout(poll, 1500);
      }
    };
    void poll();
    const clock = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => { stopped = true; clearTimeout(timer); clearInterval(clock); };
  }, [workflowId, operation, active]);

  if (!active && !progress) return null;
  return (
    <section aria-label="Execution tasks" className="space-y-2 min-w-0">
      <p role="status" className="text-sm">
        {unavailable ? 'Progress connection unavailable. Completion is not confirmed.' :
          !progress ? 'Waiting for backend task status...' :
          `Operation: ${progress.status}. ${progress.tasks.at(-1)?.label ?? ''}`}
      </p>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {progress?.tasks.map((task, index) => {
          const Icon = task.status === 'RUNNING' ? RefreshCw : task.status === 'DONE' ? CheckCircle2 : AlertCircle;
          return (
            <li key={index} aria-current={task.status === 'RUNNING' ? 'step' : undefined}
              className="min-w-0 rounded-md border bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <Icon size={14} className={task.status === 'RUNNING' ? 'shrink-0 animate-spin motion-reduce:animate-none' : 'shrink-0'} />
                <span className="font-semibold">Task {index + 1}: {task.status}</span>
              </div>
              <p className="mt-1 break-words">{task.label}</p>
              <p className="mt-1 font-mono text-xs">{Math.max(0, Math.floor((task.finishedAt ?? now) - task.startedAt))}s</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

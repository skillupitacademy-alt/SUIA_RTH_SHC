'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProjectLlm } from '../context/ProjectLlmContext';
import { projectLlmClient } from '@/lib/project-llm/api/projectLlmClient';
import type { CanonicalWorkflowState } from '@/lib/project-llm/types/canonicalWorkflowState';

export default function WorkflowDetailsPage() {
  const { state } = useProjectLlm();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId') || state.workflowId;
  const [workflow, setWorkflow] = useState<CanonicalWorkflowState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setWorkflow(null);
    setError(false);
    if (!workflowId) {
      setLoading(false);
      return () => { cancelled = true; };
    }
    setLoading(true);
    void projectLlmClient.getWorkflowState(workflowId).then((result) => {
      if (!cancelled) setWorkflow(result);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [workflowId]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Workflow and evidence details</h1>
        {!workflowId && <p className="mt-3 text-sm text-slate-600">Select a workflow to view its status.</p>}
        {loading && <p className="mt-3 text-sm text-slate-600">Loading workflow status…</p>}
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">Workflow status is unavailable.</p>}
        {workflow && <p className="mt-3 text-sm text-slate-600">Workflow status: {workflow.state}</p>}
        <p className="mt-3 text-sm text-slate-600">Audit history and verification evidence are currently unavailable.</p>
      </article>
    </section>
  );
}

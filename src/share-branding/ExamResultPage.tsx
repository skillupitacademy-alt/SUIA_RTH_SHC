import { headers } from 'next/headers';
import Link from 'next/link';

import { BrandConfig } from './brandConfig';

interface ExamResultPageProps {
  brand: BrandConfig;
  examId?: string;
}

interface QuizResult {
  status?: string;
  message?: string;
  score?: number;
  total?: number;
  percentage?: number;
  statusLabel?: string;
  overallScore?: number;
  dimensions?: Array<{
    dimension?: string;
    name?: string;
    score?: number;
    total?: number;
    percentage?: number;
  }>;
}

async function fetchResult(examId: string): Promise<QuizResult> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http';

  if (host === null || host.trim() === '') {
    throw new Error('Unable to resolve result host');
  }

  const response = await fetch(`${proto}://${host}/api/quiz/result?examId=${encodeURIComponent(examId)}`, {
    cache: 'no-store',
    headers: {
      cookie: requestHeaders.get('cookie') ?? '',
      accept: 'application/json',
    },
  });

  const payload = (await response.json().catch(() => null)) as QuizResult | null;
  if (!response.ok || payload === null) {
    throw new Error('Unable to load result');
  }

  return payload;
}

export default async function ExamResultPage({ brand, examId }: ExamResultPageProps) {
  if (examId === undefined || examId.trim() === '') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Result unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">Missing exam id.</p>
          <Link className="mt-5 inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: brand.primaryColor }} href="/launch-exam">
            Start Exam
          </Link>
        </div>
      </main>
    );
  }

  const result = await fetchResult(examId.trim());
  const percentage = result.percentage ?? result.overallScore ?? 0;
  const isProcessing = result.status === 'processing' || result.status === 'started';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: brand.primaryColor }}>{brand.name}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Exam Result</h1>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {isProcessing ? (
            <>
              <h2 className="text-xl font-bold text-slate-900">Result is processing</h2>
              <p className="mt-2 text-sm text-slate-600">{result.message ?? 'Please refresh shortly.'}</p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Score</p>
                  <p className="mt-1 text-5xl font-black text-slate-900">{Math.round(percentage)}%</p>
                </div>
                <div className="rounded-md px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: brand.primaryColor }}>
                  {result.statusLabel ?? result.status ?? 'completed'}
                </div>
              </div>

              {result.dimensions !== undefined && result.dimensions.length > 0 && (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {result.dimensions.map((dimension) => (
                    <div key={`${dimension.dimension ?? dimension.name}`} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-900">{dimension.name ?? dimension.dimension}</p>
                      <p className="mt-1 text-sm text-slate-600">{Math.round(dimension.percentage ?? 0)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

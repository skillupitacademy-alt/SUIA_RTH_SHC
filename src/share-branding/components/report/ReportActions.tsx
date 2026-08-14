import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

interface ReportActionsProps {
  onRetake?: () => void;
  onDashboard?: () => void;
}

export function ReportActions({ onRetake, onDashboard }: ReportActionsProps) {
  const router = useRouter();

  const handleRetake = onRetake || (() => router.push('/launch-exam/configure'));
  const handleDashboard = onDashboard || (() => router.push('/dashboard'));

  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        onClick={handleRetake}
        className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#ff0055] hover:bg-[#e0004d] shadow-md transition-all text-sm flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Take Another Exam</span>
      </button>
      <button
        onClick={handleDashboard}
        className="px-6 py-2.5 rounded-xl font-bold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-all text-sm"
      >
        View Dashboard
      </button>
    </div>
  );
}

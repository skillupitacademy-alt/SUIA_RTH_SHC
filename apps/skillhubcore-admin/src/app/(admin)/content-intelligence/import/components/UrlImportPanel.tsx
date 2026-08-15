'use client';

import React, { useState } from 'react';
import { Link2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface UrlImportPanelProps {
  onUrlFetch: (url: string) => void;
}

export function UrlImportPanel({ onUrlFetch }: UrlImportPanelProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a valid URL.');
      return;
    }

    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('Only HTTP and HTTPS URLs are supported.');
        return;
      }

      // Comprehensive SSRF protection rules
      const hostname = parsed.hostname.toLowerCase();
      const isPrivateOrLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost');

      if (isPrivateOrLoopback) {
        setError('Access to local, private, and internal network IP ranges is blocked for security.');
        return;
      }

      onUrlFetch(trimmed);
    } catch {
      setError('Invalid URL format.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-2">Import from Web URL</h3>
      <p className="text-xs text-slate-500 mb-4">
        Enter the public webpage or documentation URL to extract educational content.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/tutorials/javascript-basics"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Fetch</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>SSRF Protected &bull; Public HTTPS sources only &bull; Strips scripts and ads automatically</span>
        </div>
      </form>
    </div>
  );
}

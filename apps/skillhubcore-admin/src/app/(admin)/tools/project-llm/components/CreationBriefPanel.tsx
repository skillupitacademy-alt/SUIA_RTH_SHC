'use client';

import React, { useState, useMemo } from 'react';
import { Clipboard, Check, Sparkles } from 'lucide-react';
import { generateI2CreationBrief } from '@/lib/project-llm';
import { CreationBrief } from '@quiz/types';

export function CreationBriefPanel() {
  const [learningIntent, setLearningIntent] = useState(
    'Introduce the learner to the topic, explain why it matters, and establish the context for the lesson.'
  );
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  // Generate brief when inputs change
  // Note: topic, audience, and notes default to empty strings. When the user
  // clears a field, useMemo recalculates with empty string, which is then
  // converted to undefined via ternary (topic || undefined) in the generator
  // call. This ensures optional fields are properly omitted from the brief
  // when not provided, rather than being included as empty strings.
  const brief = useMemo<CreationBrief | null>(() => {
    try {
      setBriefError(null);
      const requestId = `panel-i2-${learningIntent.slice(0, 8).replace(/\s/g, '-')}`;
      return generateI2CreationBrief({
        requestId,
        learningIntent,
        topic: topic || undefined,
        audience: audience || undefined,
        notes: notes || undefined,
      });
    } catch (error) {
      setBriefError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }, [learningIntent, topic, audience, notes]);

  const handleCopy = async () => {
    if (brief?.promptText) {
      await navigator.clipboard.writeText(brief.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit tracking-tight">
                Creation Brief Builder
              </h3>
              <p className="text-xs text-slate-500">Agent E · Introduction I2 pilot</p>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-pink-700">
            GUI Prototype First
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            Generate the controlled External AI handoff brief from the current Project LLM
            repository intelligence.
          </p>

          {/* Form Fields */}
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="learning-intent" className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Learning Intent *
              </label>
              <textarea
                id="learning-intent"
                value={learningIntent}
                onChange={(e) => setLearningIntent(e.target.value)}
                rows={5}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="What should learners understand after this block?"
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Topic / domain
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: JavaScript closures"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="audience" className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Audience
              </label>
              <input
                id="audience"
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Example: Beginner developers"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-1.5">
                Additional notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any special requirements or context..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Brief Preview */}
        <div className="space-y-4">
          {briefError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <h4 className="text-sm font-bold text-rose-900 mb-1">Generation Error</h4>
              <p className="text-xs text-rose-700">{briefError}</p>
            </div>
          ) : brief ? (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Reference
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {brief.referenceImplementation?.versionId ?? 'None'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Stage
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">GUI Prototype</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Artifacts
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {brief.requiredArtifacts.length}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Checks
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {brief.validationChecklist.length}
                  </p>
                </div>
              </div>

              {/* Prompt Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 font-outfit">
                    Brief Prompt
                  </h4>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard size={14} />
                        <span>Copy Brief</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 whitespace-pre-wrap">
                  {brief.promptText}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

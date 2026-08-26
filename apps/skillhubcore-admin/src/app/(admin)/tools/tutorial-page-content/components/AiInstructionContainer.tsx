/**
 * AI Instruction Container Component
 * 
 * Displays AI generation instructions with hierarchy context and prompt copying.
 * Already existed as a separate component but was embedded in main file.
 */

'use client';

import { useState, useMemo } from 'react';
import { Bot, Check, ChevronDown, ChevronUp, Copy, Sparkles } from 'lucide-react';
import type { TutorialPageContentType } from '@quiz/types';
import type { TutorialPromptContext } from '../prompts/tutorialPromptContext';
import { buildTutorialPrompt } from '../prompts/tutorialPrompt.shared';
import { getDefinitionD1Prompt } from '../blocks/definition/D1/definitionD1.prompt';
import { getCodeC1Prompt } from '../blocks/code/C1/codeC1.prompt';
import { getSummaryS1Prompt } from '../blocks/summary/S1/summaryS1.prompt';

interface AiInstructionContainerProps {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  navigationNodeName: string;
  blockName: string;
  versionName: string;
  blockType: TutorialPageContentType;
  versionId: string;
}

export function AiInstructionContainer({
  domainName,
  subjectName,
  topicName,
  subtopicName,
  navigationNodeName,
  blockName,
  versionName,
  blockType,
  versionId,
}: AiInstructionContainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(() => {
    const context: TutorialPromptContext = {
      domainName,
      subjectName,
      topicName,
      subtopicName,
      navigationNodeName,
      blockName,
      versionName,
      versionId,
    };

    if (blockType === 'definition') {
      return getDefinitionD1Prompt(context);
    }
    
    if (blockType === 'code') {
      return getCodeC1Prompt(context);
    }
    
    if (blockType === 'summary') {
      return getSummaryS1Prompt(context);
    }

    // Fallback using shared infrastructure
    return buildTutorialPrompt(
      context,
      `# OUTPUT REQUIREMENTS

Generate valid, production-ready ${blockType} content conforming strictly to the official platform schema.

Return valid JSON only.

Do not include markdown code fences.`
    );
  }, [domainName, subjectName, topicName, subtopicName, navigationNodeName, blockName, versionName, blockType, versionId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 transition-all shadow-md">
      {/* Container Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              AI Generation Instructions
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600">
              {blockName} ({versionName}) Contract Guidance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md bg-white border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
            title="Copy prompt for AI"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-1 text-indigo-700 hover:bg-indigo-100 transition-colors"
            aria-label={isOpen ? 'Collapse instructions' : 'Expand instructions'}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Dynamic Hierarchy Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-700">
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {domainName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {subjectName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {topicName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-100 px-2 py-0.5 font-bold text-indigo-900">
          {subtopicName}
        </span>
        {navigationNodeName && (
          <>
            <span className="text-slate-400">›</span>
            <span className="rounded bg-indigo-600 text-white px-2 py-0.5 font-bold">
              {navigationNodeName}
            </span>
          </>
        )}
        <span className="text-slate-400">›</span>
        <span className="rounded bg-white border border-indigo-200 px-2 py-0.5 font-bold text-indigo-700">
          {blockName}
        </span>
        <span className="text-slate-400">›</span>
        <span className="rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 font-bold">
          {versionName}
        </span>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-3.5 space-y-2.5 border-t border-indigo-100 pt-3 text-xs text-slate-700">
          <div className="rounded-lg bg-white/80 border border-indigo-100 p-3">
            <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              {blockName} {versionName} Visual & Content Rules
            </h4>
            {blockType === 'definition' ? (
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li><strong>2 to 4 cards:</strong> Generate 2–4 genuinely distinct properties.</li>
                <li><strong>Short titles:</strong> Keep titles to 2–6 words (e.g., &ldquo;Named Reference&rdquo;, &ldquo;Mutable&rdquo;).</li>
                <li><strong>Focused descriptions:</strong> 1–3 clear sentences explaining that single property.</li>
                <li><strong>Responsive presentation:</strong> UI automatically handles 1 col (mobile), 2 col (tablet), 3–4 col (desktop). <em>Do NOT add UI layout metadata to the JSON.</em></li>
                <li><strong>Strict JSON only:</strong> Return pure JSON matching the D1 schema with no markdown code blocks or system metadata.</li>
              </ul>
            ) : (
              <p className="text-[11px] text-slate-600">
                Generate production-ready content matching the canonical {blockType} {versionName} schema. Provide complete, valid JSON without markdown code blocks or system metadata.
              </p>
            )}
          </div>

          {/* Full Prompt Text */}
          <div className="rounded-lg bg-slate-900 p-3 border border-indigo-200 overflow-hidden">
            <pre className="text-[10px] leading-relaxed text-slate-100 whitespace-pre-wrap break-words font-mono max-h-[180px] overflow-y-auto">
              {promptText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

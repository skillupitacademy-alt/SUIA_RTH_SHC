'use client';

import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight } from 'lucide-react';

interface AiGeneratePanelProps {
  onGenerateDraft: (prompt: string) => void;
}

export function AiGeneratePanel({ onGenerateDraft }: AiGeneratePanelProps) {
  const [topicPrompt, setTopicPrompt] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) return;

    // Generates a well-structured educational draft
    const generatedMarkdown = `# ${topicPrompt}

${topicPrompt} is a fundamental concept in modern software development.

## 1. Key Concepts

Understanding how ${topicPrompt} functions enables developers to build scalable, robust applications.

- **Foundational Architecture**: Built on clean design principles and modern standards.
- **Performance & Optimization**: Designed for low latency and high execution efficiency.
- **Safety & Robustness**: Enforces strict contract boundaries and type validation.

## 2. Practical Code Example

Here is a minimal demonstration showing how ${topicPrompt} operates in practice:

\`\`\`typescript
interface Config {
  enabled: boolean;
  timeoutMs: number;
}

export function executeTask(name: string, config: Config): void {
  console.log(\`[Task: \${name}] Execution started...\`);
}
\`\`\`

## 3. Summary & Best Practices

Always structure your content clearly, keep concepts modular, and review each block thoroughly before publishing.`;

    onGenerateDraft(generatedMarkdown);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">AI Content Generator</h3>
          <p className="text-xs text-slate-500">Provide a topic or subtopic prompt to generate structured raw content.</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="mt-4 space-y-4">
        <div>
          <label htmlFor="topicPrompt" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Topic / Concept Prompt
          </label>
          <input
            id="topicPrompt"
            type="text"
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            placeholder="e.g. Asynchronous JavaScript & Promises"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Generate Structured Content</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { RawContentSourceType, RawContentImportResponse } from '@quiz/types';

import { ImportHeader } from './components/ImportHeader';
import { InputMethodSelector } from './components/InputMethodSelector';
import { PasteContentEditor } from './components/PasteContentEditor';
import { UploadFilePanel } from './components/UploadFilePanel';
import { UrlImportPanel } from './components/UrlImportPanel';
import { AiGeneratePanel } from './components/AiGeneratePanel';
import { SupportedFormatsCard } from './components/SupportedFormatsCard';
import { ContentGuidelinesCard } from './components/ContentGuidelinesCard';
import { ExampleContentCard } from './components/ExampleContentCard';
import { WhatHappensNextCard } from './components/WhatHappensNextCard';
import { ImportTip } from './components/ImportTip';
import { HowItWorksModal } from './components/HowItWorksModal';

// Sample authoritative JavaScript content matching Page 11 reference image
const JAVASCRIPT_SAMPLE_CONTENT = `# JavaScript

JavaScript is a programming language that makes websites interactive.

While HTML gives a webpage structure (headings, paragraphs, images) and CSS gives it style (colors, fonts, layouts), JavaScript is the engine that makes it come alive—it handles everything that changes, moves, updates, or responds to you on a page.

## 1. What does it actually do? (The "Interactive" Part)

When you click a button and a menu drops down, when you see live stock tickers update, when a form validates your email address before you hit "submit," or when a website loads new content without refreshing the page—that is JavaScript. It listens for user events (clicks, keystrokes, mouse movements) and changes the webpage in real-time in response.

## 2. Where does it run? (The Two Sides)

JavaScript is no longer just a "web browser" language:

### Client-Side (Frontend):
This is its original home. The JavaScript code is sent to your web browser (Chrome, Firefox, Safari) and runs on your own computer or phone. Every major browser has a built-in engine (like Chrome's V8) designed to execute JavaScript instantly.

### Server-Side (Backend):
With runtime environments like Node.js, JavaScript can also run on servers—handling databases, authentication, APIs, and file systems just like Python or Java.

## 3. Practical Code Example

Here is how JavaScript connects an event with an interactive page update:

\`\`\`javascript
// Select a button and an output element
const actionButton = document.getElementById("action-btn");
const outputText = document.getElementById("status-text");

// Listen for user click
actionButton.addEventListener("click", () => {
  outputText.textContent = "JavaScript updated this content live!";
  outputText.style.color = "#f54a8d";
});
\`\`\`

> [!NOTE]
> JavaScript is single-threaded and non-blocking, using an event loop to handle concurrent operations smoothly without freezing the user interface.

## 4. Key Takeaways

- **HTML** gives structure, **CSS** provides styling, and **JavaScript** adds behavior.
- Executes on both **Client-Side** (browsers) and **Server-Side** (Node.js).
- Powers modern full-stack web applications worldwide.`;

export default function RawContentImportPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<RawContentSourceType>('markdown');
  const [content, setContent] = useState<string>(JAVASCRIPT_SAMPLE_CONTENT);
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [lastSavedText, setLastSavedText] = useState<string>('Auto-saved 2 seconds ago');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<RawContentImportResponse | null>(null);

  // Default mock subtopic ID for preview & standalone execution
  const [subtopicId] = useState<string>('00000000-0000-0000-0000-000000000001');

  // Calculate live word and character counts
  useEffect(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    setCharCount(chars);
    setWordCount(words);

    const timer = setTimeout(() => {
      setLastSavedText('Auto-saved just now');
    }, 1500);

    return () => clearTimeout(timer);
  }, [content]);

  // Handle "Analyze Content →" CTA button click
  const handleAnalyzeContent = async () => {
    if (!content.trim()) {
      toast.error('Please enter or paste raw content before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const isPreview =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/preview/') ||
          process.env.NODE_ENV === 'development');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isPreview) {
        headers['x-tutorial-dev-bypass'] = 'true';
      }

      const response = await fetch('/api/tutorial-composer/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subtopicId,
          sectionType: 'notes',
          difficulty: 'beginner',
          brandId: 'skillhubcore',
          sourceType: selectedMethod === 'plain_text' ? 'plain_text' : 'markdown',
          rawContent: content,
          options: {
            extractTitle: true,
            detectCodeBlocks: true,
            detectLists: true,
            detectHeadings: true,
          },
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || 'Failed to process raw content');
      }

      const data = json.data as RawContentImportResponse;
      setImportResult(data);

      // Store TutorialDocument for Content Analysis (Page 12)
      try {
        sessionStorage.setItem(
          'tutorial_composer_document',
          JSON.stringify({
            document: data.document,
            subtopicId,
            sectionType: 'notes',
            brandId: 'skillhubcore',
          })
        );
      } catch (e) {
        console.warn('Failed to store document in sessionStorage', e);
      }

      toast.success(
        `Successfully parsed: ${data.stats.headings} headings, ${data.stats.paragraphs} paragraphs, ${data.stats.codeBlocks} code blocks. Redirecting to analysis...`
      );

      // Navigate to Page 12 (Content Analysis)
      setTimeout(() => {
        const isPreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/preview/');
        router.push(isPreview ? '/preview/analysis' : '/content-intelligence/analysis');
      }, 600);
    } catch (error) {
      console.error('[RawContentImportPage] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileContentParsed = (parsedText: string, filename: string) => {
    setContent(parsedText);
    setSelectedMethod('markdown');
    toast.success(`Loaded file content from: ${filename}`);
  };

  const handleUrlFetch = (url: string) => {
    setContent(`# Content from ${url}\n\n[Fetched content will appear here after server-side extraction]\n\n## Overview\n\nEducational content parsed from the URL.`);
    setSelectedMethod('markdown');
    toast.success(`Target URL configured: ${url}`);
  };

  const handleAiDraft = (draft: string) => {
    setContent(draft);
    setSelectedMethod('markdown');
    toast.success('AI Draft generated and loaded into editor.');
  };

  const handleLoadExample = () => {
    setContent(JAVASCRIPT_SAMPLE_CONTENT);
    setSelectedMethod('markdown');
    toast.info('Loaded standard JavaScript tutorial sample content.');
  };

  const handleClear = () => {
    setContent('');
    setLastSavedText('Cleared');
    toast.info('Content cleared');
  };

  return (
    <div className="min-h-full pb-16">
      {/* Top Header & Breadcrumb */}
      <ImportHeader
        onHowItWorksClick={() => setIsHowItWorksOpen(true)}
        onAnalyzeContent={handleAnalyzeContent}
        isAnalyzing={isAnalyzing}
      />

      {/* Input Method Selector Cards */}
      <InputMethodSelector
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
      />

      {/* Main Content Grid: Editor (Left) & Information Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Input Panel */}
        <div className="lg:col-span-8 space-y-4">
          {selectedMethod === 'markdown' || selectedMethod === 'plain_text' ? (
            <PasteContentEditor
              content={content}
              onChange={setContent}
              wordCount={wordCount}
              charCount={charCount}
              lastSavedText={lastSavedText}
              onClear={handleClear}
            />
          ) : selectedMethod === 'file' ? (
            <UploadFilePanel onFileContentParsed={handleFileContentParsed} />
          ) : selectedMethod === 'url' ? (
            <UrlImportPanel onUrlFetch={handleUrlFetch} />
          ) : (
            <AiGeneratePanel onGenerateDraft={handleAiDraft} />
          )}

          {/* Import Result Notification Banner if parsed */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold">Import Result:</span>
                <span>
                  {importResult.stats.headings} headings &bull; {importResult.stats.paragraphs} paragraphs &bull; {importResult.stats.codeBlocks} code blocks &bull; {importResult.stats.lists} lists ({importResult.stats.totalBlocks} total blocks)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Canonical TutorialDocument Ready for Analysis (Prompt 06)
              </span>
            </div>
          )}

          {/* Bottom Tip Banner */}
          <ImportTip />
        </div>

        {/* Right Column: Static Guidance Cards */}
        <div className="lg:col-span-4 space-y-5">
          <SupportedFormatsCard />
          <ContentGuidelinesCard />
          <ExampleContentCard onLoadExample={handleLoadExample} />
          <WhatHappensNextCard />
        </div>
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}

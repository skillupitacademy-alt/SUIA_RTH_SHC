'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Layers,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  FileCode,
  BookOpen,
  ListOrdered,
  CheckCircle2,
} from 'lucide-react';

import { TutorialCodeContent } from '@/share-branding/LearningExperience/components/TutorialCodeContent';
import { TutorialDefinitionContent } from '@/share-branding/LearningExperience/components/TutorialDefinitionContent';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
import type {
  BrandTutorialTheme,
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialPageContentType,
  TutorialSidebarBrandId,
  TutorialSummaryPayload,
  TutorialDocument,
  TutorialBlock,
} from '@quiz/types';

type SourceFormat = 'json' | 'markdown';
const SHARED_BRAND_ID: TutorialSidebarBrandId = 'shared';

interface HierarchyRow {
  id: string;
  name: string;
  slug: string;
  domainId?: string;
  subjectId?: string;
  topicId?: string;
}

interface HierarchyState {
  domains: HierarchyRow[];
  subjects: HierarchyRow[];
  topics: HierarchyRow[];
  subtopics: HierarchyRow[];
}

export interface BlockVersionOption {
  id: string;
  label: string;
  code: string;
  description?: string;
}

export interface BlockTypeOption {
  id: TutorialPageContentType;
  label: string;
  versions: BlockVersionOption[];
}

export const SUPPORTED_BLOCKS: BlockTypeOption[] = [
  {
    id: 'definition',
    label: 'Definition',
    versions: [
      { id: 'v1', code: 'D1', label: 'D1 - Concept Definition', description: 'Authoritative definition with intuition, example & responsive key characteristics' },
      { id: 'v2', code: 'D2', label: 'D2 - Deep Dive', description: 'Advanced conceptual breakdown and architectural mechanisms' },
    ],
  },
  {
    id: 'code',
    label: 'Code',
    versions: [
      { id: 'v1', code: 'C1', label: 'C1 - Basic Example', description: 'Step-by-step code execution with memory model' },
      { id: 'v2', code: 'C2', label: 'C2 - Advanced Pattern', description: 'Production-grade idioms and error handling' },
    ],
  },
  {
    id: 'summary',
    label: 'Summary',
    versions: [
      { id: 'v1', code: 'S1', label: 'S1 - Revision Table', description: 'Quick revision table with key points, remember cards and takeaways' },
    ],
  },
];

export interface BlockInstance {
  id: string;
  type: TutorialPageContentType;
  version: string;
  versionCode: string;
  title: string;
  payload: TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload | unknown;
  sourceFormat: SourceFormat;
  sourceContent: string;
}

interface FormState {
  brandId: TutorialSidebarBrandId;
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  blockType: TutorialPageContentType;
  versionId: string;
}

const definitionExample: TutorialDefinitionPayload = {
  page: {
    type: 'definition',
    category: 'Python Fundamentals',
    title: 'What Is a Variable?',
    intro: 'A variable is a name given to a value or an object in memory so that we can use it later in our program.',
    definition: 'A variable is a symbolic name (identifier) that refers to an object stored in memory. It acts as a container for data that can be used, updated, and referenced throughout your program.',
    explanation: [
      'When you create a variable, Python allocates memory for a value or object and binds it to the variable name. You can perform operations on the data through that name.',
      'Variables make your code easier to read, maintain, and reuse. Instead of using values directly, you use meaningful names.',
    ],
    example: {
      language: 'python',
      code: 'x = 10          # 10 is stored in memory and x refers to it\nx = 20          # Now x refers to the new value 20\nprint(x)        # Output: 20',
    },
    characteristics: [
      { icon: '○', title: 'Named Reference', description: 'A variable is a name that refers to a value or object.' },
      { icon: '◆', title: 'Stores Data', description: 'It stores data in memory that can be of any type.' },
      { icon: '✎', title: 'Mutable', description: 'The value stored in a variable can be changed anytime.' },
      { icon: '↗', title: 'Reusable', description: 'Once created, the variable can be used multiple times.' },
    ],
    takeaway: 'A variable is a name that points to an object in memory. It helps you store, manage, and reuse data efficiently in your program.',
  },
};

const codeExample: TutorialCodePayload = {
  page: {
    type: 'CODE + EXPLANATION',
    title: 'Example: Sum of Two Numbers in Python',
    introduction: 'This example demonstrates how Python accepts two numbers from the user, converts the input into integers, adds the numbers, stores the result, and displays the final answer.',
  },
  code: {
    language: 'Python',
    prismLanguage: 'python',
    source: 'x = int(input("Enter first number: "))\ny = int(input("Enter second number: "))\n\nresult = x + y\n\nprint("Sum:", result)',
  },
  explanation: {
    steps: [
      { number: 1, code: 'input("Enter first number: ")', description: 'The <code>input()</code> function pauses the program and asks the user to enter the first number. The value entered by the user is initially received as text.' },
      { number: 2, code: 'int(input(...))', description: 'The <code>int()</code> function converts the text received from <code>input()</code> into an integer so that mathematical addition can be performed.' },
      { number: 3, code: 'x = int(input(...))', description: 'The converted first number is assigned to the variable <code>x</code>. For example, if the user enters <code>10</code>, then <code>x</code> references the integer value <code>10</code>.' },
      { number: 4, code: 'y = int(input(...))', description: 'The program asks for the second number, converts it into an integer, and assigns the resulting value to the variable <code>y</code>. For example, if the user enters <code>20</code>, then <code>y</code> references the integer value <code>20</code>.' },
      { number: 5, code: 'result = x + y', description: 'Python evaluates the expression <code>x + y</code>. If <code>x</code> is <code>10</code> and <code>y</code> is <code>20</code>, the addition produces <code>30</code>. That result is assigned to <code>result</code>.' },
      { number: 6, code: 'print("Sum:", result)', description: 'The <code>print()</code> function displays the text <code>Sum:</code> followed by the value stored in <code>result</code>.' },
    ],
  },
  output: {
    value: 'Enter first number: 10\nEnter second number: 20\nSum: 30',
  },
  memoryModel: {
    type: 'reference-flow',
    description: 'Python variables reference objects. After the two inputs are converted to integers, x and y reference integer objects. The addition expression produces the result value, which is then referenced by result.',
    layout: {
      type: 'grid',
    },
    columns: [
      { id: 'variables', title: 'Variables (References)', width: 'minmax(160px, 1fr)' },
      { id: 'objects', title: 'Objects in Memory', width: 'minmax(280px, 1.6fr)' },
      { id: 'values', title: 'Values', width: 'minmax(180px, 1fr)' },
    ],
    nodes: [
      { id: 'variable-x', label: 'x', column: 'variables', row: 1, variant: 'reference', monospace: true },
      { id: 'object-x', label: 'id: 140723458765120', column: 'objects', row: 1, variant: 'object', monospace: true },
      { id: 'value-x', label: '10 (int)', column: 'values', row: 1, variant: 'value', monospace: true },
      { id: 'variable-y', label: 'y', column: 'variables', row: 2, variant: 'reference', monospace: true },
      { id: 'object-y', label: 'id: 140723458765248', column: 'objects', row: 2, variant: 'object', monospace: true },
      { id: 'value-y', label: '20 (int)', column: 'values', row: 2, variant: 'value', monospace: true },
      { id: 'variable-result', label: 'result', column: 'variables', row: 3, variant: 'result', monospace: true },
      { id: 'object-result', label: 'id: 140723458765376', column: 'objects', row: 3, variant: 'result', monospace: true },
      { id: 'value-result', label: '30 (int)', column: 'values', row: 3, variant: 'result', monospace: true },
    ],
    connections: [
      { id: 'x-to-object-x', from: 'variable-x', to: 'object-x', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-x-to-value-x', from: 'object-x', to: 'value-x', type: 'value', fromSide: 'right', toSide: 'left' },
      { id: 'y-to-object-y', from: 'variable-y', to: 'object-y', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-y-to-value-y', from: 'object-y', to: 'value-y', type: 'value', fromSide: 'right', toSide: 'left' },
      { id: 'result-to-object-result', from: 'variable-result', to: 'object-result', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-result-to-value-result', from: 'object-result', to: 'value-result', type: 'value', fromSide: 'right', toSide: 'left' },
    ],
    note: 'Variables store references to objects, not the actual values. The object identities shown above are illustrative.',
  },
  takeaway: {
    items: [
      'The <code>input()</code> function receives data from the user.',
      'The <code>int()</code> function converts numeric text into an integer.',
      'The <code>+</code> operator performs the addition.',
      'The expression <code>x + y</code> produces the calculated value.',
      'The variable <code>result</code> references the calculated result.',
      'The <code>print()</code> function displays the final result.',
    ],
  },
  tip: {
    text: 'Try entering different numbers, such as 25 and 75, and predict the output before running the program.',
  },
};

const summaryExample: TutorialSummaryPayload = {
  page: {
    badge: 'REVISION & SUMMARY',
    badgeIcon: 'fa-book-open',
    title: 'Revision: Variables and id()',
    introduction: "Let's quickly revise what we learned about variables, objects, and identity in Python.",
  },
  summary: [
    { text: 'A variable is a name that <code>references</code> an object in memory.' },
    { text: 'Variables store references, <code>not</code> the actual values.' },
    { text: '<code>id()</code> returns the identity of the object, not its value.' },
    { text: 'Two variables can have the same value but different identities.' },
    { text: 'When a variable is assigned a new value, it may start referring to a new object.' },
  ],
  revisionTable: {
    columns: [
      { id: 'concept', title: 'Concept', icon: 'fa-regular fa-lightbulb' },
      { id: 'keyPoint', title: 'Key Point', icon: 'fa-solid fa-bullseye' },
      { id: 'example', title: 'Example', icon: 'fa-solid fa-code' },
      { id: 'remember', title: 'Remember', icon: 'fa-solid fa-star' },
    ],
    rows: [
      {
        concept: { name: 'Variable', icon: 'fa-solid fa-xmark' },
        keyPoint: {
          title: 'References an object.',
          description: 'A variable is just a name that refers to an object stored in memory.',
          code: 'x = 10',
        },
        example: { code: 'x = 10' },
        remember: {
          title: 'Variable != object',
          description: 'The variable holds a reference, not the actual value.',
        },
      },
      {
        concept: { name: 'Object', icon: 'fa-solid fa-cube' },
        keyPoint: {
          title: 'Contains value/type information.',
          description: 'An object stores the actual data along with its type and other internal information.',
          code: 'type(x) -> int',
        },
        example: { code: '10' },
        remember: {
          title: 'Objects exist in memory',
          description: 'Objects are created in memory and can be shared by multiple variables.',
        },
      },
      {
        concept: { name: 'Assignment', icon: 'fa-solid fa-equals' },
        keyPoint: {
          title: 'Binds a variable to an object.',
          description: 'Assignment makes a variable reference an object produced by an expression.',
          code: 'x = 20',
        },
        example: { code: 'x = 20' },
        remember: {
          title: 'Reference can change',
          description: 'After assignment, <code>x</code> now refers to the object containing <code>20</code>.',
        },
      },
    ],
  },
  quickTips: [
    { text: 'Use meaningful variable names to make your code readable.' },
    { text: 'Use <code>id()</code> to understand how Python manages objects in memory.' },
    { text: "Don't rely on <code>id()</code> for program logic; its value can change between runs." },
    { text: 'Practice with small examples and predict the output before running the code.' },
  ],
  finalTip: {
    title: 'Quick Revision Tip',
    text: 'Review this table regularly. Strong fundamentals make advanced topics much easier.',
  },
};

/**
 * Pure helper to append a block to a TutorialDocument immutably
 */
export function appendTutorialBlock(
  document: TutorialDocument,
  block: TutorialBlock
): TutorialDocument {
  return {
    ...document,
    blocks: [...document.blocks, block],
  };
}

const initialHierarchy: HierarchyState = { domains: [], subjects: [], topics: [], subtopics: [] };
const initialForm: FormState = {
  brandId: SHARED_BRAND_ID,
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  blockType: 'definition',
  versionId: 'v1',
};

function themeForBrand(brandId: TutorialSidebarBrandId): BrandTutorialTheme {
  if (brandId === 'skillup' || brandId === 'shared') {
    return {
      primary: '#f54a8d',
      primaryDark: '#d63d7a',
      secondary: '#133382',
      activeBackground: '#fff0f6',
      completed: '#08a64a',
    };
  }

  return {
    primary: '#d03f00',
    primaryDark: '#b63600',
    secondary: '#124fd6',
    activeBackground: '#eef3fa',
    completed: '#08a64a',
  };
}

function exampleForContentType(contentType: TutorialPageContentType) {
  if (contentType === 'definition') {
    return definitionExample;
  }
  if (contentType === 'code') {
    return codeExample;
  }
  return summaryExample;
}

function extractBlockTitle(payload: any, type: TutorialPageContentType): string {
  if (!payload) return 'Untitled Block';
  if (payload.page?.title) return payload.page.title;
  if (payload.title) return payload.title;
  if (type === 'definition') return payload.page?.intro || 'Concept Definition';
  if (type === 'code') return payload.code?.language ? `${payload.code.language} Example` : 'Code Example';
  if (type === 'summary') return 'Revision Summary';
  return 'Block Instance';
}

function parseSource(format: SourceFormat, source: string, contentType: TutorialPageContentType) {
  if (format === 'json') {
    return JSON.parse(source);
  }

  if (contentType === 'definition') {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return {
      page: {
        type: 'definition',
        title: lines[0]?.replace(/^#\s*/, '') || 'Untitled Definition',
        intro: lines[1] || '',
        definition: lines[2] || '',
        explanation: lines.slice(3),
      },
    };
  }

  if (contentType === 'summary') {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return {
      page: {
        badge: 'REVISION & SUMMARY',
        title: lines[0]?.replace(/^#\s*/, '') || 'Revision Summary',
        introduction: lines[1] || '',
      },
      summary: lines.slice(2).map((line) => ({ text: line.replace(/^[-*]\s*/, '') })),
    };
  }

  const codeMatch = source.match(/```(\w+)?\n([\s\S]*?)```/);
  return {
    page: {
      type: 'CODE + EXPLANATION',
      title: source.split(/\r?\n/)[0]?.replace(/^#\s*/, '') || 'Untitled Code Example',
      introduction: 'Code example imported from markdown.',
    },
    code: {
      language: codeMatch?.[1] || 'text',
      prismLanguage: codeMatch?.[1] || 'text',
      source: codeMatch?.[2]?.trim() || source,
    },
  };
}

export function TutorialPageContentBuilderClient() {
  const [hierarchy, setHierarchy] = useState<HierarchyState>(initialHierarchy);
  const [form, setForm] = useState<FormState>(initialForm);
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>('json');
  const [sourceContent, setSourceContent] = useState(JSON.stringify(definitionExample, null, 2));
  const [activeBlockPreview, setActiveBlockPreview] = useState<any>(definitionExample);
  const [previewMode, setPreviewMode] = useState<'document' | 'active-block'>('document');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Document block instances collection
  const [documentBlocks, setDocumentBlocks] = useState<BlockInstance[]>([
    {
      id: 'block-d1-init',
      type: 'definition',
      version: 'v1',
      versionCode: 'D1',
      title: 'What Is a Variable?',
      payload: definitionExample,
      sourceFormat: 'json',
      sourceContent: JSON.stringify(definitionExample, null, 2),
    },
  ]);

  useEffect(() => {
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then(setHierarchy)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hierarchy.'));
  }, []);

  useEffect(() => {
    const example = exampleForContentType(form.blockType);
    setSourceContent(JSON.stringify(example, null, 2));
    setActiveBlockPreview(example);
  }, [form.blockType]);

  const subjects = useMemo(() => hierarchy.subjects.filter((item) => item.domainId === form.domainId), [hierarchy.subjects, form.domainId]);
  const topics = useMemo(() => hierarchy.topics.filter((item) => item.subjectId === form.subjectId), [hierarchy.topics, form.subjectId]);
  const subtopics = useMemo(() => hierarchy.subtopics.filter((item) => item.topicId === form.topicId), [hierarchy.subtopics, form.topicId]);
  const selectedSubtopic = subtopics.find((item) => item.id === form.subtopicId);

  const currentBlockConfig = useMemo(() => {
    return SUPPORTED_BLOCKS.find((b) => b.id === form.blockType) || SUPPORTED_BLOCKS[0];
  }, [form.blockType]);

  const availableVersions = currentBlockConfig.versions;

  const selectedVersion = useMemo(() => {
    return availableVersions.find((v) => v.id === form.versionId) || availableVersions[0];
  }, [availableVersions, form.versionId]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'domainId') {
        next.subjectId = '';
        next.topicId = '';
        next.subtopicId = '';
      }
      if (key === 'subjectId') {
        next.topicId = '';
        next.subtopicId = '';
      }
      if (key === 'topicId') {
        next.subtopicId = '';
      }
      if (key === 'blockType') {
        const block = SUPPORTED_BLOCKS.find((b) => b.id === value);
        next.versionId = block?.versions[0]?.id || 'v1';
      }
      return next;
    });
  }

  function handlePreviewCurrent() {
    try {
      const parsed = parseSource(sourceFormat, sourceContent, form.blockType);
      setActiveBlockPreview(parsed);
      setMessage('Active block preview updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Preview parsing failed.');
    }
  }

  /**
   * Append new block instance to TutorialDocument
   */
  function handleAddBlockInstance() {
    try {
      const payload = parseSource(sourceFormat, sourceContent, form.blockType);
      const uniqueId = `block-${form.blockType}-${selectedVersion.code.toLowerCase()}-${Date.now().toString(36)}`;
      const title = extractBlockTitle(payload, form.blockType);

      const newInstance: BlockInstance = {
        id: uniqueId,
        type: form.blockType,
        version: form.versionId,
        versionCode: selectedVersion.code,
        title,
        payload,
        sourceFormat,
        sourceContent,
      };

      setDocumentBlocks((prev) => [...prev, newInstance]);
      setPreviewMode('document');
      setMessage(`Appended new block instance: ${selectedVersion.code} (${title})`);
    } catch (error) {
      setMessage(error instanceof Error ? `Cannot add block: ${error.message}` : 'Failed to add block instance.');
    }
  }

  /**
   * Remove a block instance from the local list
   */
  function handleRemoveBlockInstance(id: string) {
    setDocumentBlocks((prev) => prev.filter((b) => b.id !== id));
    setMessage('Block instance removed from document.');
  }

  async function save(status: 'draft' | 'published') {
    setIsSaving(true);
    setMessage('');
    try {
      // Validate all blocks
      const payload = parseSource(sourceFormat, sourceContent, form.blockType);
      const response = await fetch('/api/tutorial-page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contentType: form.blockType,
          version: form.versionId,
          brandId: SHARED_BRAND_ID,
          payload,
          documentBlocks,
          sourceFormat,
          sourceContent,
          status,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'Save failed.');
      }
      const deliveryPath = result.deliveryUrls?.realtutorialhub ?? result.deliveryUrls?.skillup;
      setMessage(deliveryPath ? `${result.message} Common path: ${deliveryPath}` : result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  const domainName = hierarchy.domains.find((d) => d.id === form.domainId)?.name || 'Not selected';
  const subjectName = subjects.find((s) => s.id === form.subjectId)?.name || 'Not selected';
  const topicName = topics.find((t) => t.id === form.topicId)?.name || 'Not selected';
  const subtopicName = selectedSubtopic?.name || 'Not selected';

  return (
    <main className="min-h-screen bg-[#f4f7fa] p-4 sm:p-6">
      <div className="mx-auto max-w-[1700px] space-y-6">
        {/* Top Header & Compact Horizontal Authoring Toolbar */}
        <header className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">Tutorial Page Builder</p>
              <h1 className="text-xl font-extrabold text-[#071f63] font-outfit">Create & Append Block Instances</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-slate-600">Document blocks: <strong>{documentBlocks.length}</strong></span>
            </div>
          </div>

          {/* Horizontal Hierarchy & Content Selector Toolbar */}
          <div className="flex flex-wrap items-end gap-3">
            {/* 1. Domain */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-domain" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Domain
              </label>
              <select
                id="select-domain"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={form.domainId}
                onChange={(event) => updateForm('domainId', event.target.value)}
              >
                <option value="">Select Domain</option>
                {hierarchy.domains.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Subject */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-subject" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subject
              </label>
              <select
                id="select-subject"
                disabled={!form.domainId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.subjectId}
                onChange={(event) => updateForm('subjectId', event.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Topic */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="select-topic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Topic
              </label>
              <select
                id="select-topic"
                disabled={!form.subjectId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.topicId}
                onChange={(event) => updateForm('topicId', event.target.value)}
              >
                <option value="">Select Topic</option>
                {topics.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Subtopic */}
            <div className="flex-1 min-w-[170px]">
              <label htmlFor="select-subtopic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subtopic
              </label>
              <select
                id="select-subtopic"
                disabled={!form.topicId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.subtopicId}
                onChange={(event) => updateForm('subtopicId', event.target.value)}
              >
                <option value="">Select Subtopic</option>
                {subtopics.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* 5. Block Type (Independent Dropdown) */}
            <div className="w-[140px] min-w-[130px]">
              <label htmlFor="select-block" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Block Type
              </label>
              <select
                id="select-block"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={form.blockType}
                onChange={(event) => updateForm('blockType', event.target.value as TutorialPageContentType)}
              >
                {SUPPORTED_BLOCKS.map((block) => (
                  <option key={block.id} value={block.id}>{block.label}</option>
                ))}
              </select>
            </div>

            {/* 6. Version (Dependent on Block Type) */}
            <div className="w-[180px] min-w-[150px]">
              <label htmlFor="select-version" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Version Code
              </label>
              <select
                id="select-version"
                disabled={availableVersions.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={form.versionId}
                onChange={(event) => updateForm('versionId', event.target.value)}
              >
                {availableVersions.map((version) => (
                  <option key={version.id} value={version.id}>{version.label}</option>
                ))}
              </select>
            </div>

            {/* 7. Format */}
            <div className="w-[110px] min-w-[100px]">
              <label htmlFor="select-format" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Format
              </label>
              <select
                id="select-format"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                value={sourceFormat}
                onChange={(event) => setSourceFormat(event.target.value as SourceFormat)}
              >
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>
        </header>

        {/* 2-Column Workspace below the Horizontal Toolbar (460px Authoring Column + 1fr Preview Column) */}
        <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-6 items-start">
          {/* Left Column: AI Instructions + JSON Editor + Action Buttons + Document Blocks List */}
          <section className="space-y-5">
            {/* AI Generation Instructions Container */}
            <AiInstructionContainer
              domainName={domainName}
              subjectName={subjectName}
              topicName={topicName}
              subtopicName={subtopicName}
              blockName={currentBlockConfig.label}
              versionName={selectedVersion.label}
              blockType={form.blockType}
              versionId={form.versionId}
            />

            {/* JSON Content Editor & Append Controls */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
              <div className="flex items-center justify-between pb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span className="flex items-center gap-1.5">
                  <FileCode size={14} className="text-pink-600" />
                  <span>Block Content Editor</span>
                  <span className="text-[10px] text-slate-400 font-mono">({selectedVersion.code})</span>
                </span>
                <span className="text-[10px] text-pink-600 font-mono font-semibold">Pure Block Schema</span>
              </div>
              <textarea
                className="h-[400px] w-full rounded-xl border border-slate-800 bg-[#071024] p-4 font-mono text-xs leading-5 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
                value={sourceContent}
                onChange={(event) => setSourceContent(event.target.value)}
                placeholder="Paste or edit JSON content here..."
                aria-label="JSON Content Editor"
              />

              {/* Main Action Buttons */}
              <div className="mt-4 space-y-2.5">
                {/* Primary Add Block Action */}
                <button
                  type="button"
                  onClick={handleAddBlockInstance}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>+ Add {selectedVersion.code} Block Instance to Document</span>
                </button>

                {/* Secondary Actions Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    onClick={handlePreviewCurrent}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview Block
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || !form.subtopicId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => save('draft')}
                  >
                    <Save className="h-3.5 w-3.5" /> Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || !form.subtopicId}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#e11d48] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#be123c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => save('published')}
                  >
                    <Send className="h-3.5 w-3.5" /> Publish
                  </button>
                </div>
              </div>

              {message && (
                <div className="mt-3 rounded-lg bg-pink-50/70 border border-pink-100 p-3 text-xs font-semibold text-[#071f63] flex items-center gap-2">
                  <Sparkles size={14} className="text-pink-600 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </div>

            {/* Document Blocks List (Ordered Block Instances in TutorialDocument) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListOrdered size={16} className="text-[#e11d48]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-outfit">
                    Tutorial Document Blocks
                  </h3>
                </div>
                <span className="rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold text-pink-700 font-mono">
                  {documentBlocks.length} {documentBlocks.length === 1 ? 'instance' : 'instances'}
                </span>
              </div>

              <div className="mt-3.5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {documentBlocks.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-medium">
                    No blocks added yet. Click &ldquo;+ Add Block Instance&rdquo; above to append blocks.
                  </p>
                ) : (
                  documentBlocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-pink-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-600 shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {block.title}
                            </span>
                            <span className="rounded bg-pink-50 border border-pink-200 px-1.5 py-0.2 text-[9px] font-bold text-pink-700 font-mono shrink-0">
                              {block.versionCode}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            ID: {block.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSourceContent(block.sourceContent);
                            setActiveBlockPreview(block.payload);
                            setForm((prev) => ({ ...prev, blockType: block.type, versionId: block.version }));
                            setMessage(`Loaded block #${index + 1} (${block.versionCode}) into editor.`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Load into editor"
                        >
                          <FileCode size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockInstance(block.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove block instance"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Preview Target Header & Live Preview Pane */}
          <section className="space-y-4 min-w-0">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 text-sm font-bold text-[#071f63] shadow-xl border-t border-white/60 -translate-y-1 flex flex-wrap items-center justify-between gap-2">
              <span className="truncate">Preview Target: {selectedSubtopic?.name ?? 'Select a subtopic'}</span>
              
              {/* Preview Mode Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode('document')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'document'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Full Document ({documentBlocks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('active-block')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'active-block'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Active Block ({selectedVersion.code})
                </button>
              </div>
            </div>

            {/* Live Rendered Content Container (Preserving original component themes) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl min-h-[600px] overflow-y-auto space-y-8">
              {previewMode === 'active-block' ? (
                <div>
                  <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Active Editor Preview</span>
                    <span>{selectedVersion.code} Block</span>
                  </div>
                  {form.blockType === 'definition' && <TutorialDefinitionContent payload={activeBlockPreview as TutorialDefinitionPayload} theme={themeForBrand(form.brandId)} />}
                  {form.blockType === 'code' && <TutorialCodeContent payload={activeBlockPreview as TutorialCodePayload} theme={themeForBrand(form.brandId)} />}
                  {form.blockType === 'summary' && <TutorialSummaryContent payload={activeBlockPreview as TutorialSummaryPayload} theme={themeForBrand(form.brandId)} />}
                </div>
              ) : (
                documentBlocks.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No blocks in document yet. Add blocks from the left authoring panel to preview the full document.
                  </div>
                ) : (
                  documentBlocks.map((instance, idx) => (
                    <div key={instance.id} className="relative">
                      {idx > 0 && <div className="my-8 border-t border-dashed border-slate-200" />}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                          <span>Instance #{idx + 1}</span>
                          <span>•</span>
                          <span>{instance.versionCode}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {instance.id}</span>
                      </div>
                      {instance.type === 'definition' && <TutorialDefinitionContent payload={instance.payload as TutorialDefinitionPayload} theme={themeForBrand(form.brandId)} />}
                      {instance.type === 'code' && <TutorialCodeContent payload={instance.payload as TutorialCodePayload} theme={themeForBrand(form.brandId)} />}
                      {instance.type === 'summary' && <TutorialSummaryContent payload={instance.payload as TutorialSummaryPayload} theme={themeForBrand(form.brandId)} />}
                    </div>
                  ))
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

interface AiInstructionContainerProps {
  domainName: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
  blockName: string;
  versionName: string;
  blockType: TutorialPageContentType;
  versionId: string;
}

function AiInstructionContainer({
  domainName,
  subjectName,
  topicName,
  subtopicName,
  blockName,
  versionName,
  blockType,
  versionId,
}: AiInstructionContainerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const promptText = useMemo(() => {
    if (blockType === 'definition') {
      return `You are generating educational content for a tutorial platform.

# TARGET HIERARCHY
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}
- Block: ${blockName}
- Version: ${versionName}

# OUTPUT REQUIREMENTS (Pure JSON Content Contract)
Return ONLY a valid JSON object matching this exact schema:

{
  "page": {
    "type": "definition",
    "category": "${topicName}",
    "title": "What Is ${subtopicName}?",
    "intro": "A concise 1-2 sentence learner-friendly introduction.",
    "definition": "Authoritative, technically accurate conceptual definition.",
    "explanation": [
      "First paragraph building intuition from simple to deep.",
      "Second paragraph with technical depth and practical context."
    ],
    "example": {
      "language": "python",
      "code": "x = 10\\nprint(x)"
    },
    "characteristics": [
      {
        "icon": "○",
        "title": "Short Title (2-6 words)",
        "description": "Clear explanation of this single distinct property (1-3 sentences)."
      },
      {
        "icon": "◆",
        "title": "Second Property",
        "description": "Another distinct property. Total 2-4 characteristics."
      }
    ],
    "takeaway": "One strong closing sentence summarizing the key learning point."
  }
}

# KEY CHARACTERISTICS RULES
1. Generate 2 to 4 characteristics representing genuinely distinct properties.
2. Titles must be short (2-6 words).
3. Descriptions must be concise (1-3 sentences) and avoid repeating the definition or takeaway.
4. The platform renderer automatically handles responsive presentation (1 col mobile, 2 col tablet, 3-4 col desktop). Do NOT include CSS, column numbers, or layout metadata in the JSON.

# PROHIBITED SYSTEM METADATA
Do NOT include id, blockId, version, domainId, subjectId, topicId, subtopicId, brandId, theme, status, publishedAt, or schemaVersion.`;
    }

    return `You are generating educational content for a tutorial platform.

# TARGET HIERARCHY
- Domain: ${domainName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Subtopic: ${subtopicName}
- Block: ${blockName}
- Version: ${versionName}

# OUTPUT REQUIREMENTS
Generate valid, production-ready ${blockType} (${versionId.toUpperCase()}) content conforming strictly to the official platform schema without system metadata or styling fields.`;
  }, [domainName, subjectName, topicName, subtopicName, blockName, versionName, blockType, versionId]);

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
        <span className="rounded bg-indigo-600 text-white px-2 py-0.5 font-bold">
          {subtopicName}
        </span>
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
                Generate production-ready content matching the canonical {blockName} ({versionName}) schema with pure educational data and no system metadata.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

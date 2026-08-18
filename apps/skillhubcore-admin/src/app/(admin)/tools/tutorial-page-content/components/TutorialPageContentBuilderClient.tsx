'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Save, Send } from 'lucide-react';

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

interface FormState {
  brandId: TutorialSidebarBrandId;
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  contentType: TutorialPageContentType;
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

const initialHierarchy: HierarchyState = { domains: [], subjects: [], topics: [], subtopics: [] };
const initialForm: FormState = {
  brandId: SHARED_BRAND_ID,
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  contentType: 'definition',
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
  const [preview, setPreview] = useState<TutorialDefinitionPayload | TutorialCodePayload | TutorialSummaryPayload>(definitionExample);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then(setHierarchy)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hierarchy.'));
  }, []);

  useEffect(() => {
    const example = exampleForContentType(form.contentType);
    setSourceContent(JSON.stringify(example, null, 2));
    setPreview(example);
  }, [form.contentType]);

  const subjects = useMemo(() => hierarchy.subjects.filter((item) => item.domainId === form.domainId), [hierarchy.subjects, form.domainId]);
  const topics = useMemo(() => hierarchy.topics.filter((item) => item.subjectId === form.subjectId), [hierarchy.topics, form.subjectId]);
  const subtopics = useMemo(() => hierarchy.subtopics.filter((item) => item.topicId === form.topicId), [hierarchy.subtopics, form.topicId]);
  const selectedSubtopic = subtopics.find((item) => item.id === form.subtopicId);

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
      return next;
    });
  }

  function handlePreview() {
    try {
      setPreview(parseSource(sourceFormat, sourceContent, form.contentType));
      setMessage('Preview updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Preview failed.');
    }
  }

  async function save(status: 'draft' | 'published') {
    setIsSaving(true);
    setMessage('');
    try {
      const payload = parseSource(sourceFormat, sourceContent, form.contentType);
      setPreview(payload);
      const response = await fetch('/api/tutorial-page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          brandId: SHARED_BRAND_ID,
          payload,
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

  return (
    <main className="min-h-screen bg-[#f4f7fa] p-6">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-[#dfe7f1] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e11d48]">Tutorial Page Builder</p>
          <h1 className="mt-2 text-2xl font-black text-[#071f63]">Definition & Code Content</h1>

          <div className="mt-5 grid gap-3">
            <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.domainId} onChange={(event) => updateForm('domainId', event.target.value)}>
              <option value="">Select domain</option>
              {hierarchy.domains.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.subjectId} onChange={(event) => updateForm('subjectId', event.target.value)}>
              <option value="">Select subject</option>
              {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.topicId} onChange={(event) => updateForm('topicId', event.target.value)}>
              <option value="">Select topic</option>
              {topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.subtopicId} onChange={(event) => updateForm('subtopicId', event.target.value)}>
              <option value="">Select subtopic</option>
              {subtopics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.contentType} onChange={(event) => updateForm('contentType', event.target.value as TutorialPageContentType)}>
                <option value="definition">Definition</option>
                <option value="code">Code</option>
                <option value="summary">Summary</option>
              </select>
              <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={sourceFormat} onChange={(event) => setSourceFormat(event.target.value as SourceFormat)}>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>

          <textarea
            className="mt-4 h-[460px] w-full rounded-lg border border-[#dfe7f1] bg-[#071024] p-4 font-mono text-xs leading-5 text-white"
            value={sourceContent}
            onChange={(event) => setSourceContent(event.target.value)}
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#dfe7f1] px-4 py-2 font-bold text-[#071f63]" onClick={handlePreview}>
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button type="button" disabled={isSaving || !form.subtopicId} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe7f1] px-4 py-2 font-bold text-[#071f63] disabled:opacity-50" onClick={() => save('draft')}>
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button type="button" disabled={isSaving || !form.subtopicId} className="inline-flex items-center gap-2 rounded-lg bg-[#e11d48] px-4 py-2 font-bold text-white disabled:opacity-50" onClick={() => save('published')}>
              <Send className="h-4 w-4" /> Publish
            </button>
          </div>
          {message && <p className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm font-semibold text-[#071f63]">{message}</p>}
        </section>

        <section className="min-w-0">
          <div className="mb-4 rounded-xl border border-[#dfe7f1] bg-white p-4 text-sm font-bold text-[#071f63]">
            Preview target: {selectedSubtopic?.name ?? 'Select a subtopic'}
          </div>
          {form.contentType === 'definition' && <TutorialDefinitionContent payload={preview as TutorialDefinitionPayload} theme={themeForBrand(form.brandId)} />}
          {form.contentType === 'code' && <TutorialCodeContent payload={preview as TutorialCodePayload} theme={themeForBrand(form.brandId)} />}
          {form.contentType === 'summary' && <TutorialSummaryContent payload={preview as TutorialSummaryPayload} theme={themeForBrand(form.brandId)} />}
        </section>
      </div>
    </main>
  );
}

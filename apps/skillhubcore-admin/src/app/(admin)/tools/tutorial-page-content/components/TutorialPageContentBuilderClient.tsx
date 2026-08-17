'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Save, Send } from 'lucide-react';

import { TutorialCodeContent } from '@/share-branding/LearningExperience/components/TutorialCodeContent';
import { TutorialDefinitionContent } from '@/share-branding/LearningExperience/components/TutorialDefinitionContent';
import type {
  BrandTutorialTheme,
  TutorialCodePayload,
  TutorialDefinitionPayload,
  TutorialPageContentType,
  TutorialSidebarBrandId,
} from '@quiz/types';

type SourceFormat = 'json' | 'markdown';

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
    definition: 'A variable is a symbolic name that refers to an object stored in memory.',
    explanation: [
      'When you create a variable, Python allocates memory for a value or object and binds it to the variable name.',
      'Variables make your code easier to read, maintain, and reuse.',
    ],
    example: {
      language: 'python',
      code: 'x = 10\nx = 20\nprint(x)',
    },
    characteristics: [
      { icon: 'R', title: 'Named Reference', description: 'A variable is a name that refers to a value or object.' },
      { icon: 'D', title: 'Stores Data', description: 'It stores data in memory that can be of any type.' },
    ],
    takeaway: 'A variable is a name that points to an object in memory.',
  },
};

const codeExample: TutorialCodePayload = {
  page: {
    type: 'CODE + EXPLANATION',
    title: 'Example: Sum of Two Numbers in Python',
    introduction: 'This example demonstrates how Python accepts two numbers, converts input into integers, adds them, and displays the result.',
  },
  code: {
    language: 'Python',
    prismLanguage: 'python',
    source: 'x = int(input("Enter first number: "))\ny = int(input("Enter second number: "))\n\nresult = x + y\n\nprint("Sum:", result)',
  },
  explanation: {
    steps: [
      { number: 1, code: 'input("Enter first number: ")', description: 'The <code>input()</code> function asks the user to enter the first number.' },
      { number: 2, code: 'int(input(...))', description: 'The <code>int()</code> function converts text into an integer.' },
      { number: 3, code: 'result = x + y', description: 'Python adds the two values and assigns the result to <code>result</code>.' },
    ],
  },
  output: {
    value: 'Enter first number: 10\nEnter second number: 20\nSum: 30',
  },
  memoryModel: {
    type: 'reference-flow',
    description: 'Python variables reference objects in memory.',
    columns: [
      { id: 'variables', title: 'Variables (References)', width: 'minmax(160px, 1fr)' },
      { id: 'objects', title: 'Objects in Memory', width: 'minmax(260px, 1.5fr)' },
      { id: 'values', title: 'Values', width: 'minmax(160px, 1fr)' },
    ],
    nodes: [
      { id: 'variable-x', label: 'x', column: 'variables', row: 1, variant: 'reference', monospace: true },
      { id: 'object-x', label: 'id: 140723458765120', column: 'objects', row: 1, variant: 'object', monospace: true },
      { id: 'value-x', label: '10 (int)', column: 'values', row: 1, variant: 'value', monospace: true },
      { id: 'variable-result', label: 'result', column: 'variables', row: 2, variant: 'result', monospace: true },
      { id: 'object-result', label: 'id: 140723458765376', column: 'objects', row: 2, variant: 'result', monospace: true },
      { id: 'value-result', label: '30 (int)', column: 'values', row: 2, variant: 'result', monospace: true },
    ],
    note: 'Object identities are illustrative.',
  },
  takeaway: {
    items: ['The <code>input()</code> function receives user data.', 'The <code>+</code> operator performs addition.'],
  },
};

const initialHierarchy: HierarchyState = { domains: [], subjects: [], topics: [], subtopics: [] };
const initialForm: FormState = {
  brandId: 'realtutorialhub',
  domainId: '',
  subjectId: '',
  topicId: '',
  subtopicId: '',
  contentType: 'definition',
};

function themeForBrand(brandId: TutorialSidebarBrandId): BrandTutorialTheme {
  if (brandId === 'skillup') {
    return {
      primary: '#e11d48',
      primaryDark: '#be123c',
      secondary: '#f97316',
      activeBackground: '#fff1f2',
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
  const [preview, setPreview] = useState<TutorialDefinitionPayload | TutorialCodePayload>(definitionExample);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then(setHierarchy)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hierarchy.'));
  }, []);

  useEffect(() => {
    const example = form.contentType === 'definition' ? definitionExample : codeExample;
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
      setMessage(`${result.message} URL: ${result.deliveryUrls?.realtutorialhub ?? ''}`);
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
            <select className="rounded-lg border border-[#dfe7f1] px-3 py-2" value={form.brandId} onChange={(event) => updateForm('brandId', event.target.value as TutorialSidebarBrandId)}>
              <option value="realtutorialhub">RealTutorialHub</option>
              <option value="skillup">SkillUp IT Academy</option>
              <option value="shared">Shared</option>
            </select>
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
          {form.contentType === 'definition'
            ? <TutorialDefinitionContent payload={preview as TutorialDefinitionPayload} theme={themeForBrand(form.brandId)} />
            : <TutorialCodeContent payload={preview as TutorialCodePayload} theme={themeForBrand(form.brandId)} />}
        </section>
      </div>
    </main>
  );
}

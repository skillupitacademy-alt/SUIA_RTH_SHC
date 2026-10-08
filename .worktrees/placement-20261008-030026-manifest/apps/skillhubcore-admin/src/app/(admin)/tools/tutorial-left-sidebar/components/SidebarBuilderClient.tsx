'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, FileDown, Save, Send } from 'lucide-react';

import { TutorialLeftSidebar } from '@/share-branding/LearningExperience/components/TutorialLeftSidebar';
import { universalNavigationTemplate } from './sample-navigation-tree';
import { AiGenerationPrerequisites } from './AiGenerationPrerequisites';
import { parseMarkdownNavigation } from '@/app/api/tutorial-left-sidebar/markdown-navigation-parser';
import { normalizeNavigationIds } from '../utils/navigation-id';
import type {
  TutorialNavigationNode,
  TutorialNavigationTree,
  TutorialSidebarBrandId,
} from './types';

type SourceFormat = 'json' | 'markdown';
const SHARED_BRAND_ID: TutorialSidebarBrandId = 'shared';

interface FormState {
  brandId: TutorialSidebarBrandId;
  domainId: string;
  subjectId: string;
  topicId: string;
  activeSubtopicId: string;
}

const initialForm: FormState = {
  brandId: SHARED_BRAND_ID,
  domainId: '',
  subjectId: '',
  topicId: '',
  activeSubtopicId: '',
};

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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripPresentationData(node: TutorialNavigationNode): TutorialNavigationNode {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status: _status, url: _url, slug: _slug, ...clean } = node;
  return {
    ...clean,
    children: node.children?.map(stripPresentationData)
  };
}

function normalizeNavigationForStorage(tree: TutorialNavigationTree): { topics: TutorialNavigationNode[] } {
  // Strip out presentation-only data (brand, theme, progress, status, url)
  // Keep only the universal navigation structure
  return {
    topics: tree.topics.map(stripPresentationData)
  };
}

function getBrandTreeDefaults(brandId: TutorialSidebarBrandId, subjectName: string): Pick<TutorialNavigationTree, 'brand' | 'theme' | 'subject' | 'progress'> {
  if (brandId === 'skillup') {
    return {
      brand: {
        name: 'SkillUp IT Academy',
        shortName: 'SUIA',
        tagline: 'Build Skills That Move Careers',
      },
      theme: {
        primary: '#e11d48',
        primaryDark: '#be123c',
        secondary: '#f97316',
        activeBackground: '#fff1f2',
        completed: '#08a64a',
      },
      subject: {
        name: subjectName,
        icon: 'code',
      },
      progress: {
        percentage: 0,
      },
    };
  }

  return {
    brand: {
      name: 'RealTutorialHub',
      shortName: 'RTH',
      tagline: 'Learn Smarter, Not Harder',
    },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
    subject: {
      name: subjectName,
      icon: 'code',
    },
    progress: {
      percentage: 0,
    },
  };
}

/**
 * Parse Markdown navigation using shared parser
 * 
 * This is preview-only parsing for client-side validation.
 * The server performs the authoritative parsing and normalization.
 */
function parseMarkdownTreeShared(source: string): TutorialNavigationNode[] {
  // Use shared parser that handles key/value syntax
  const authoringNodes = parseMarkdownNavigation(source);
  
  // Normalize IDs using shared normalization
  // No type assertion needed - types are now compatible
  return normalizeNavigationIds(authoringNodes);
}

function validateNavigationDepthClient(nodes: TutorialNavigationNode[], currentDepth: number, path: string): void {
  if (currentDepth > 3) {
    throw new Error(`Navigation depth exceeds maximum of 3 levels at: ${path}. Move deeper content into tutorial page content.`);
  }
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      validateNavigationDepthClient(node.children, currentDepth + 1, `${path} → ${node.name}`);
    }
  });
}

function parseSource(format: SourceFormat, source: string, subjectName: string): TutorialNavigationTree {
  const defaults = getBrandTreeDefaults(SHARED_BRAND_ID, subjectName);

  if (format === 'json') {
    const parsed = JSON.parse(source) as Partial<TutorialNavigationTree> | TutorialNavigationNode[];
    let topics: TutorialNavigationNode[] = [];
    
    if (Array.isArray(parsed)) {
      topics = parsed;
    } else {
      topics = parsed.topics ?? [];
    }

    // Validate max depth of 3 levels
    validateNavigationDepthClient(topics, 1, 'Root');

    if (Array.isArray(parsed)) {
      return {
        ...defaults,
        topics,
      };
    }

    return {
      ...defaults,
      ...parsed,
      subject: {
        ...defaults.subject,
        ...(parsed.subject ?? {}),
      },
      topics,
    };
  }

  return {
    ...defaults,
    topics: parseMarkdownTreeShared(source),
  };
}

function getActiveUrl(tree: TutorialNavigationTree, activeSubtopicSlug: string) {
  const targetSlug = slugify(activeSubtopicSlug);
  let match = '';

  function walk(nodes: TutorialNavigationNode[]) {
    nodes.forEach((node) => {
      if (node.slug === targetSlug && node.url) {
        match = node.url;
      }
      walk(node.children ?? []);
    });
  }

  walk(tree.topics);
  return match;
}

export function SidebarBuilderClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [format, setFormat] = useState<SourceFormat>('json');
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hierarchy, setHierarchy] = useState<HierarchyState>({ domains: [], subjects: [], topics: [], subtopics: [] });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/tutorial-left-sidebar/hierarchy')
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;
        const nextHierarchy: HierarchyState = {
          domains: data.domains ?? [],
          subjects: data.subjects ?? [],
          topics: data.topics ?? [],
          subtopics: data.subtopics ?? [],
        };
        setHierarchy(nextHierarchy);
        setForm((previous) => {
          const domainId = previous.domainId || nextHierarchy.domains[0]?.id || '';
          const subjectId = previous.subjectId || nextHierarchy.subjects.find((subject) => subject.domainId === domainId)?.id || '';
          const topicId = previous.topicId || nextHierarchy.topics.find((topic) => topic.subjectId === subjectId)?.id || '';
          const activeSubtopicId = previous.activeSubtopicId || nextHierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
          return { ...previous, domainId, subjectId, topicId, activeSubtopicId };
        });
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load hierarchy.'));

    return () => {
      isMounted = false;
    };
  }, []);

  const availableSubjects = hierarchy.subjects.filter((row) => row.domainId === form.domainId);
  const selectedSubject = hierarchy.subjects.find((row) => row.id === form.subjectId);
  const availableTopics = hierarchy.topics.filter((row) => row.subjectId === form.subjectId);
  const availableSubtopics = hierarchy.subtopics.filter((row) => row.topicId === form.topicId);
  const selectedActiveSubtopic = hierarchy.subtopics.find((row) => row.id === form.activeSubtopicId);

  const parsed = useMemo(() => {
    try {
      const tree = parseSource(format, source, selectedSubject?.name || 'Frontend Development');
      return { tree, error: '' };
    } catch (error) {
      return { tree: null, error: error instanceof Error ? error.message : 'Invalid sidebar content.' };
    }
  }, [format, selectedSubject?.name, source]);

  const activeUrl = parsed.tree ? getActiveUrl(parsed.tree, selectedActiveSubtopic?.slug || '') : '';

  const setField = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const loadTemplate = () => {
    const template = {
      topics: universalNavigationTemplate
    };
    setSource(JSON.stringify(template, null, 2));
    setFormat('json');
    setMessage('Universal navigation template loaded. Customize as needed.');
  };

  const loadExisting = async () => {
    setMessage('Loading sidebar tree...');
    const params = new URLSearchParams({
      brandId: SHARED_BRAND_ID,
      topicId: form.topicId,
    });
    const response = await fetch(`/api/tutorial-left-sidebar?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || 'Sidebar tree not found.');
      return;
    }

    setFormat(result.sourceFormat || 'json');
    setSource(result.sourceContent || JSON.stringify(result.tree, null, 2));
    if (result.scope?.activeSubtopicId) {
      setField('activeSubtopicId', result.scope.activeSubtopicId);
    }
    setMessage('Existing sidebar loaded.');
  };

  const save = async (status: 'draft' | 'published') => {
    if (!parsed.tree) {
      setMessage(parsed.error);
      return;
    }
    if (!form.domainId || !form.subjectId || !form.topicId) {
      setMessage('Select domain, subject, and topic before saving.');
      return;
    }

    setIsSaving(true);
    setMessage(status === 'published' ? 'Publishing sidebar...' : 'Saving draft...');

    try {
      // Parse based on format to get universal navigation
      let universalNavigation;
      
      if (format === 'json') {
        // JSON: Already have the tree, just normalize for storage
        universalNavigation = normalizeNavigationForStorage(parsed.tree);
      } else {
        // Markdown: Parse to get tree, then normalize
        // Note: Server will re-parse; this is for client validation only
        const markdownTree = parseMarkdownTreeShared(source);
        universalNavigation = { topics: markdownTree };
      }
      
      const response = await fetch('/api/tutorial-left-sidebar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: SHARED_BRAND_ID,
          domainId: form.domainId,
          subjectId: form.subjectId,
          topicId: form.topicId,
          activeSubtopicId: form.activeSubtopicId || undefined,
          tree: universalNavigation,
          sourceFormat: format,  // Preserve actual format
          sourceContent: source, // Preserve original source
          status,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || 'Save failed.');
        return;
      }

      const deliveryPath = result.deliveryUrls?.realtutorialhub ?? result.deliveryUrls?.skillup;
      setMessage(deliveryPath ? `${result.message || 'Saved.'} Common path: ${deliveryPath}` : result.message || 'Saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-6 xl:grid-cols-[minmax(0,1fr)_404px] items-start">
      {/* Left Builder Workspace */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header & Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">Universal Tutorial Layer</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 font-outfit tracking-tight">Left Sidebar Builder</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 px-3.5 py-2 text-xs font-bold text-pink-700 shadow-sm transition-all hover:bg-pink-100 active:scale-95"
            >
              <FileDown className="h-4 w-4" />
              Load Template
            </button>
            <button
              type="button"
              onClick={loadExisting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <FileDown className="h-4 w-4" />
              Load Existing
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => save('draft')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => save('published')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#e11d48] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#be123c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Publish & Save
            </button>
          </div>
        </div>

        {/* Hierarchy Selectors */}
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="select-domain" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Domain
            </label>
            <select
              id="select-domain"
              value={form.domainId}
              onChange={(event) => {
                const domainId = event.target.value;
                const subjectId = hierarchy.subjects.find((subject) => subject.domainId === domainId)?.id || '';
                const topicId = hierarchy.topics.find((topic) => topic.subjectId === subjectId)?.id || '';
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, domainId, subjectId, topicId, activeSubtopicId }));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            >
              <option value="">Select domain</option>
              {hierarchy.domains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="select-subject" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Subject
            </label>
            <select
              id="select-subject"
              disabled={!form.domainId}
              value={form.subjectId}
              onChange={(event) => {
                const subjectId = event.target.value;
                const topicId = hierarchy.topics.find((topic) => topic.subjectId === subjectId)?.id || '';
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, subjectId, topicId, activeSubtopicId }));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="select-topic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Topic
            </label>
            <select
              id="select-topic"
              disabled={!form.subjectId}
              value={form.topicId}
              onChange={(event) => {
                const topicId = event.target.value;
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, topicId, activeSubtopicId }));
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select topic</option>
              {availableTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="select-active-subtopic" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Subtopic Preview
            </label>
            <select
              id="select-active-subtopic"
              disabled={!form.topicId}
              value={form.activeSubtopicId}
              onChange={(event) => setField('activeSubtopicId', event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">None (Root Overview)</option>
              {availableSubtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Generation Prerequisites */}
        <AiGenerationPrerequisites
          domainName={hierarchy.domains.find((d) => d.id === form.domainId)?.name}
          subjectName={hierarchy.subjects.find((s) => s.id === form.subjectId)?.name}
          topicName={hierarchy.topics.find((t) => t.id === form.topicId)?.name}
          subtopicName={hierarchy.subtopics.find((s) => s.id === form.activeSubtopicId)?.name}
        />

        {/* Navigation Authoring Editor */}
        <div className="mt-5 space-y-2">
          {/* Format Selector and Label */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Navigation {format === 'json' ? 'JSON' : 'Markdown'} Structure
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                Universal Tree
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-pink-600">Pure Content Contract</span>
              <div className="flex rounded-lg border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    format === 'json'
                      ? 'bg-pink-600 text-white rounded-l-lg'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('markdown')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    format === 'markdown'
                      ? 'bg-pink-600 text-white rounded-r-lg'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
          </div>
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder={format === 'json' 
              ? 'Click "Load Template" to start with the universal navigation structure'
              : 'Enter navigation in Markdown format:\n- id: javascript\n  name: JavaScript\n  type: group\n  description: Programming language.\n\n  - id: functions\n    name: Functions\n    type: page'
            }
            spellCheck={false}
            aria-label={`Navigation ${format === 'json' ? 'JSON' : 'Markdown'} Structure`}
            className="min-h-[460px] w-full resize-y rounded-xl border border-slate-800 bg-[#071024] p-4 font-mono text-xs leading-6 text-slate-100 outline-none transition-all focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Guidelines Card */}
        <div className="mt-4 rounded-xl border border-pink-200 bg-pink-50/40 p-4 text-xs leading-relaxed text-slate-700">
          <p className="font-bold text-pink-950">📋 Universal Navigation Guidelines:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1 text-[11px] text-slate-600">
            <li><strong>Structure:</strong> Use &ldquo;id&rdquo;, &ldquo;name&rdquo;, &ldquo;type&rdquo; (group/page), &ldquo;description&rdquo;, &ldquo;icon&rdquo;, &ldquo;expanded&rdquo;, and &ldquo;children&rdquo;</li>
            <li><strong>Both formats supported:</strong> JSON (structured data) or Markdown (key/value syntax)</li>
            <li><strong>Do NOT include:</strong> brand, theme, progress, status, or manual URLs</li>
            <li><strong>Max depth:</strong> 3 visual levels (Topic → Group → Page)</li>
            <li><strong>Runtime behavior:</strong> The engine automatically generates URLs, active states, and brand themes dynamically</li>
          </ul>
        </div>

        {/* Status / Error Alert */}
        <div className={`mt-4 rounded-xl border p-3.5 text-xs font-bold ${parsed.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            <span>{parsed.error || message || 'Live preview ready.'}</span>
          </div>
        </div>
      </section>

      {/* Right Column: Live Navigation Tree Preview (Preserved for Navigation JSON container) */}
      <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-180px)]">
        {parsed.tree ? (
          <TutorialLeftSidebar tree={parsed.tree} activeUrl={activeUrl} />
        ) : (
          <div className="flex h-64 max-w-[404px] items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs font-bold text-red-700 shadow-sm">
            Fix the sidebar JSON content before previewing.
          </div>
        )}
      </div>
    </div>
  );
}

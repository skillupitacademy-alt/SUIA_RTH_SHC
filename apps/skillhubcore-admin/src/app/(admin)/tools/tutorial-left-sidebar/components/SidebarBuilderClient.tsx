'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, FileDown, Save, Send } from 'lucide-react';

import { TutorialLeftSidebar } from '@/share-branding/LearningExperience/components/TutorialLeftSidebar';
import { universalNavigationTemplate } from './sample-navigation-tree';
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

function compactSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripPresentationData(node: TutorialNavigationNode): TutorialNavigationNode {
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


function inferIcon(level: number, name: string) {
  if (level === 0 && name.toLowerCase().includes('javascript')) {
    return 'javascript';
  }
  if (level === 1) {
    return 'book';
  }
  if (level >= 3) {
    return 'file';
  }
  return 'folder';
}

function parseMarkdownTree(source: string): TutorialNavigationNode[] {
  const roots: TutorialNavigationNode[] = [];
  const stack: Array<{ level: number; node: TutorialNavigationNode }> = [];

  source.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) {
      return;
    }

    const match = line.match(/^(\s*)-\s*(?:\[([xX~ ])\]\s*)?(.+)$/);
    if (!match) {
      throw new Error(`Invalid markdown tree line ${index + 1}: ${line}`);
    }

    const level = Math.floor(match[1].replace(/\t/g, '  ').length / 2);
    const parts = match[3].split('|').map((part) => part.trim()).filter(Boolean);
    const name = parts[0];
    const id = parts[1] || compactSlug(name);

    const node: TutorialNavigationNode = {
      id,
      name,
      icon: inferIcon(level, name),
      type: level >= 2 ? 'page' : 'group',
      expanded: level <= 1,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.node;
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack.push({ level, node });
  });

  function clean(nodes: TutorialNavigationNode[]): TutorialNavigationNode[] {
    return nodes.map((node) => {
      const children = clean(node.children ?? []);
      const rest = { ...node };
      delete rest.children;
      return children.length > 0 ? { ...rest, children } : rest;
    });
  }

  return clean(roots);
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
    topics: parseMarkdownTree(source),
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
      // Normalize navigation to universal format (strip brand/theme/progress/status/url)
      const universalNavigation = normalizeNavigationForStorage(parsed.tree);
      
      const response = await fetch('/api/tutorial-left-sidebar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: SHARED_BRAND_ID,
          domainId: form.domainId,
          subjectId: form.subjectId,
          topicId: form.topicId,
          activeSubtopicId: form.activeSubtopicId || undefined,
          tree: { ...parsed.tree, topics: universalNavigation.topics },
          sourceFormat: 'json',
          sourceContent: JSON.stringify(universalNavigation, null, 2),
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
    <div className="grid min-h-[calc(100vh-150px)] gap-6 xl:grid-cols-[minmax(0,1fr)_404px]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="alpha-terminal text-slate-500">Universal Tutorial Layer</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Left Sidebar Builder</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadTemplate} className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100">
              <FileDown className="h-4 w-4" />
              Load Template
            </button>
            <button type="button" onClick={loadExisting} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
              <FileDown className="h-4 w-4" />
              Load Existing
            </button>
            <button type="button" disabled={isSaving} onClick={() => save('draft')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button type="button" disabled={isSaving} onClick={() => save('published')} className="inline-flex items-center gap-2 rounded-lg bg-[#d03f00] px-4 py-2 text-sm font-bold text-white hover:bg-[#b63600] disabled:opacity-60">
              <Send className="h-4 w-4" />
              Publish & Save
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Domain
            <select
              value={form.domainId}
              onChange={(event) => {
                const domainId = event.target.value;
                const subjectId = hierarchy.subjects.find((subject) => subject.domainId === domainId)?.id || '';
                const topicId = hierarchy.topics.find((topic) => topic.subjectId === subjectId)?.id || '';
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, domainId, subjectId, topicId, activeSubtopicId }));
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold"
            >
              <option value="">Select domain</option>
              {hierarchy.domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Subject
            <select
              value={form.subjectId}
              onChange={(event) => {
                const subjectId = event.target.value;
                const topicId = hierarchy.topics.find((topic) => topic.subjectId === subjectId)?.id || '';
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, subjectId, topicId, activeSubtopicId }));
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold"
            >
              <option value="">Select subject</option>
              {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Topic
            <select
              value={form.topicId}
              onChange={(event) => {
                const topicId = event.target.value;
                const activeSubtopicId = hierarchy.subtopics.find((subtopic) => subtopic.topicId === topicId)?.id || '';
                setForm((previous) => ({ ...previous, topicId, activeSubtopicId }));
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 font-semibold"
            >
              <option value="">Select topic</option>
              {availableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Active Subtopic Slug
            <select value={form.activeSubtopicId} onChange={(event) => setField('activeSubtopicId', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold">
              <option value="">None</option>
              {availableSubtopics.map((subtopic) => <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>)}
            </select>
          </label>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
          Navigation JSON
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder='Click "Load Template" to start with the universal navigation structure'
            spellCheck={false}
            className="hide-scrollbar min-h-[460px] rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none focus:ring-2 focus:ring-[#124fd6]"
          />
        </label>

        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <p className="font-bold">📋 Navigation JSON Guidelines:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li><strong>Structure:</strong> Use &ldquo;id&rdquo;, &ldquo;name&rdquo;, &ldquo;type&rdquo; (group/page), &ldquo;icon&rdquo;, &ldquo;expanded&rdquo;, and &ldquo;children&rdquo;</li>
            <li><strong>Do NOT include:</strong> brand, theme, progress, status, or manual URLs</li>
            <li><strong>Max depth:</strong> 3 visual levels (Topic → Group → Page)</li>
            <li><strong>System generates:</strong> URLs, slugs, and applies brand/theme at runtime</li>
          </ul>
        </div>

        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm font-bold ${parsed.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {parsed.error || message || 'Preview is ready.'}
          </div>
        </div>
      </section>

      <div className="xl:sticky xl:top-6 xl:h-[calc(100vh-180px)]">
        {parsed.tree ? (
          <TutorialLeftSidebar tree={parsed.tree} activeUrl={activeUrl} />
        ) : (
          <div className="flex h-screen max-w-[404px] items-center justify-center border border-red-200 bg-red-50 p-6 text-center text-sm font-bold text-red-700">
            Fix the sidebar content before previewing.
          </div>
        )}
      </div>
    </div>
  );
}

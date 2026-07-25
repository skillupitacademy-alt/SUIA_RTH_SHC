import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ListChecks,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';

// Notes Components
import { NotesSummaryCard } from '@/share-branding/TutorialEngine/components/notes/NotesSummaryCard';
import { NotesSyntaxBlock } from '@/share-branding/TutorialEngine/components/notes/NotesSyntaxBlock';
import { NotesPracticeCard } from '@/share-branding/TutorialEngine/components/notes/NotesPracticeCard';
import { NotesWarningFaq } from '@/share-branding/TutorialEngine/components/notes/NotesWarningFaq';
import { NotesDefinitionBlock } from '@/share-branding/TutorialEngine/components/notes/NotesDefinitionBlock';
import { NotesCheatSheet } from '@/share-branding/TutorialEngine/components/notes/NotesCheatSheet';
import { NotesExamplePanel } from '@/share-branding/TutorialEngine/components/notes/NotesExamplePanel';
import { NotesConceptMemoryMap } from '@/share-branding/TutorialEngine/components/notes/NotesConceptMemoryMap';
import { NotesHeroInfographic } from '@/share-branding/TutorialEngine/components/notes/NotesHeroInfographic';

// Main Content Components for Full Section Preview
import { NotesMainContent } from '@/share-branding/TutorialEngine/components/notes/NotesMainContent';
import { LaymanMainContent } from '@/share-branding/TutorialEngine/components/layman/LaymanMainContent';
import { CodeExampleContent } from '@/share-branding/TutorialEngine/components/notes/CodeExampleContent';
import { TechnicalDeepDiveContent } from '@/share-branding/TutorialEngine/components/notes/TechnicalDeepDiveContent';
import { PracticeTestContent } from '@/share-branding/TutorialEngine/components/notes/PracticeTestContent';
import { VisualExplanationContent } from '@/share-branding/TutorialEngine/components/notes/VisualExplanationContent';

import { SectionType } from './types';
import { ContractAwareComponentPreview } from './ContractAwareComponentPreview';

interface ComponentPreviewProps {
  section: SectionType;
  subsection: string;
  data: unknown;
  rendererContract?: Record<string, unknown> | null;
}

const asRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const asString = (value: unknown, fallback = '') => (
  typeof value === 'string' && value.trim() ? value : fallback
);

const asNumber = (value: unknown, fallback = 0) => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);


function OverviewHeroPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-emerald-50 shadow-xl">
      <div className="grid gap-8 p-8 lg:grid-cols-[1fr_320px] lg:items-center">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              {asString(data.iconLabel, 'OV')}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {asString(data.difficulty, 'Beginner')}
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-950">
            {asString(data.title, 'What is Python?')}
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
            {asString(data.description, 'Clear overview of the selected subtopic.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              {asNumber(data.topicsCount, 10)} learning blocks
            </span>
            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              Updated {asString(data.lastUpdated, 'Today')}
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-lg">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Sparkles size={28} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Learner First View</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{asString(data.title, 'Concept Overview')}</p>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className="h-full w-2/5 rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewProgressPreview({ data }: { data: Record<string, unknown> }) {
  const percentage = Math.max(0, Math.min(100, asNumber(data.percentage, 0)));
  const checklist = asArray<Record<string, unknown>>(data.checklist);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Learning Progress</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Your section readiness</h2>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
          {percentage}%
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500" style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {checklist.map((item, index) => {
          const completed = Boolean(item.completed);
          return (
            <div key={index} className={`flex items-center gap-3 rounded-2xl border p-4 ${completed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <CheckCircle2 size={20} className={completed ? 'text-emerald-600' : 'text-slate-300'} />
              <span className="text-sm font-bold text-slate-800">{asString(item.label, `Step ${index + 1}`)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OverviewOutcomesPreview({ data }: { data: unknown }) {
  const outcomes = asArray<string>(data);
  return (
    <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 shadow-xl">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Learning Outcomes</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">After this section, learner can</h2>
      <div className="mt-6 grid gap-3">
        {outcomes.map((outcome, index) => (
          <div key={index} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Target size={19} className="mt-0.5 text-emerald-600" />
            <span className="text-sm font-bold leading-6 text-slate-800">{outcome}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewRoadmapPreview({ data }: { data: Record<string, unknown> }) {
  const cards = [
    ...asArray<Record<string, unknown>>(data.contentCards),
    ...asArray<Record<string, unknown>>(data.taskCards),
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
      <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Learning Roadmap</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Recommended content path</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.slice(0, 8).map((card, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">{index + 1}</div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{asString(card.title, `Roadmap item ${index + 1}`)}</h3>
                <p className="text-xs font-bold uppercase text-slate-400">{asString(card.type, 'content')}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600">{asString(card.content, asString(card.description, 'Preview content summary.'))}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewFlowPreview({ data }: { data: unknown }) {
  const items = asArray<string>(data);
  return (
    <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-7 shadow-xl">
      <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Recommended Flow</p>
      <div className="mt-5 flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{index + 1}</div>
            <span className="font-bold text-slate-800">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewReadinessPreview({ data }: { data: Record<string, unknown> }) {
  const prerequisites = asArray<string>(data.prerequisites);
  const criteria = asArray<string>(data.successCriteria);
  return (
    <section className="grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-amber-700">Prerequisites</p>
        <ul className="mt-4 space-y-3">
          {prerequisites.map((item, index) => <li key={index} className="font-bold text-slate-800">{item}</li>)}
        </ul>
      </div>
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Success Criteria</p>
        <ul className="mt-4 space-y-3">
          {criteria.map((item, index) => <li key={index} className="font-bold text-slate-800">{item}</li>)}
        </ul>
      </div>
    </section>
  );
}

function OverviewNavigationPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="flex flex-wrap justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left font-black text-slate-800">
        <ArrowLeft size={18} /> {asString(data.prevTitle, 'Previous subtopic')}
      </button>
      <button className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-5 py-4 text-left font-black text-white">
        {asString(data.nextTitle, 'Next subtopic')} <ArrowRight size={18} />
      </button>
    </section>
  );
}

function OverviewFullPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-8">
      <OverviewHeroPreview data={asRecord(data.hero)} />
      <OverviewProgressPreview data={asRecord(data.progressSummary)} />
      <OverviewOutcomesPreview data={data.learningOutcomes} />
      <OverviewRoadmapPreview data={asRecord(data.learningRoadmap)} />
      <OverviewFlowPreview data={data.recommendedFlow} />
      <OverviewReadinessPreview data={asRecord(data.readinessContext)} />
      <OverviewNavigationPreview data={asRecord(data.navigation)} />
    </div>
  );
}

function OverviewSubsectionPreview({ subsection, data }: { subsection: string; data: unknown }) {
  switch (subsection) {
    case 'hero':
      return <OverviewHeroPreview data={asRecord(data)} />;
    case 'progressSummary':
      return <OverviewProgressPreview data={asRecord(data)} />;
    case 'learningOutcomes':
      return <OverviewOutcomesPreview data={data} />;
    case 'learningRoadmap':
      return <OverviewRoadmapPreview data={asRecord(data)} />;
    case 'recommendedFlow':
      return <OverviewFlowPreview data={data} />;
    case 'readinessContext':
      return <OverviewReadinessPreview data={asRecord(data)} />;
    case 'navigation':
      return <OverviewNavigationPreview data={asRecord(data)} />;
    default:
      return <GenericComponentPreview section="overview" subsection={subsection} data={data} />;
  }
}

function GenericComponentPreview({ section, subsection, data }: { section: string; subsection: string; data: unknown }) {
  const record = asRecord(data);
  const title = asString(record.title, asString(record.headline, asString(record.summaryTitle, subsection || section)));
  const description = asString(record.description, asString(record.content, asString(record.definitionText, asString(record.simpleDefinition, 'Visual preview generated from the selected JSON fields.'))));
  const arrays = Object.entries(record).filter(([, value]) => Array.isArray(value)).slice(0, 3);
  const objects = Object.entries(record).filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value)).slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <Compass size={28} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{section}{subsection ? `.${subsection}` : ''}</p>
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        </div>
      </div>
      <p className="text-base font-medium leading-7 text-slate-600">{description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {arrays.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><ListChecks size={15} /> {key}</p>
            <div className="space-y-2">
              {asArray<unknown>(value).slice(0, 5).map((item, index) => (
                <div key={index} className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
                  {typeof item === 'string' ? item : asString(asRecord(item).title, asString(asRecord(item).label, asString(asRecord(item).question, `Item ${index + 1}`)))}
                </div>
              ))}
            </div>
          </div>
        ))}
        {objects.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><BookOpen size={15} /> {key}</p>
            <div className="space-y-2">
              {Object.entries(asRecord(value)).slice(0, 5).map(([childKey, childValue]) => (
                <div key={childKey} className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs font-black uppercase text-slate-400">{childKey}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {typeof childValue === 'string' || typeof childValue === 'number' ? String(childValue) : Array.isArray(childValue) ? `${childValue.length} items` : 'Configured'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComponentPreview({ section, subsection, data, rendererContract }: ComponentPreviewProps) {
  if (!data) return <div className="p-4 text-center text-slate-500">No data available for preview. Please parse valid JSON first.</div>;

  // Safely extract the target data payload to prevent React component crash
  let targetData: unknown = data;
  if (data && section && typeof data === 'object' && section in data) {
    targetData = (data as Record<string, unknown>)[section];
  }
  
  if (subsection && targetData && typeof targetData === 'object' && subsection in targetData) {
    targetData = (targetData as Record<string, unknown>)[subsection];
  }

  if (rendererContract) {
    return (
      <ContractAwareComponentPreview
        section={section}
        subsection={subsection}
        data={targetData}
        contract={rendererContract}
      />
    );
  }

  // 1. Handle Full Section Previews (when subsection is empty)
  if (!subsection) {
    switch (section) {
      case 'overview':
        return <OverviewFullPreview data={asRecord(targetData)} />;
      case 'notes':
        return <NotesMainContent data={targetData as React.ComponentProps<typeof NotesMainContent>['data']} isStandalone={false} />;
      case 'layman':
        return <LaymanMainContent data={targetData as React.ComponentProps<typeof LaymanMainContent>['data']} />;
      case 'code':
        return <CodeExampleContent data={targetData as React.ComponentProps<typeof CodeExampleContent>['data']} />;
      case 'technical':
        return <TechnicalDeepDiveContent data={targetData as React.ComponentProps<typeof TechnicalDeepDiveContent>['data']} />;
      case 'practice':
        return <PracticeTestContent data={targetData as React.ComponentProps<typeof PracticeTestContent>['data']} />;
      case 'visual':
        return <VisualExplanationContent data={targetData as React.ComponentProps<typeof VisualExplanationContent>['data']} />;
      // Fall through to default for unmapped sections
    }
  }

  // 2. Handle Specific Subsection Previews
  if (section === 'overview') {
    return <OverviewSubsectionPreview subsection={subsection} data={targetData} />;
  }

  if (section === 'notes') {
    switch (subsection) {
      case 'summaryCard':
        return <NotesSummaryCard {...(targetData as React.ComponentProps<typeof NotesSummaryCard>)} />;
      case 'practiceCard':
        return <NotesPracticeCard {...(targetData as React.ComponentProps<typeof NotesPracticeCard>)} />;
      case 'warningFaq':
        return <NotesWarningFaq {...(targetData as React.ComponentProps<typeof NotesWarningFaq>)} />;
      case 'definitionBlock':
        return <NotesDefinitionBlock {...(targetData as React.ComponentProps<typeof NotesDefinitionBlock>)} />;
      case 'cheatSheetSVG':
      case 'diagrammaticBreakdown':
        return <NotesCheatSheet {...(targetData as React.ComponentProps<typeof NotesCheatSheet>)} />;
      case 'syntaxBlock':
      case 'lineByLineExplanation':
        return <NotesSyntaxBlock {...(targetData as React.ComponentProps<typeof NotesSyntaxBlock>)} />;
      case 'examplePanel':
        return <NotesExamplePanel {...(targetData as React.ComponentProps<typeof NotesExamplePanel>)} />;
      case 'conceptMemoryMap':
      case 'mentalModelVisualization':
        return <NotesConceptMemoryMap {...(targetData as React.ComponentProps<typeof NotesConceptMemoryMap>)} />;
      case 'summaryHeroInfographic':
      case 'summaryHeroSvg':
        return <NotesHeroInfographic {...(targetData as React.ComponentProps<typeof NotesHeroInfographic>)} />;
    }
  }

  // 3. Default visual fallback for components that do not have a dedicated renderer yet.
  return <GenericComponentPreview section={section} subsection={subsection} data={targetData} />;
}

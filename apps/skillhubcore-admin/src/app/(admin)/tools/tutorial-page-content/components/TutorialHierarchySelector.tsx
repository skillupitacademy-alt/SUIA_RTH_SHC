/**
 * Tutorial Hierarchy Selector Component
 * 
 * Manages the 4-level cascading hierarchy selection:
 * Domain → Subject → Topic → Subtopic
 */

interface HierarchyRow {
  id: string;
  name: string;
}

interface TutorialHierarchySelectorProps {
  // All available options
  domains: HierarchyRow[];
  subjects: HierarchyRow[];
  topics: HierarchyRow[];
  subtopics: HierarchyRow[];
  
  // Current selections
  domainId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  
  // Change handlers
  onDomainChange: (domainId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onTopicChange: (topicId: string) => void;
  onSubtopicChange: (subtopicId: string) => void;
}

export function TutorialHierarchySelector({
  domains,
  subjects,
  topics,
  subtopics,
  domainId,
  subjectId,
  topicId,
  subtopicId,
  onDomainChange,
  onSubjectChange,
  onTopicChange,
  onSubtopicChange,
}: TutorialHierarchySelectorProps) {
  return (
    <>
      {/* 1. Domain */}
      <div className="flex-1 min-w-[170px]">
        <label htmlFor="select-domain" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Domain
        </label>
        <select
          id="select-domain"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          value={domainId}
          onChange={(event) => onDomainChange(event.target.value)}
        >
          <option value="">Select Domain</option>
          {domains.map((item) => (
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
          disabled={!domainId}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          value={subjectId}
          onChange={(event) => onSubjectChange(event.target.value)}
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
          disabled={!subjectId}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          value={topicId}
          onChange={(event) => onTopicChange(event.target.value)}
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
          disabled={!topicId}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          value={subtopicId}
          onChange={(event) => onSubtopicChange(event.target.value)}
        >
          <option value="">Select Subtopic</option>
          {subtopics.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
    </>
  );
}

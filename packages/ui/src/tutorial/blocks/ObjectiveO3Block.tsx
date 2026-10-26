import React from 'react';
import { Target, Code2, Wrench, Bug, Layers, Sparkles, Check, Terminal, Cpu } from 'lucide-react';
import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export type ObjectiveO3SkillVerb = 'Identify' | 'Explain' | 'Compare' | 'Create' | 'Implement' | 'Use' | 'Modify' | 'Debug' | 'Analyze' | 'Optimize' | 'Design' | 'Test' | 'Evaluate' | 'Integrate' | 'Deploy' | 'Access' | string;

export interface ObjectiveO3SkillItem {
  id: string;
  label?: ObjectiveO3SkillVerb;
  verb?: ObjectiveO3SkillVerb;
  text?: string;
  description?: string;
  expectedResult?: string;
  [key: string]: unknown;
}

export interface ObjectiveO3BlockContent {
  eyebrow?: string;
  title?: string;
  introduction?: string;
  skills?: ObjectiveO3SkillItem[];
  objectives?: ObjectiveO3SkillItem[];
  [key: string]: unknown;
}

export interface ObjectiveO3BlockData {
  id: string;
  type: string;
  version: string;
  content?: ObjectiveO3BlockContent;
  [key: string]: unknown;
}

interface NormalizedSkill {
  id: string;
  number: string;
  label: string;
  description: string;
  expectedResult?: string;
}

const KNOWN_VERBS = ['Identify', 'Explain', 'Compare', 'Create', 'Implement', 'Use', 'Modify', 'Debug', 'Analyze', 'Optimize', 'Design', 'Test', 'Evaluate', 'Integrate', 'Deploy', 'Access', 'Construct', 'Validate', 'Transform', 'Select', 'Filter'];

function extractVerbLabel(item: ObjectiveO3SkillItem, index: number): string {
  if (typeof item.label === 'string' && item.label.trim()) return item.label.trim();
  if (typeof item.verb === 'string' && item.verb.trim()) return item.verb.trim();
  const rawText = (item.description || item.text || '').trim();
  if (rawText) {
    const firstWord = rawText.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
    const matched = KNOWN_VERBS.find((verb) => verb.toLowerCase() === firstWord.toLowerCase());
    if (matched) return matched;
    if (firstWord.length >= 3 && firstWord.length <= 14) return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
  return 'Skill ' + String(index + 1);
}

function normalizeO3Skills(content?: ObjectiveO3BlockContent): NormalizedSkill[] {
  const rawSkills = Array.isArray(content?.skills) && content.skills.length > 0
    ? content.skills
    : Array.isArray(content?.objectives) ? content.objectives : [];
  const normalized: NormalizedSkill[] = [];
  rawSkills.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const description = typeof item.description === 'string' && item.description.trim()
      ? item.description.trim()
      : typeof item.text === 'string' && item.text.trim() ? item.text.trim() : '';
    if (!description) return;
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : 'skill-' + String(idx + 1);
    const expectedResult = typeof item.expectedResult === 'string' && item.expectedResult.trim() ? item.expectedResult.trim() : undefined;
    normalized.push({ id, number: idx + 1 < 10 ? '0' + String(idx + 1) : String(idx + 1), label: extractVerbLabel(item, idx), description, expectedResult });
  });
  return normalized;
}

function SkillIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();
  if (lower.includes('debug') || lower.includes('test')) return <Bug aria-hidden="true" className="h-4 w-4" />;
  if (lower.includes('create') || lower.includes('implement') || lower.includes('code')) return <Code2 aria-hidden="true" className="h-4 w-4" />;
  if (lower.includes('modify') || lower.includes('use') || lower.includes('access')) return <Wrench aria-hidden="true" className="h-4 w-4" />;
  if (lower.includes('design') || lower.includes('integrate')) return <Layers aria-hidden="true" className="h-4 w-4" />;
  if (lower.includes('optimize') || lower.includes('analyze')) return <Cpu aria-hidden="true" className="h-4 w-4" />;
  if (lower.includes('deploy')) return <Terminal aria-hidden="true" className="h-4 w-4" />;
  return <Sparkles aria-hidden="true" className="h-4 w-4" />;
}

function ObjectiveO3View({ block, theme, className = '', runtimeContext }: {
  block: ObjectiveO3BlockData;
  theme: DomainTheme;
  className?: string;
  runtimeContext?: TutorialBlockRuntimeContext;
}) {
  const primary = theme.primary;
  const secondary = theme.secondary;
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'objective';
  const blockVersion = runtimeContext?.blockVersion ?? block.version ?? 'O3';
  const content = block.content;
  const eyebrow = content?.eyebrow || 'SKILL-BASED OBJECTIVES';
  const title = content?.title || 'What You Will Be Able To Do';
  const introduction = content?.introduction || 'By the end of this lesson, you will be able to demonstrate the following practical skills.';
  const skills = normalizeO3Skills(content);
  const outerClass = ['w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors', className].filter(Boolean).join(' ');

  return (
    <article data-block-id={blockId} data-block-type={blockType} data-block-version={blockVersion} className={outerClass} style={{ color: secondary }}>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3" style={{ color: primary, backgroundColor: withAlpha(primary, '14') }}>
          <Target aria-hidden="true" className="h-4 w-4" /><span>{eyebrow}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: secondary }}>{title}</h2>
        <div className="mb-4 mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: primary }} aria-hidden="true" />
        <p className="text-base sm:text-lg font-medium leading-[1.7] max-w-3xl mb-6" style={{ color: withAlpha(secondary, 'dd') }}>{introduction}</p>
      </header>
      {skills.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5" role="list">
          {skills.map((skill) => (
            <li key={skill.id} data-skill-id={skill.id} className="skill-item rounded-xl border p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between" style={{ backgroundColor: withAlpha(primary, '08'), borderColor: withAlpha(primary, '25') }}>
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs sm:text-sm font-bold" style={{ backgroundColor: withAlpha(primary, '18'), color: primary }} aria-hidden="true">{skill.number}</span>
                    <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide" style={{ color: primary }}>{skill.label}</h3>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: withAlpha(primary, '18'), color: primary }} aria-hidden="true"><SkillIcon label={skill.label} /></span>
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: secondary }}>{skill.description}</p>
              </div>
              {skill.expectedResult && <div className="mt-4 pt-3 border-t flex items-start gap-2 text-xs sm:text-sm" style={{ borderColor: withAlpha(primary, '18'), color: secondary }}>
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md mt-0.5" style={{ backgroundColor: withAlpha(primary, '18'), color: primary }} aria-hidden="true"><Check aria-hidden="true" className="h-3.5 w-3.5" /></span>
                <div><strong className="font-semibold mr-1.5" style={{ color: secondary }}>Expected:</strong><span style={{ color: withAlpha(secondary, 'dd') }}>{skill.expectedResult}</span></div>
              </div>}
            </li>
          ))}
        </ul>
      ) : <ul className="space-y-2.5" role="list"><li className="rounded-xl border p-4 sm:p-5 text-sm sm:text-base font-medium leading-relaxed" style={{ backgroundColor: withAlpha(primary, '08'), borderColor: withAlpha(primary, '25'), color: secondary }}>No skill objectives configured for this lesson.</li></ul>}
    </article>
  );
}

export function ObjectiveO3Block({ block, className = '', theme, runtimeContext }: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;
  const typedBlock = block as unknown as ObjectiveO3BlockData;
  if (typedBlock.version && typedBlock.version !== 'O3') throw new Error('[ObjectiveBlock] Unsupported block version: ' + String(typedBlock.version));
  return <ObjectiveO3View block={typedBlock} className={className} runtimeContext={runtimeContext} theme={activeTheme} />;
}

export const ObjectiveBlock = ObjectiveO3Block;
export { ObjectiveO3Block as default };

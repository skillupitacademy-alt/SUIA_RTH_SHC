'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { AssignmentHero } from './AssignmentHero';
import { TaskRequirements } from './TaskRequirements';
import { SubmissionChecklist } from './SubmissionChecklist';
import { LearningObjectives } from './LearningObjectives';
import { EvaluationCriteria } from './EvaluationCriteria';
import { ResourcesPanel } from './ResourcesPanel';
import { DeadlineBanner } from './DeadlineBanner';
import { MentorshipNote } from './MentorshipNote';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface AssignmentModularRendererProps {
  data: NonNullable<TutorialContentJSON['assignment']>;
  themeColor: string;
}

export function AssignmentModularRenderer({ data }: AssignmentModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

  // Map schema keys
  const hero = pickSection(m, ['assignment_brief_card', 'assignmentHero', 'assignmentOverview']);
  const tasks = pickSection(m, ['task_flow_block', 'taskRequirements']);
  const objectives = pickSection(m, ['objective_panel', 'learningObjectives']);
  const checklist = pickSection(m, ['submission_requirements_panel', 'submissionChecklist']);
  const criteria = pickSection(m, ['rubric_matrix', 'evaluationCriteria']);
  const resources = pickSection(m, ['real_world_project_panel', 'resourcesPanel']);
  const deadline = pickSection(m, ['assignment_summary_card', 'deadlineBanner']);
  const mentorship = pickSection(m, ['mistake_prevention_panel', 'mentorshipNote']);

  return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {hero && <AssignmentHero data={hero} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {tasks && <TaskRequirements data={tasks} />}
          {objectives && <LearningObjectives data={objectives} />}
        </div>
        <div className="flex flex-col gap-6">
          {checklist && <SubmissionChecklist data={checklist} />}
          {criteria && <EvaluationCriteria data={criteria} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources && <ResourcesPanel data={resources} />}
        <div className="flex flex-col gap-6">
          {deadline && <DeadlineBanner data={deadline} />}
          {mentorship && <MentorshipNote data={mentorship} />}
        </div>
      </div>
    </div>
  );
}

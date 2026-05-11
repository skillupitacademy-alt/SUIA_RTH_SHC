'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { AssignmentHero } from './AssignmentHero';
import { TaskRequirements } from './TaskRequirements';
import { SubmissionChecklist } from './SubmissionChecklist';
import { LearningObjectives } from './LearningObjectives';
import { EvaluationCriteria } from './EvaluationCriteria';
import { ResourcesPanel } from './ResourcesPanel';
import { DeadlineBanner } from './DeadlineBanner';
import { MentorshipNote } from './MentorshipNote';

interface AssignmentModularRendererProps {
  data: any;
  themeColor: string;
}

export function AssignmentModularRenderer({ data, themeColor }: AssignmentModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {data.assignmentHero && <AssignmentHero data={data.assignmentHero} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {data.taskRequirements && <TaskRequirements data={data.taskRequirements} themeColor={themeColor} />}
          {data.learningObjectives && <LearningObjectives data={data.learningObjectives} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {data.submissionChecklist && <SubmissionChecklist data={data.submissionChecklist} themeColor={themeColor} />}
          {data.evaluationCriteria && <EvaluationCriteria data={data.evaluationCriteria} themeColor={themeColor} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.resourcesPanel && <ResourcesPanel data={data.resourcesPanel} themeColor={themeColor} />}
        <div className="flex flex-col gap-6">
          {data.deadlineBanner && <DeadlineBanner data={data.deadlineBanner} themeColor={themeColor} />}
          {data.mentorshipNote && <MentorshipNote data={data.mentorshipNote} themeColor={themeColor} />}
        </div>
      </div>
    </div>
  );
}

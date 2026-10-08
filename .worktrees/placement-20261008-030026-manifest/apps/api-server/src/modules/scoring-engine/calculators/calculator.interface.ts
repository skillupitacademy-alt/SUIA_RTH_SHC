export interface ScoringDimension {
  type: string;
  id: string;
  name: string;
  weight: number;
}

export interface SkillDimension {
  id: string;
  name: string;
  weight?: number | null;
  category?: string | null;
  mappingType?: string | null;
}

export interface QuestionSkill {
  skill: SkillDimension;
}

export interface TopicSkill {
  skill: SkillDimension;
}

export interface Subtopic {
  id: string;
  name: string;
}

export interface TopicDimension {
  id: string;
  name: string;
  subject: { id: string; name: string; domain: { id: string; name: string } };
  topicSkills?: TopicSkill[];
  subtopics: Subtopic[];
}

export interface QuestionDimension {
  topicId?: string | null;
  subtopicId?: string | null;
  difficulty?: string | null;
  questionSkills?: QuestionSkill[];
}

export interface ExamQuestionDimension {
  id?: string;
}

export interface IDimensionCalculator {
  calculate(context: {
    question: QuestionDimension;
    topic: TopicDimension | null;
    examQuestion: ExamQuestionDimension | null;
  }): ScoringDimension[];
}

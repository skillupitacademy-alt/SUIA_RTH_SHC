export type CardThemeMode = 'premium-white' | 'soft-sage' | 'warm-sage' | 'high-clarity';

export interface ExamCardTheme {
  mode: CardThemeMode;
  label: string;
  shortLabel: string;
  description: string;
  accessibilityBadge?: string;
  shellSurface: string;
  shellBorder: string;
  questionSurface: string;
  questionText: string;
  answerSurface: string;
  answerInstruction: string;
  answerOptionSurface: string;
  answerOptionBorder: string;
  answerOptionHoverSurface: string;
  answerOptionHoverBorder: string;
  answerOptionText: string;
  answerIndicatorBorder: string;
  answerIndicatorHoverBorder: string;
  trackerSurface: string;
  trackerHeaderSurface: string;
  trackerHeaderBorder: string;
  trackerHeaderText: string;
  trackerTitleText: string;
  trackerCellSurface: string;
  trackerCellBorder: string;
  trackerCellText: string;
  overviewSurface: string;
  overviewHeaderSurface: string;
  overviewHeaderBorder: string;
  overviewHeaderText: string;
  overviewStatSurface: string;
  overviewStatBorder: string;
  overviewStatLabel: string;
  overviewStatValue: string;
  overviewMetaText: string;
  codeSurface: string;
  codeBorder: string;
  codeText: string;
}

export const EXAM_CARD_THEMES: Record<CardThemeMode, ExamCardTheme> = {
  'premium-white': {
    mode: 'premium-white',
    label: 'Premium White',
    shortLabel: 'White',
    description: 'True white, high-trust presentation for the cleanest assessment surface.',
    shellSurface: '#FFFFFF',
    shellBorder: '#D9E2EC',
    questionSurface: '#FFFFFF',
    questionText: '#0F172A',
    answerSurface: '#FFFFFF',
    answerInstruction: '#64748B',
    answerOptionSurface: '#FFFFFF',
    answerOptionBorder: '#E2E8F0',
    answerOptionHoverSurface: '#F8FAFC',
    answerOptionHoverBorder: '#CBD5E1',
    answerOptionText: '#334155',
    answerIndicatorBorder: '#CBD5E1',
    answerIndicatorHoverBorder: '#94A3B8',
    trackerSurface: '#FFFFFF',
    trackerHeaderSurface: '#F8FAFC',
    trackerHeaderBorder: '#E2E8F0',
    trackerHeaderText: '#64748B',
    trackerTitleText: '#334155',
    trackerCellSurface: '#FFFFFF',
    trackerCellBorder: '#CBD5E1',
    trackerCellText: '#475569',
    overviewSurface: '#FFFFFF',
    overviewHeaderSurface: '#F8FAFC',
    overviewHeaderBorder: '#E2E8F0',
    overviewHeaderText: '#64748B',
    overviewStatSurface: '#F8FAFC',
    overviewStatBorder: '#E2E8F0',
    overviewStatLabel: '#64748B',
    overviewStatValue: '#0F172A',
    overviewMetaText: '#64748B',
    codeSurface: '#F8FAFC',
    codeBorder: '#E2E8F0',
    codeText: '#0F172A',
  },
  'soft-sage': {
    mode: 'soft-sage',
    label: 'Soft Sage',
    shortLabel: 'Soft Sage',
    description: 'Calmer sage surfaces with a modern product feel and softer visual fatigue.',
    shellSurface: '#F4F7F5',
    shellBorder: '#D7E3DE',
    questionSurface: '#EEF3F1',
    questionText: '#203530',
    answerSurface: '#F4F7F5',
    answerInstruction: '#5B6E67',
    answerOptionSurface: '#FCFEFD',
    answerOptionBorder: '#C7D6CF',
    answerOptionHoverSurface: '#ECF3EF',
    answerOptionHoverBorder: '#9CB2A9',
    answerOptionText: '#24352F',
    answerIndicatorBorder: '#B9CBC4',
    answerIndicatorHoverBorder: '#8FA79E',
    trackerSurface: '#EAF0F7',
    trackerHeaderSurface: '#DCE6F2',
    trackerHeaderBorder: '#C8D5E6',
    trackerHeaderText: '#475569',
    trackerTitleText: '#334155',
    trackerCellSurface: '#F8FAFC',
    trackerCellBorder: '#94A3B8',
    trackerCellText: '#334155',
    overviewSurface: '#F4F7F5',
    overviewHeaderSurface: '#E6EFEB',
    overviewHeaderBorder: '#CFDDD7',
    overviewHeaderText: '#52665E',
    overviewStatSurface: '#FCFEFD',
    overviewStatBorder: '#D7E3DE',
    overviewStatLabel: '#5B6E67',
    overviewStatValue: '#203530',
    overviewMetaText: '#5B6E67',
    codeSurface: '#F7FAF8',
    codeBorder: '#D6E0DB',
    codeText: '#274039',
  },
  'warm-sage': {
    mode: 'warm-sage',
    label: 'Warm Sage',
    shortLabel: 'Warm Sage',
    description: 'Warmer editorial surfaces that align best with the premium tracker styling.',
    shellSurface: '#F3EFE7',
    shellBorder: '#DDD0BE',
    questionSurface: '#F1F0E8',
    questionText: '#2F3A33',
    answerSurface: '#F1F0E8',
    answerInstruction: '#5F6B62',
    answerOptionSurface: '#FAF8F3',
    answerOptionBorder: '#C9C3B4',
    answerOptionHoverSurface: '#EEEADF',
    answerOptionHoverBorder: '#AAA28E',
    answerOptionText: '#2F3A33',
    answerIndicatorBorder: '#BFB7A7',
    answerIndicatorHoverBorder: '#9F9788',
    trackerSurface: '#F3EFE7',
    trackerHeaderSurface: '#E8E0D4',
    trackerHeaderBorder: '#D6C8B5',
    trackerHeaderText: '#6B5B4D',
    trackerTitleText: '#3F3328',
    trackerCellSurface: '#FCFAF6',
    trackerCellBorder: '#BFAE98',
    trackerCellText: '#4B3F35',
    overviewSurface: '#F3EFE7',
    overviewHeaderSurface: '#E8E0D4',
    overviewHeaderBorder: '#D6C8B5',
    overviewHeaderText: '#6B5B4D',
    overviewStatSurface: '#FCFAF6',
    overviewStatBorder: '#DDD0BE',
    overviewStatLabel: '#6B5B4D',
    overviewStatValue: '#3F3328',
    overviewMetaText: '#6B5B4D',
    codeSurface: '#F7F4EE',
    codeBorder: '#D8D0C2',
    codeText: '#314038',
  },
  'high-clarity': {
    mode: 'high-clarity',
    label: 'High Clarity',
    shortLabel: 'Accessible',
    description: 'Built for color-blind and low-vision resilience with stronger contrast and cleaner separation.',
    accessibilityBadge: 'A11Y',
    shellSurface: '#F8FAFC',
    shellBorder: '#94A3B8',
    questionSurface: '#FFFFFF',
    questionText: '#111827',
    answerSurface: '#FFFFFF',
    answerInstruction: '#334155',
    answerOptionSurface: '#FFFFFF',
    answerOptionBorder: '#64748B',
    answerOptionHoverSurface: '#F8FAFC',
    answerOptionHoverBorder: '#334155',
    answerOptionText: '#111827',
    answerIndicatorBorder: '#334155',
    answerIndicatorHoverBorder: '#0F172A',
    trackerSurface: '#FFFFFF',
    trackerHeaderSurface: '#F1F5F9',
    trackerHeaderBorder: '#94A3B8',
    trackerHeaderText: '#334155',
    trackerTitleText: '#0F172A',
    trackerCellSurface: '#FFFFFF',
    trackerCellBorder: '#64748B',
    trackerCellText: '#111827',
    overviewSurface: '#FFFFFF',
    overviewHeaderSurface: '#F1F5F9',
    overviewHeaderBorder: '#94A3B8',
    overviewHeaderText: '#334155',
    overviewStatSurface: '#FFFFFF',
    overviewStatBorder: '#94A3B8',
    overviewStatLabel: '#334155',
    overviewStatValue: '#111827',
    overviewMetaText: '#334155',
    codeSurface: '#F8FAFC',
    codeBorder: '#94A3B8',
    codeText: '#111827',
  },
};

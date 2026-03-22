/**
 * Exam Theme System
 * 
 * Defines 3 distinct visual themes for the Active Exam HUD:
 * - Executive: Clean, professional, high-contrast white cards
 * - Premium: Launch console aesthetic with solid backgrounds
 * - Pixel: Strict spacing rules matching console standards
 */

export type ExamTheme = 'executive' | 'premium' | 'pixel';

export interface ThemeConfig {
  name: string;
  description: string;
  colors: {
    pageBackground: string;
    questionCard: string;
    questionCardBorder: string;
    answerUnselected: string;
    answerUnselectedBorder: string;
    answerUnselectedText: string;
    answerSelected: string;
    answerSelectedBorder: string;
    answerSelectedText: string;
    primaryButton: string;
    primaryButtonText: string;
    secondaryButton: string;
    secondaryButtonText: string;
    tacticalChipCurrent: string;
    tacticalChipAnswered: string;
    tacticalChipFlagged: string;
    tacticalChipUnvisited: string;
    accent: string;
  };
  spacing: {
    questionCardPadding: string;
    answerOptionPadding: string;
    answerMinHeight: string;
    tacticalChipSize: string;
    headerHeight: string;
  };
  typography: {
    questionTextSize: string;
    answerTextSize: string;
    questionFont: string;
    bodyFont: string;
  };
  effects: {
    answerRadius: string;
    questionCardRadius: string;
    buttonRadius: string;
    chipRadius: string;
    selectedShadow: string;
    primaryButtonShadow: string;
  };
}

export const EXAM_THEMES: Record<ExamTheme, ThemeConfig> = {
  executive: {
    name: 'Executive Minimal',
    description: 'Clean, professional, high-contrast white cards with minimal color usage',
    colors: {
      pageBackground: 'bg-muted/5',
      questionCard: 'bg-white',
      questionCardBorder: 'border-gray-200',
      answerUnselected: 'bg-white',
      answerUnselectedBorder: 'border-gray-300',
      answerUnselectedText: 'text-gray-900',
      answerSelected: 'bg-pink-50',
      answerSelectedBorder: 'border-pink-500',
      answerSelectedText: 'text-gray-900',
      primaryButton: 'bg-pink-500',
      primaryButtonText: 'text-white',
      secondaryButton: 'bg-white border-gray-300',
      secondaryButtonText: 'text-gray-700',
      tacticalChipCurrent: 'bg-pink-500 border-pink-500 text-white',
      tacticalChipAnswered: 'bg-green-50 border-green-500 text-green-700',
      tacticalChipFlagged: 'bg-orange-50 border-orange-500 text-orange-700',
      tacticalChipUnvisited: 'bg-white border-gray-300 text-gray-500',
      accent: '#FF2D55',
    },
    spacing: {
      questionCardPadding: 'p-8',
      answerOptionPadding: 'p-4',
      answerMinHeight: 'min-h-[60px]',
      tacticalChipSize: 'h-10 w-10',
      headerHeight: 'h-16',
    },
    typography: {
      questionTextSize: 'text-2xl lg:text-3xl',
      answerTextSize: 'text-sm',
      questionFont: 'font-outfit',
      bodyFont: 'font-inter',
    },
    effects: {
      answerRadius: 'rounded-lg',
      questionCardRadius: 'rounded-[1.25rem]',
      buttonRadius: 'rounded-xl',
      chipRadius: 'rounded-lg',
      selectedShadow: 'shadow-md',
      primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    },
  },

  premium: {
    name: 'Premium Dark',
    description: 'Launch console aesthetic with solid backgrounds and clear hierarchy',
    colors: {
      pageBackground: 'bg-background',
      questionCard: 'bg-background',
      questionCardBorder: 'border-gray-200',
      answerUnselected: 'bg-white',
      answerUnselectedBorder: 'border-gray-300',
      answerUnselectedText: 'text-[#1A1A1A]',
      answerSelected: 'bg-[#FF2D55]/5',
      answerSelectedBorder: 'border-[#FF2D55]',
      answerSelectedText: 'text-[#1A1A1A]',
      primaryButton: 'bg-[#FF2D55]',
      primaryButtonText: 'text-white',
      secondaryButton: 'bg-transparent border-gray-300',
      secondaryButtonText: 'text-gray-700',
      tacticalChipCurrent: 'bg-[#FF2D55]/10 border-[#FF2D55] text-[#FF2D55]',
      tacticalChipAnswered: 'bg-green-500/10 border-green-500 text-green-600',
      tacticalChipFlagged: 'bg-orange-500/10 border-orange-500 text-orange-600',
      tacticalChipUnvisited: 'bg-background border-muted text-muted-foreground',
      accent: '#FF2D55',
    },
    spacing: {
      questionCardPadding: 'p-8',
      answerOptionPadding: 'p-5',
      answerMinHeight: 'min-h-[60px]',
      tacticalChipSize: 'h-9 w-9',
      headerHeight: 'h-[72px]',
    },
    typography: {
      questionTextSize: 'text-2xl lg:text-3xl',
      answerTextSize: 'text-sm',
      questionFont: 'font-outfit',
      bodyFont: 'font-inter',
    },
    effects: {
      answerRadius: 'rounded-xl',
      questionCardRadius: 'rounded-[2.5rem]',
      buttonRadius: 'rounded-2xl',
      chipRadius: 'rounded-xl',
      selectedShadow: 'shadow-sm',
      primaryButtonShadow: 'shadow-[0_10px_30px_rgba(255,45,85,0.2)]',
    },
  },

  pixel: {
    name: 'Pixel Perfect Console',
    description: 'Strict adherence to Launch Evaluation console pixel rules',
    colors: {
      pageBackground: 'bg-muted/5',
      questionCard: 'bg-background',
      questionCardBorder: 'border-gray-200',
      answerUnselected: 'bg-white',
      answerUnselectedBorder: 'border-gray-300',
      answerUnselectedText: 'text-gray-900',
      answerSelected: 'bg-[#FF2D55]/5',
      answerSelectedBorder: 'border-[#FF2D55]',
      answerSelectedText: 'text-gray-900',
      primaryButton: 'bg-[#FF2D55]',
      primaryButtonText: 'text-white',
      secondaryButton: 'bg-transparent border-gray-300',
      secondaryButtonText: 'text-gray-700',
      tacticalChipCurrent: 'bg-[#FF2D55]/10 border-[#FF2D55] text-[#FF2D55]',
      tacticalChipAnswered: 'bg-green-500/10 border-green-500 text-green-600',
      tacticalChipFlagged: 'bg-orange-500/10 border-orange-500 text-orange-600',
      tacticalChipUnvisited: 'bg-background border-muted text-muted-foreground',
      accent: '#FF2D55',
    },
    spacing: {
      questionCardPadding: 'p-8',
      answerOptionPadding: 'p-4',
      answerMinHeight: 'min-h-[60px]',
      tacticalChipSize: 'h-9 w-9',
      headerHeight: 'h-[72px]',
    },
    typography: {
      questionTextSize: 'text-2xl lg:text-3xl',
      answerTextSize: 'text-sm',
      questionFont: 'font-outfit',
      bodyFont: 'font-inter',
    },
    effects: {
      answerRadius: 'rounded-xl',
      questionCardRadius: 'rounded-[2.5rem]',
      buttonRadius: 'rounded-2xl',
      chipRadius: 'rounded-xl',
      selectedShadow: 'shadow-sm',
      primaryButtonShadow: 'shadow-[0_10px_30px_rgba(255,45,85,0.2)]',
    },
  },
};

export function getTheme(theme?: string | null): ThemeConfig {
  const normalizedTheme = (theme || 'executive') as ExamTheme;
  return EXAM_THEMES[normalizedTheme] || EXAM_THEMES.executive;
}

import { ExamApiResponse, mapExamApiToSessionData } from './examSessionMapper';
import { ExamSessionData } from './examSession';
import { headers } from 'next/headers';

const demoExamApiResponse: ExamApiResponse = {
  examId: 'demo',
  breadcrumb: 'Full Stack Development / Front End Development / React',
  student: {
    name: 'Demo Student',
    identifierLabel: 'Student ID',
    identifierValue: 'DEMO-12345',
  },
  progress: {
    answeredCount: 1,
    markedCount: 2,
    remainingCount: 3,
    timeRemainingLabel: '45m',
    sectionLabel: 'Front End Development / React',
    metadataSummary: 'Fundamentals - 4 Questions',
  },
  questions: [
    {
      id: 'q1',
      number: 1,
      text: 'Which of the following best describes the primary purpose of the HTTP protocol in web development?',
      status: 'completed',
      answers: [
        { id: 'a', text: 'To establish secure encrypted connections between web browsers and servers' },
        { id: 'b', text: 'To define the structure and presentation of web page content' },
        { id: 'c', text: 'To transfer hypertext and other resources between clients and servers' },
        { id: 'd', text: 'To manage database transactions and queries in web applications' },
      ],
      multiSelect: false,
    },
    {
      id: 'q2',
      number: 2,
      text: 'What will be the output of the following JavaScript code?',
      code: `function mystery(arr) {
  return arr.reduce((acc, val) => {
    if (val % 2 === 0) {
      return acc + val;
    }
    return acc;
  }, 0);
}

const numbers = [1, 2, 3, 4, 5, 6];
console.log(mystery(numbers));`,
      status: 'unanswered',
      answers: [
        { id: 'a', text: '12 - The sum of all even numbers in the array' },
        { id: 'b', text: '21 - The sum of all numbers in the array' },
        { id: 'c', text: '9 - The sum of all odd numbers in the array' },
        { id: 'd', text: '6 - The last even number in the array' },
      ],
      multiSelect: false,
    },
    {
      id: 'q3',
      number: 3,
      text: 'Select all valid React hooks that can be used to manage side effects in functional components:',
      status: 'marked',
      answers: [
        {
          id: 'a',
          code: `// useEffect Hook - Standard Side Effects
useEffect(() => {
  const fetchData = async () => {
    const response = await unifiedFetch('/api/data');
    const result = await response.json();
    setData(result);
  };
  fetchData();
  return () => controller.abort();
}, [dependency]);`,
        },
        {
          id: 'b',
          code: `// useLayoutEffect Hook - Synchronous Effects
useLayoutEffect(() => {
  const rect = elementRef.current.getBoundingClientRect();
  setDimensions({ width: rect.width, height: rect.height });
}, [elementRef]);`,
        },
        {
          id: 'c',
          code: `// useState Hook - NOT for side effects!
useState(() => {
  console.log('Initial state');
  return initialValue;
});`,
        },
        {
          id: 'd',
          code: `// useCallback Hook - Memoization
useCallback(() => {
  handleSubmit(formData);
}, [formData]);`,
        },
      ],
      multiSelect: true,
    },
    {
      id: 'q4',
      number: 4,
      text: 'Which implementation correctly demonstrates the Observer pattern in TypeScript?',
      code: `interface Observer {
  update(data: any): void;
}

class Subject {
  private observers: Observer[] = [];

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  notify(data: any): void {
    this.observers.forEach((observer) => observer.update(data));
  }
}`,
      status: 'marked',
      answers: [
        {
          id: 'a',
          code: `// CORRECT Implementation
class ConcreteObserver implements Observer {
  constructor(private name: string) {}

  update(data: any): void {
    console.log(\`\${this.name} received:\`, data);
  }
}`,
        },
        {
          id: 'b',
          code: `// INCORRECT - Breaks encapsulation
class ConcreteObserver {
  constructor(private subject: Subject) {
    this.subject.observers.push(this);
  }
  handleUpdate(data: any) {}
}`,
        },
        {
          id: 'c',
          code: `// INCORRECT - Arrow function context issue
const observer = {
  name: 'Observer',
  update: (data) => {
    console.log(this.name, data);
  }
};`,
        },
        {
          id: 'd',
          code: `// INCORRECT - Infinite Loop
class ConcreteObserver extends Subject {
  update(data: any): void {
    this.notify(data);
  }
}`,
        },
      ],
      multiSelect: false,
    },
  ],
};

type QuizStateOption =
  | string
  | {
      id?: string;
      text?: string | null;
      code?: string | null;
      label?: string | null;
    };

interface QuizStateQuestion {
  id?: string;
  questionId?: string;
  text?: string;
  questionText?: string;
  options?: QuizStateOption[];
  codeSnippet?: string | null;
  type?: string;
  questionType?: string;
  userAnswer?: string | null;
  order?: number;
}

interface QuizStateResponse {
  examId?: string;
  id?: string;
  status?: string;
  remainingTimeSeconds?: number;
  startedAt?: string;
  progress?: {
    totalQuestions?: number;
    answeredCount?: number;
  };
  questions?: QuizStateQuestion[];
}

function unwrapQuizStatePayload(value: unknown): QuizStateResponse | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if ('data' in value) {
    const data = (value as { data?: unknown }).data;
    return typeof data === 'object' && data !== null ? data as QuizStateResponse : null;
  }

  return value as QuizStateResponse;
}

function formatTimeRemaining(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || Number.isFinite(seconds) === false || seconds <= 0) {
    return '0m';
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}

function getOptionId(option: QuizStateOption, index: number): string {
  if (typeof option === 'string') {
    return String.fromCharCode(97 + index);
  }

  return option.id ?? option.label ?? String.fromCharCode(97 + index);
}

function getOptionText(option: QuizStateOption): string | undefined {
  return typeof option === 'string' ? option : option.text ?? option.label ?? undefined;
}

function mapQuizStateToSessionData(state: QuizStateResponse): ExamSessionData {
  const questions = state.questions ?? [];
  const answeredCount = state.progress?.answeredCount ?? questions.filter((question) => question.userAnswer !== null && question.userAnswer !== undefined).length;
  const totalQuestions = state.progress?.totalQuestions ?? questions.length;

  return {
    examId: state.examId ?? state.id,
    breadcrumb: 'Exam Session',
    student: {
      name: 'Learner',
      identifierLabel: 'Exam ID',
      identifierValue: state.examId ?? state.id ?? 'active',
    },
    progress: {
      answeredCount,
      markedCount: 0,
      remainingCount: Math.max(0, totalQuestions - answeredCount),
      timeRemainingLabel: formatTimeRemaining(state.remainingTimeSeconds),
      sectionLabel: state.status ?? 'started',
      metadataSummary: `${totalQuestions} Questions`,
    },
    questions: questions.map((question, index) => ({
      id: question.questionId ?? question.id ?? `q${index + 1}`,
      status: question.userAnswer !== null && question.userAnswer !== undefined ? 'completed' : 'unanswered',
      question: {
        number: question.order ?? index + 1,
        text: question.questionText ?? question.text ?? '',
        code: question.codeSnippet ?? undefined,
      },
      answers: (question.options ?? []).map((option, optionIndex) => ({
        id: getOptionId(option, optionIndex),
        text: getOptionText(option),
        code: typeof option === 'string' ? undefined : option.code ?? undefined,
      })),
      multiSelect: question.type === 'multiple' || question.questionType === 'multiple',
    })),
  };
}

async function loadRealExamSessionData(examId: string): Promise<ExamSessionData> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http';

  if (host === null || host.trim() === '') {
    throw new Error('Unable to resolve exam host');
  }

  const response = await fetch(`${proto}://${host}/api/quiz/state?examId=${encodeURIComponent(examId)}`, {
    cache: 'no-store',
    headers: {
      cookie: requestHeaders.get('cookie') ?? '',
      accept: 'application/json',
    },
  });

  const payload = await response.json().catch(() => null);
  const state = unwrapQuizStatePayload(payload);
  if (!response.ok || state === null) {
    throw new Error('Unable to load exam session');
  }

  return mapQuizStateToSessionData(state);
}

export async function loadExamSessionData(examId?: string): Promise<ExamSessionData> {
  if (typeof examId === 'string' && examId.trim() !== '') {
    return loadRealExamSessionData(examId.trim());
  }

  return mapExamApiToSessionData(demoExamApiResponse);
}

import { ExamApiResponse, mapExamApiToSessionData } from './examSessionMapper';
import { ExamSessionData } from './examSession';

const demoExamApiResponse: ExamApiResponse = {
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

export async function loadExamSessionData(): Promise<ExamSessionData> {
  // Replace this with the real exam session API call once backend wiring is ready.
  return mapExamApiToSessionData(demoExamApiResponse);
}

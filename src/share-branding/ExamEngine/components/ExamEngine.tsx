'use client';

import { useState } from 'react';
import { BrandConfig } from '../../brandConfig';
import { ActionBar } from './ActionBar';
import { AnswerPane } from './AnswerPane';
import { Header } from './Header';
import { LegendCard } from './LegendCard';
import { ProgressOverviewCard } from './ProgressOverviewCard';
import { QuestionPane } from './QuestionPane';

interface ExamEngineProps {
  brand: BrandConfig;
}

export function ExamEngine({ brand }: ExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTracker, setShowTracker] = useState(true);
  const [showOverview, setShowOverview] = useState(true);

  const questions = [
    {
      question: {
        number: 1,
        text: 'Which of the following best describes the primary purpose of the HTTP protocol in web development?',
      },
      answers: [
        { id: 'a', text: 'To establish secure encrypted connections between web browsers and servers' },
        { id: 'b', text: 'To define the structure and presentation of web page content' },
        { id: 'c', text: 'To transfer hypertext and other resources between clients and servers' },
        { id: 'd', text: 'To manage database transactions and queries in web applications' },
      ],
      multiSelect: false,
    },
    {
      question: {
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
      },
      answers: [
        { id: 'a', text: '12 - The sum of all even numbers in the array' },
        { id: 'b', text: '21 - The sum of all numbers in the array' },
        { id: 'c', text: '9 - The sum of all odd numbers in the array' },
        { id: 'd', text: '6 - The last even number in the array' },
      ],
      multiSelect: false,
    },
    {
      question: {
        number: 3,
        text: 'Select all valid React hooks that can be used to manage side effects in functional components:',
      },
      answers: [
        {
          id: 'a',
          code: `// useEffect Hook - Standard Side Effects
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/data');
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
      question: {
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
    this.observers.forEach(o => o.update(data));
  }
}`,
      },
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
  ];

  const currentScenario = questions[currentIndex];
  const breadcrumb = 'Full Stack Development / Front End Development / React';
  const difficulty = currentScenario.multiSelect ? 'Advanced' : currentScenario.question.code ? 'Mixed Mode' : 'Fundamentals';
  const progressSectionLabel = 'Front End Development / React';
  const progressMetadataSummary = `${difficulty} - ${questions.length} Questions`;
  const answered = currentIndex + 1;
  const marked = Math.min(2, questions.length);
  const remaining = Math.max(questions.length - answered, 0);
  const desktopStats = [
    { label: 'Answered', value: String(answered).padStart(2, '0') },
    { label: 'Marked', value: String(marked).padStart(2, '0') },
    { label: 'Remaining', value: String(remaining).padStart(2, '0') },
    { label: 'Time Left', value: '45m' },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? questions.length - 1 : prev - 1));
  };

  const desktopMainClassName = showTracker
    ? 'xl:h-[calc(100vh-139px)] xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] xl:grid-rows-[minmax(0,0.5fr)_minmax(0,0.5fr)]'
    : 'xl:h-[calc(100vh-139px)] xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] xl:grid-rows-[minmax(0,1fr)]';

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 xl:overflow-hidden">
      <Header
        brand={brand}
        breadcrumb={breadcrumb}
        desktopStats={desktopStats}
        showOverview={showOverview}
      />

      <main className={`grid gap-4 px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-24 xl:gap-4 xl:px-4 xl:py-4 xl:pb-[4vh] ${desktopMainClassName}`}>
        <div
          className={`order-1 min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl xl:col-start-1 xl:row-start-1 xl:h-full xl:min-h-0 ${
            !showTracker ? 'xl:row-span-2' : ''
          }`}
        >
          <QuestionPane
            questionNumber={currentScenario.question.number}
            questionText={currentScenario.question.text}
            code={currentScenario.question.code}
            primaryAccent={brand.primaryColor}
            secondaryAccent={brand.secondaryColor}
          />
        </div>

        <div className="order-2 min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl xl:col-start-2 xl:row-start-1 xl:row-span-full xl:h-full xl:min-h-0">
          <AnswerPane
            options={currentScenario.answers}
            primaryAccent={brand.primaryColorDark}
            primaryTint={`rgba(${brand.primaryRgb}, 0.05)`}
            multiSelect={currentScenario.multiSelect}
          />
        </div>

        {showTracker && (
          <div className="order-3 min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl xl:col-start-1 xl:row-start-2 xl:h-full xl:min-h-0">
            <LegendCard
              primaryAccent={brand.primaryColor}
              currentQuestion={currentIndex + 1}
              totalQuestions={questions.length}
            />
          </div>
        )}

        {showOverview && (
          <div className="order-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl xl:hidden">
            <ProgressOverviewCard
              current={currentIndex + 1}
              total={questions.length}
              primaryAccent={brand.primaryColor}
              sectionLabel={progressSectionLabel}
              metadataSummary={progressMetadataSummary}
            />
          </div>
        )}
      </main>

      <ActionBar
        primaryAccent={brand.primaryColorDark}
        onNext={handleNext}
        onPrevious={handlePrev}
        showTracker={showTracker}
        onToggleTracker={() => setShowTracker(!showTracker)}
        showOverview={showOverview}
        onToggleOverview={() => setShowOverview(!showOverview)}
      />
    </div>
  );
}

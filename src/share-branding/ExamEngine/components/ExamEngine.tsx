'use client';

import { useState } from 'react';
import { BrandConfig } from '../../brandConfig';
import { Header } from './Header';
import { QuestionPane } from './QuestionPane';
import { AnswerPane } from './AnswerPane';
import { ActionBar } from './ActionBar';
import { LegendCard } from './LegendCard';

interface ExamEngineProps {
  brand: BrandConfig;
}

export function ExamEngine({ brand }: ExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTracker, setShowTracker] = useState(true);

  // Real permutations array showing the dual-pane code handling
  const questions = [
    {
      // Text -> Text (Standalone Theory)
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
      // Code -> Text (Diagnostic Evaluation)
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
      // Text -> Code (Refactoring Test)
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
}, [dependency]);` 
        },
        { 
          id: 'b', 
          code: `// useLayoutEffect Hook - Synchronous Effects
useLayoutEffect(() => {
  const rect = elementRef.current.getBoundingClientRect();
  setDimensions({ width: rect.width, height: rect.height });
}, [elementRef]);` 
        },
        { 
          id: 'c', 
          code: `// useState Hook - NOT for side effects!
useState(() => {
  console.log('Initial state');
  return initialValue;
});` 
        },
        { 
          id: 'd', 
          code: `// useCallback Hook - Memoization
useCallback(() => {
  handleSubmit(formData);
}, [formData]);` 
        },
      ],
      multiSelect: true,
    },
    {
      // Code -> Code (Zenith Mode)
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
}` 
        },
        { 
          id: 'b', 
          code: `// INCORRECT - Breaks encapsulation
class ConcreteObserver {
  constructor(private subject: Subject) {
    this.subject.observers.push(this);
  }
  handleUpdate(data: any) {}
}` 
        },
        { 
          id: 'c', 
          code: `// INCORRECT - Arrow function context issue
const observer = {
  name: 'Observer',
  update: (data) => {
    console.log(this.name, data);
  }
};` 
        },
        { 
          id: 'd', 
          code: `// INCORRECT - Infinite Loop
class ConcreteObserver extends Subject {
  update(data: any): void {
    this.notify(data);
  }
}` 
        },
      ],
      multiSelect: false,
    },
  ];

  const currentScenario = questions[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? questions.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <Header brand={brand} />
      
      <main className="flex flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 xl:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-4 xl:w-[45%]">
          <div
            className={`min-h-[320px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden xl:min-h-0 ${
              showTracker ? 'xl:h-[60vh]' : 'xl:h-[calc(100vh-14rem)]'
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

          {showTracker && (
            <div className="min-h-[240px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden xl:h-[40vh] xl:min-h-0">
              <LegendCard 
                primaryAccent={brand.primaryColor} 
                currentQuestion={currentIndex + 1}
                totalQuestions={questions.length}
              />
            </div>
          )}
        </div>

        <div className="w-full min-w-0 xl:w-[55%]">
          <div className="min-h-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden xl:h-[calc(100vh-10rem)]">
            <AnswerPane
              options={currentScenario.answers}
              primaryAccent={brand.primaryColorDark}
              primaryTint={`rgba(${brand.primaryRgb}, 0.05)`}
              multiSelect={currentScenario.multiSelect}
            />
          </div>
        </div>
      </main>

      <ActionBar 
        primaryAccent={brand.primaryColorDark} 
        current={currentIndex + 1}
        total={questions.length}
        onNext={handleNext}
        onPrevious={handlePrev}
        showTracker={showTracker}
        onToggleTracker={() => setShowTracker(!showTracker)}
      />
    </div>
  );
}

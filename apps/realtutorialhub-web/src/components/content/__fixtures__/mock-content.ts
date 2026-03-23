import type { TutorialContentJSON } from '@quiz/types';

export const mockTutorialContent: TutorialContentJSON = {
  notes: {
    markdown:
      'Promises are placeholders for future values. They help JavaScript keep running while async work completes, then notify the app once the result is ready.',
    image: {
      type: 'svg_standard',
      svgKey: 'promise-chain',
      url: null,
      alt: 'Promise lifecycle illustration',
      caption: 'Promise lifecycle',
      position: 'right',
      width: 180,
    },
  },
  layman: {
    simpleExplanation:
      'A promise is like ordering food online. You get confirmation now and the meal later.',
    analogyOrStory:
      'Think of a restaurant receipt that guarantees your order will arrive after the kitchen finishes cooking.',
    example1: {
      company: 'Zomato',
      content: 'Order confirmation arrives before the meal is delivered.',
    },
    example2: {
      company: 'Uber',
      content: 'A driver is assigned first and the ride begins once they accept.',
    },
    image: {
      type: 'svg_standard',
      svgKey: 'async-await-flow',
      url: null,
      alt: 'Async and await flow illustration',
      caption: 'Async flow',
      position: 'right',
      width: 180,
    },
  },
  real_life: {
    title: 'Ordering Food with a Delivery App',
    scenario:
      'A customer places an order, the restaurant confirms it, and the delivery is completed later without blocking the app.',
    bullets: [
      { label: 'Order placed', detail: 'The app confirms the order immediately.' },
      { label: 'Preparation', detail: 'The kitchen works in the background.' },
      { label: 'Delivery', detail: 'The final update arrives when the food reaches the customer.' },
    ],
    tip: 'Use promises whenever completion happens later.',
    image: {
      type: 'svg_standard',
      svgKey: 'async-await-flow',
      url: null,
      alt: 'Real life async flow illustration',
      caption: 'Delivery flow',
      position: 'right',
      width: 180,
    },
  },
  technical: {
    markdown:
      'A promise can be pending, fulfilled, or rejected. Async and await build on top of promises and make the flow easier to read.',
    bullets: [
      { term: 'Pending', detail: 'The async task has started.' },
      { term: 'Fulfilled', detail: 'The task completed successfully.' },
      { term: 'Rejected', detail: 'The task failed and returned an error.' },
    ],
    tip: 'Handle failures with a single catch block when possible.',
    image: {
      type: 'svg_standard',
      svgKey: 'promise-chain',
      url: null,
      alt: 'Technical promise chain illustration',
      caption: 'Promise chain',
      position: 'bottom',
      width: 480,
    },
  },
  code: {
    language: 'javascript',
    intro: 'This example shows how a promise resolves and how async and await consume it.',
    code:
      "function fetchOrderStatus() {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve('Delivered'), 500);\n  });\n}\n\nasync function showStatus() {\n  const status = await fetchOrderStatus();\n  console.log(status);\n}\n\nshowStatus();",
    steps: [
      'Create a promise that resolves after a short delay.',
      'Wait for the promise using await inside an async function.',
      'Print the final value after the promise is fulfilled.',
    ],
    image: null,
  },
  ai_tutor: {
    greeting: 'Let us review how promises work in JavaScript.',
    qa_pairs: [
      {
        question: 'What problem do promises solve?',
        answer: 'Promises let JavaScript handle future results without blocking the rest of the app.',
      },
      {
        question: 'What is the difference between fulfilled and rejected?',
        answer: 'Fulfilled means the task finished successfully, while rejected means it failed.',
      },
      {
        question: 'How does async and await help?',
        answer: 'They make promise-based code read like synchronous code while keeping the same async behavior.',
      },
    ],
  },
};

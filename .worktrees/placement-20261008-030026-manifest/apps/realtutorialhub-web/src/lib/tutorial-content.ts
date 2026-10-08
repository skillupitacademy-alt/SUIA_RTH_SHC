import { TutorialContentRepository } from '@quiz/db-tutorial';
import type { TutorialContentJSON } from '@quiz/types';

export const SEED_SUBTOPIC_ID = '11111111-1111-1111-1111-111111111111';

export const DEFAULT_TUTORIAL_CONTENT: TutorialContentJSON = {
  notes: {
    markdown:
      'Promises represent the eventual result of an asynchronous operation. A promise can be pending, fulfilled, or rejected. In practice, they let us write cleaner async code than deeply nested callbacks. With promises, we can chain work, handle errors in one place, and keep the main flow easier to follow. JavaScript uses promises throughout fetch calls, timers wrapped in async helpers, and library APIs that need to return results later. The key idea is that a promise is a placeholder for a value that will exist in the future, not the value itself.',
    image: null,
  },
  layman: {
    simpleExplanation:
      'A promise is like placing an order and getting a receipt. You do not get the food immediately, but the receipt tells you the restaurant has committed to delivering it. If the kitchen prepares the meal successfully, the promise is fulfilled. If something goes wrong, the promise is rejected. This helps programmers write code that waits for results without freezing the whole app. Instead of checking the same thing again and again, we can ask the promise to notify us when the result is ready. That is why promises are one of the most important ideas in modern JavaScript.',
    analogyOrStory:
      'Think of a customer ordering food from an app. The app confirms the order now, but the meal arrives later. The confirmation is the promise, and the delivery is the resolved result.',
    example1: {
      company: 'Zomato',
      content:
        'When a user places an order, the app immediately returns confirmation while the restaurant prepares the food. The promise is the commitment to deliver the order status later.',
    },
    example2: {
      company: 'Uber',
      content:
        'When a rider books a cab, the app first confirms that a driver is being assigned. The ride details arrive after the driver accepts, which matches the promise flow.',
    },
    image: {
      type: 'svg_standard',
      svgKey: 'promise-chain',
      url: null,
      alt: 'Promise state transitions showing pending moving to fulfilled or rejected',
      caption: 'Promise lifecycle',
      position: 'right',
      width: 180,
    },
  },
  real_life: {
    title: 'Ordering Food with a Delivery App',
    scenario:
      'A customer places an order, the restaurant confirms it, the kitchen starts preparing the meal, and the rider delivers it later. The app does not block while waiting. Instead, it keeps the user informed at each step.',
    bullets: [
      {
        label: 'Order placed',
        detail: 'The request is accepted immediately, even though the meal is not ready yet.',
      },
      {
        label: 'Preparation in progress',
        detail: 'The restaurant works in the background while the app waits for completion.',
      },
      {
        label: 'Delivery completed',
        detail: 'The final status is returned when the food reaches the customer.',
      },
    ],
    tip: 'Use promises whenever work finishes later and you still want a clean, readable flow.',
    image: {
      type: 'svg_standard',
      svgKey: 'async-await-flow',
      url: null,
      alt: 'Async await execution flow showing order confirmation and delivery steps',
      caption: null,
      position: 'right',
      width: 120,
    },
  },
  technical: {
    markdown:
      'A promise is an object that represents the eventual completion or failure of an asynchronous operation. It moves through the pending, fulfilled, or rejected states. Promise chaining allows one operation to feed into the next, and error handling can be centralized using catch. Async and await are syntax built on top of promises, making asynchronous code easier to read while keeping the same underlying behavior.',
    bullets: [
      {
        term: 'Pending',
        detail: 'The asynchronous task has started but has not completed yet.',
      },
      {
        term: 'Fulfilled',
        detail: 'The task completed successfully and returned a value.',
      },
      {
        term: 'Rejected',
        detail: 'The task failed and returned an error reason.',
      },
    ],
    tip: 'Chain transformations with then and put failure handling in one catch block when possible.',
    image: {
      type: 'svg_standard',
      svgKey: 'promise-chain',
      url: null,
      alt: 'Technical diagram of promise chaining with then and catch handlers',
      caption: 'Promise chaining pattern',
      position: 'bottom',
      width: 600,
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

export async function getSeededTutorialContent(): Promise<TutorialContentJSON> {
  const repository = new TutorialContentRepository();
  try {
    const rows = await repository.findBySubtopicId(SEED_SUBTOPIC_ID, 'simple');
    const content = rows.find((row) => row.isPublished) ?? rows[0];
    if (content) {
      return content.content;
    }
  } catch {
    // Fall back to the embedded seed so the app can build without Neon env vars.
  }

  return DEFAULT_TUTORIAL_CONTENT;
}

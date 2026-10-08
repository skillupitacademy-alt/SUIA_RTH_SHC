import type { TutorialDefinitionPayload } from '@quiz/types';

/**
 * D1 Definition Block - Example Authoring Payload
 * 
 * This is a legacy-format example used for initial authoring state.
 * It demonstrates the D1 block structure with a complete definition example.
 */
export const definitionD1Example: TutorialDefinitionPayload = {
  page: {
    type: 'definition',
    category: 'Python Fundamentals',
    title: 'What Is a Variable?',
    intro: 'A variable is a name given to a value or an object in memory so that we can use it later in our program.',
    definition: 'A variable is a symbolic name (identifier) that refers to an object stored in memory. It acts as a container for data that can be used, updated, and referenced throughout your program.',
    explanation: [
      'When you create a variable, Python allocates memory for a value or object and binds it to the variable name. You can perform operations on the data through that name.',
      'Variables make your code easier to read, maintain, and reuse. Instead of using values directly, you use meaningful names.',
    ],
    example: {
      language: 'python',
      code: 'x = 10          # 10 is stored in memory and x refers to it\nx = 20          # Now x refers to the new value 20\nprint(x)        # Output: 20',
    },
    characteristics: [
      { icon: '○', title: 'Named Reference', description: 'A variable is a name that refers to a value or object.' },
      { icon: '◆', title: 'Stores Data', description: 'It stores data in memory that can be of any type.' },
      { icon: '✎', title: 'Mutable', description: 'The value stored in a variable can be changed anytime.' },
      { icon: '↗', title: 'Reusable', description: 'Once created, the variable can be used multiple times.' },
    ],
    takeaway: 'A variable is a name that points to an object in memory. It helps you store, manage, and reuse data efficiently in your program.',
  },
};

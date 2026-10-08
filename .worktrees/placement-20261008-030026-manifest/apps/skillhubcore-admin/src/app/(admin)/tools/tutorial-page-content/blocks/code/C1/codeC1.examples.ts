import type { TutorialCodePayload } from '@quiz/types';

/**
 * C1 Code Block - Example Authoring Payload (Legacy Format)
 * 
 * This is a legacy-format example used for initial authoring state.
 * It demonstrates the complete C1 block structure including memoryModel.
 * 
 * NOTE: This example is in LEGACY format and will be converted to canonical C1
 * by the converter when saved. The memoryModel field shown here will be stripped
 * during canonicalization (C1 canonical schema does not include memoryModel).
 */
export const codeC1Example: TutorialCodePayload = {
  page: {
    type: 'CODE + EXPLANATION',
    title: 'Example: Sum of Two Numbers in Python',
    introduction: 'This example demonstrates how Python accepts two numbers from the user, converts the input into integers, adds the numbers, stores the result, and displays the final answer.',
  },
  code: {
    language: 'Python',
    prismLanguage: 'python',
    source: 'x = int(input("Enter first number: "))\ny = int(input("Enter second number: "))\n\nresult = x + y\n\nprint("Sum:", result)',
  },
  explanation: {
    steps: [
      { number: 1, code: 'input("Enter first number: ")', description: 'The <code>input()</code> function pauses the program and asks the user to enter the first number. The value entered by the user is initially received as text.' },
      { number: 2, code: 'int(input(...))', description: 'The <code>int()</code> function converts the text received from <code>input()</code> into an integer so that mathematical addition can be performed.' },
      { number: 3, code: 'x = int(input(...))', description: 'The converted first number is assigned to the variable <code>x</code>. For example, if the user enters <code>10</code>, then <code>x</code> references the integer value <code>10</code>.' },
      { number: 4, code: 'y = int(input(...))', description: 'The program asks for the second number, converts it into an integer, and assigns the resulting value to the variable <code>y</code>. For example, if the user enters <code>20</code>, then <code>y</code> references the integer value <code>20</code>.' },
      { number: 5, code: 'result = x + y', description: 'Python evaluates the expression <code>x + y</code>. If <code>x</code> is <code>10</code> and <code>y</code> is <code>20</code>, the addition produces <code>30</code>. That result is assigned to <code>result</code>.' },
      { number: 6, code: 'print("Sum:", result)', description: 'The <code>print()</code> function displays the text <code>Sum:</code> followed by the value stored in <code>result</code>.' },
    ],
  },
  output: {
    value: 'Enter first number: 10\nEnter second number: 20\nSum: 30',
  },
  memoryModel: {
    type: 'reference-flow',
    description: 'Python variables reference objects. After the two inputs are converted to integers, x and y reference integer objects. The addition expression produces the result value, which is then referenced by result.',
    layout: {
      type: 'grid',
    },
    columns: [
      { id: 'variables', title: 'Variables (References)', width: 'minmax(160px, 1fr)' },
      { id: 'objects', title: 'Objects in Memory', width: 'minmax(280px, 1.6fr)' },
      { id: 'values', title: 'Values', width: 'minmax(180px, 1fr)' },
    ],
    nodes: [
      { id: 'variable-x', label: 'x', column: 'variables', row: 1, variant: 'reference', monospace: true },
      { id: 'object-x', label: 'id: 140723458765120', column: 'objects', row: 1, variant: 'object', monospace: true },
      { id: 'value-x', label: '10 (int)', column: 'values', row: 1, variant: 'value', monospace: true },
      { id: 'variable-y', label: 'y', column: 'variables', row: 2, variant: 'reference', monospace: true },
      { id: 'object-y', label: 'id: 140723458765248', column: 'objects', row: 2, variant: 'object', monospace: true },
      { id: 'value-y', label: '20 (int)', column: 'values', row: 2, variant: 'value', monospace: true },
      { id: 'variable-result', label: 'result', column: 'variables', row: 3, variant: 'result', monospace: true },
      { id: 'object-result', label: 'id: 140723458765376', column: 'objects', row: 3, variant: 'result', monospace: true },
      { id: 'value-result', label: '30 (int)', column: 'values', row: 3, variant: 'result', monospace: true },
    ],
    connections: [
      { id: 'x-to-object-x', from: 'variable-x', to: 'object-x', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-x-to-value-x', from: 'object-x', to: 'value-x', type: 'value', fromSide: 'right', toSide: 'left' },
      { id: 'y-to-object-y', from: 'variable-y', to: 'object-y', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-y-to-value-y', from: 'object-y', to: 'value-y', type: 'value', fromSide: 'right', toSide: 'left' },
      { id: 'result-to-object-result', from: 'variable-result', to: 'object-result', type: 'reference', fromSide: 'right', toSide: 'left' },
      { id: 'object-result-to-value-result', from: 'object-result', to: 'value-result', type: 'value', fromSide: 'right', toSide: 'left' },
    ],
    note: 'Variables store references to objects, not the actual values. The object identities shown above are illustrative.',
  },
  takeaway: {
    items: [
      'The <code>input()</code> function receives data from the user.',
      'The <code>int()</code> function converts numeric text into an integer.',
      'The <code>+</code> operator performs the addition.',
      'The expression <code>x + y</code> produces the calculated value.',
      'The variable <code>result</code> references the calculated result.',
      'The <code>print()</code> function displays the final result.',
    ],
  },
  tip: {
    text: 'Try entering different numbers, such as 25 and 75, and predict the output before running the program.',
  },
};

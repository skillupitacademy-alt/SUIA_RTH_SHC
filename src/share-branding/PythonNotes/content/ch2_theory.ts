import { Chapter } from '../types';

export const chapter2: Chapter = {
  id: 'theory',
  title: '2. Python Theory: The Engineering Perspective',
  sections: [
    {
      type: 'paragraph',
      content: `To write FAANG-level Python code, you must understand what happens under the hood. Python is not magic; it is a highly optimized C program (CPython) designed to parse, compile, and execute your instructions. Understanding the theoretical foundations allows you to write memory-efficient and highly performant applications.`
    },
    {
      type: 'heading2',
      content: 'Garbage Collection and Memory Management'
    },
    {
      type: 'paragraph',
      content: `Python manages memory primarily through <strong>Reference Counting</strong>, supplemented by a <strong>Generational Garbage Collector</strong> to detect cyclic references.`
    },
    {
      type: 'heading3',
      content: 'Reference Counting'
    },
    {
      type: 'paragraph',
      content: `Every object in Python contains a header that tracks how many variables (references) point to it. When a new reference is created (e.g., <code>a = b</code>), the count increments. When a reference goes out of scope or is reassigned, the count decrements. Once the reference count hits zero, the memory is immediately freed by the C <code>free()</code> function.`
    },
    {
      type: 'code',
      language: 'python',
      content: `import sys

my_list = [1, 2, 3]
# Count is 2: 1 from my_list, 1 passed as argument to getrefcount
print(sys.getrefcount(my_list)) 

b = my_list
# Count increases to 3
print(sys.getrefcount(my_list))

del b
# Count drops back to 2
print(sys.getrefcount(my_list))`,
      output: `2\n3\n2`
    },
    {
      type: 'heading3',
      content: 'Cyclic References and the Generational GC'
    },
    {
      type: 'paragraph',
      content: `Reference counting fails when two objects point to each other (e.g., a node in a doubly-linked list pointing back to the previous node). If they are deleted from the main program, their reference count drops to 1, not 0. To fix this, Python runs a periodic garbage collector that looks for unreachable cycles across three "generations" of objects.`
    },
    {
      type: 'info-box',
      title: 'Generational GC Concept',
      content: `Objects start in Generation 0. If they survive a GC sweep, they move to Generation 1, and eventually Generation 2. Python sweeps Generation 0 frequently, and Generation 2 rarely, optimizing performance.`
    },
    {
      type: 'heading2',
      content: 'Dynamic Typing and Duck Typing'
    },
    {
      type: 'paragraph',
      content: `In C or Java, variables are typed (e.g., <code>int a = 5;</code>). In Python, <strong>objects have types, but variables do not.</strong> A variable is simply a label (a pointer) pointing to an object in the heap.`
    },
    {
      type: 'best-practice',
      content: `While Python is dynamically typed, enterprise codebases heavily utilize <strong>Type Hints</strong> (introduced in PEP 484). Using <code>def process(data: list[int]) -> bool:</code> allows static analysis tools like <code>mypy</code> to catch bugs before runtime, combining the speed of dynamic typing with the safety of static typing.`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: What is Duck Typing?</strong><br/>
<em>Answer:</em> "If it walks like a duck and quacks like a duck, it must be a duck." Python does not care about an object's strict class inheritance; it only cares if the object implements the required methods. For example, a function expecting a <code>file</code> object can accept any object that implements a <code>.read()</code> method.`
    }
  ]
};

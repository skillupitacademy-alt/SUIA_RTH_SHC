import { Chapter } from '../types';

export const chapter1: Chapter = {
  id: 'intro',
  title: '1. Introduction to Python',
  sections: [
    {
      type: 'paragraph',
      content: `Welcome to the absolute pinnacle of Python learning. If you are reading this, you are not here merely to learn syntax—you are here to understand Python at a <strong>Computer Science and Production Engineering</strong> depth. Python is currently one of the most widespread programming languages in the world, heavily utilized by FAANG (Facebook/Meta, Amazon, Apple, Netflix, Google) and other elite organizations.`
    },
    {
      type: 'heading2',
      content: 'Definition: What is Python?'
    },
    {
      type: 'paragraph',
      content: `Python is a <strong>high-level, interpreted, dynamically typed, and garbage-collected</strong> programming language. It emphasizes readability, rapid development, and multi-paradigm programming (supporting procedural, object-oriented, and functional styles). Beneath its simple syntax lies a complex runtime execution engine written primarily in C (CPython), which manages memory allocation, interpretation, and thread safety.`
    },
    {
      type: 'info-box',
      title: 'High-Level Language Meaning',
      content: `When we say "High-Level", it means Python abstracts away hardware-level details like manual memory management, pointer arithmetic, and CPU register allocation. You write logic; the Python interpreter handles the low-level machine communication.`
    },
    {
      type: 'heading2',
      content: 'Historical Background & Evolution'
    },
    {
      type: 'paragraph',
      content: `Python was conceived in the late 1980s by <strong>Guido van Rossum</strong> at Centrum Wiskunde & Informatica (CWI) in the Netherlands. Its implementation began in December 1989. It was designed as a successor to the ABC programming language, specifically aiming to fix its flaws while retaining its elegant readability.`
    },
    {
      type: 'ascii-diagram',
      title: 'Python Evolution Timeline',
      content: `
1989: Conception by Guido van Rossum
  |
1991: Python 0.9.0 released (Classes, exceptions, functions)
  |
1994: Python 1.0 (Functional programming tools: lambda, map, filter, reduce)
  |
2000: Python 2.0 (List comprehensions, garbage collection cycle detection)
  |
2008: Python 3.0 (Major overhaul: Unicode by default, print function, distinct integer types removed)
  |
Present: Continuous evolution via PEPs (Python Enhancement Proposals)
`
    },
    {
      type: 'heading2',
      content: 'Why the Concept Exists: The Problem It Solves'
    },
    {
      type: 'paragraph',
      content: `Before Python gained dominance, systems and application programming were heavily dominated by languages like C, C++, and Java. These languages provide tremendous performance but at a high cost: <strong>developer productivity</strong>. Writing a simple networking script in C requires managing socket buffers, memory leaks, and pointer arithmetic. Python was introduced to solve the "Developer Time vs. Machine Time" paradigm.`
    },
    {
      type: 'paragraph',
      content: `In the modern era, hardware is relatively cheap, but <strong>developer time is extremely expensive</strong>. Python sacrifices some runtime speed to drastically accelerate the speed of writing, reading, and maintaining code. This is why it has become the standard for Machine Learning, Data Science, and rapid backend API development.`
    },
    {
      type: 'best-practice',
      content: `<strong>Optimize for the reader, not the machine.</strong> Code is read ten times more often than it is written. Python's design philosophy (PEP 20 - The Zen of Python) enforces this: "Readability counts."`
    },
    {
      type: 'heading2',
      content: 'Internal Working: The Python Execution Pipeline'
    },
    {
      type: 'paragraph',
      content: `A common misconception is that Python is strictly an "interpreted" language where the source code is read line-by-line and executed directly. In reality, Python employs a two-step execution model:`
    },
    {
      type: 'paragraph',
      content: `1. <strong>Compilation to Bytecode:</strong> When you run a <code>.py</code> file, the Python interpreter first parses the source code into an Abstract Syntax Tree (AST), and then compiles it into a lower-level intermediate representation called <strong>bytecode</strong>. This bytecode is typically cached in <code>__pycache__</code> folders as <code>.pyc</code> files to speed up subsequent executions.<br/>
2. <strong>Execution by PVM (Python Virtual Machine):</strong> The bytecode is then fed into the PVM, which acts as a massive loop executing a C-level switch statement for every bytecode instruction.`
    },
    {
      type: 'ascii-diagram',
      title: 'Python Execution Pipeline',
      content: `
+----------------+      +----------------+      +----------------+      +----------------+
|  Source Code   | ---> |    Compiler    | ---> |    Bytecode    | ---> |      PVM       |
|   (file.py)    |      | (Syntax Check) |      |   (file.pyc)   |      | (Virtual Mach) |
+----------------+      +----------------+      +----------------+      +----------------+
                                                                                |
                                                                                v
                                                                        [CPU / Hardware]
`
    },
    {
      type: 'heading2',
      content: 'Comparison with Other Languages'
    },
    {
      type: 'paragraph',
      content: `<strong>Python vs. C++:</strong> C++ is compiled directly to machine code, making it blisteringly fast but complex to write. Python is interpreted and abstract, making it slower but exceptionally fast to develop.<br/><br/>
<strong>Python vs. Java:</strong> Java is statically typed and runs on the JVM. It is strictly object-oriented and highly verbose. Python is dynamically typed, supports multiple paradigms, and is highly concise. Both use a Virtual Machine (JVM vs PVM).<br/><br/>
<strong>Python vs. JavaScript:</strong> JS is primarily used for web frontends (though Node.js changed this) and uses an asynchronous, event-driven model. Python is synchronous by default (though <code>asyncio</code> exists) and rules the data/ML ecosystem.`
    },
    {
      type: 'heading2',
      content: 'FAANG Interview Questions'
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: Is Python compiled or interpreted?</strong><br/>
<em>Answer:</em> It is a hybrid. Python source code is first compiled into intermediate bytecode, which is then interpreted by the Python Virtual Machine (PVM) at runtime.`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: What is CPython, and how does it relate to Python?</strong><br/>
<em>Answer:</em> "Python" is merely a language specification (a set of rules). CPython is the standard, original implementation of those rules written in C. Other implementations exist, such as PyPy (JIT compiled), Jython (runs on JVM), and IronPython (runs on .NET).`
    }
  ]
};

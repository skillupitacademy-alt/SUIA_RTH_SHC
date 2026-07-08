import { Chapter } from '../types';

export const chapter7: Chapter = {
  id: 'datatypes',
  title: '7. Core Data Types & Structures',
  sections: [
    {
      type: 'paragraph',
      content: `In Python, data types determine the operations that can be performed on an object and how it is stored in memory. The core data types are classified into <strong>Primitives</strong> (int, float, bool, str) and <strong>Collections</strong> (list, tuple, dict, set).`
    },
    {
      type: 'heading2',
      content: 'Numeric Types (int, float, complex)'
    },
    {
      type: 'paragraph',
      content: `Unlike languages where integers have fixed sizes (e.g., 32-bit or 64-bit bounds), Python 3 <code>int</code> objects have <strong>arbitrary precision</strong>. They expand dynamically in memory to hold numbers as large as your RAM permits. <code>float</code> objects are implemented using double-precision C doubles (IEEE 754), which means they suffer from standard floating-point imprecision.`
    },
    {
      type: 'code',
      language: 'python',
      content: `# Arbitrary precision integer
huge_num = 10**1000
print(type(huge_num)) # <class 'int'>

# Floating point precision issue
print(0.1 + 0.2) # 0.30000000000000004`,
    },
    {
      type: 'heading2',
      content: 'Sequences: Lists vs Tuples'
    },
    {
      type: 'paragraph',
      content: `Both lists and tuples hold ordered collections of objects.`
    },
    {
      type: 'info-box',
      title: 'Lists vs Tuples',
      content: `<ul>
<li><strong>List:</strong> Mutable. Implemented as dynamic arrays (like <code>std::vector</code> in C++). When they reach capacity, they allocate a new larger array and copy pointers over.</li>
<li><strong>Tuple:</strong> Immutable. Because their size and contents are fixed upon creation, they are significantly more memory-efficient and faster to iterate than lists.</li>
</ul>`
    },
    {
      type: 'best-practice',
      content: `If you have a collection of data that will never change during execution (e.g., configuration constants, days of the week, HTTP status codes), <strong>always use a tuple instead of a list</strong>. It signals immutability to other engineers and saves memory.`
    },
    {
      type: 'heading2',
      content: 'Hash Maps: Dictionaries & Sets'
    },
    {
      type: 'paragraph',
      content: `Dictionaries (<code>dict</code>) and Sets (<code>set</code>) are implemented using highly optimized Hash Tables in C. This gives them an incredible average time complexity of <strong>O(1)</strong> for lookups, insertions, and deletions.`
    },
    {
      type: 'paragraph',
      content: `To be used as a key in a dictionary or placed in a set, an object must be <strong>hashable</strong>. In Python, an object is hashable if its hash value never changes during its lifetime (it needs a <code>__hash__()</code> method) and can be compared to other objects (it needs an <code>__eq__()</code> method). All immutable built-in objects (strings, ints, tuples) are hashable.`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: Can you use a List as a Dictionary key?</strong><br/>
<em>Answer:</em> No. Lists are mutable. If you used a list as a key and then modified the list, its hash value would change, meaning the dictionary would lose track of where the data is stored in the underlying hash table. Use a Tuple instead.`
    }
  ]
};

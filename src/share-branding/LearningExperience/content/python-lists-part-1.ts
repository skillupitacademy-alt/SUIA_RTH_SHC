export const pythonListsPart1 = {
  id: 'python-lists-part-1',
  title: 'Python Lists — Part 1',
  description: 'Learn the fundamentals of Python lists, internal memory representation, indexing, and slicing.',
  estimatedTime: '15 min read',
  difficulty: 'Beginner',
  prerequisites: ['Basic Python Syntax', 'Variables & Data Types'],
  content: `
## What is a List?

A **List** is one of the most powerful and frequently used built-in data structures in Python. It is designed to store **multiple values inside a single variable** while maintaining the order in which those values were inserted. Unlike variables that can hold only one value at a time, a list acts like a container capable of holding many objects together.

One of the biggest strengths of Python lists is their flexibility. A list can contain integers, floating-point numbers, strings, Boolean values, objects, functions, or even other lists. Because of this versatility, lists are widely used in almost every Python application—from beginner programs to enterprise software developed by companies like Google, Netflix, Amazon, Meta, and Microsoft.

Unlike arrays in languages such as C or Java, Python lists are **dynamic**, meaning their size is not fixed. Elements can be added, removed, or modified at runtime without requiring the programmer to allocate memory manually.

---

## Definition

A **Python List** is an **ordered, mutable, dynamic collection of objects** enclosed within square brackets (\`[]\`).

Example:

\`\`\`python
my_list = [10, 20, 30, 40]
\`\`\`

Here,
* \`my_list\` is the variable.
* \`[10, 20, 30, 40]\` is the list object.
* The list contains four elements.
* Every element has an index.

---

## Historical Background

Python was created by Guido van Rossum in 1991. One of his major design goals was to make programming more intuitive and productive compared to languages like C and C++.

Earlier programming languages relied heavily on arrays with fixed sizes. Managing collections of data required programmers to manually allocate memory, resize arrays, and write extra code for insertion or deletion.

Python introduced **lists** as a dynamic sequence type that automatically handles memory allocation and resizing behind the scenes. This significantly reduced programming complexity and improved developer productivity.

Today, Python lists are among the most frequently used data structures in:
* Artificial Intelligence
* Machine Learning
* Data Science
* Automation
* Web Development
* Cloud Computing
* DevOps
* Backend APIs

---

## Why Do Lists Exist?

Imagine building a student management system.

Without lists:

\`\`\`python
student1 = "John"
student2 = "Alice"
student3 = "David"
student4 = "Emma"
student5 = "Sophia"
\`\`\`

This quickly becomes difficult to manage.

Suppose there are **10,000 students**.

Would you create:

\`\`\`python
student10000
\`\`\`

Of course not. Instead:

\`\`\`python
students = [
    "John",
    "Alice",
    "David",
    "Emma",
    "Sophia"
]
\`\`\`

Now everything is stored inside one variable. This makes searching, updating, sorting, and processing data much easier.

---

## Problems Solved by Lists

Lists solve numerous real-world programming problems.

### Before Lists
* Multiple variables
* Difficult searching
* Difficult looping
* Hard maintenance
* Fixed memory (in many languages)

### After Lists
* Store thousands of values together
* Easy iteration
* Easy insertion
* Easy deletion
* Dynamic resizing
* Efficient data manipulation

---

## Real-World Analogy

Imagine a **bookshelf**.

\`\`\`text
+-------------------------------+
| Python | Java | C++ | Go | AI |
+-------------------------------+
     0       1      2     3    4
\`\`\`

Each book has a position.

Instead of remembering
* first book
* second book
* third book

we simply use the position number. Python Lists work exactly the same way.

---

## Characteristics of Lists

A Python List has several important properties:

| Feature          | Supported |
| ---------------- | --------- |
| Ordered          | ✅ Yes     |
| Mutable          | ✅ Yes     |
| Duplicate Values | ✅ Yes     |
| Dynamic Size     | ✅ Yes     |
| Mixed Data Types | ✅ Yes     |
| Nested Lists     | ✅ Yes     |
| Indexing         | ✅ Yes     |
| Slicing          | ✅ Yes     |

---

## Internal Memory Representation

<Callout type="interview" title="FAANG Interview Tip">
This is one of the most important concepts for interviews. Many beginners think that a list directly stores values. Actually, Python stores <strong>references (memory addresses)</strong> to objects.
</Callout>

Example:

\`\`\`python
numbers = [10, 20, 30]
\`\`\`

Conceptually:

\`\`\`text
Variable
numbers
    │
    ▼
+----------------------------------+
|  •  |  •  |  •  |
+----------------------------------+
   │      │      │
   ▼      ▼      ▼
  10     20     30
\`\`\`

The list object stores references to the integer objects rather than embedding the integer values directly. This design allows Python lists to hold objects of different types in the same collection.

---

## Creating Your First List

The uploaded notebook begins with:

\`\`\`python
my_list = ['p', 'r', 'o', 'b', 'e']
\`\`\`

### What happens internally?

**Step 1:** Python creates five string objects.
\`'p'\`, \`'r'\`, \`'o'\`, \`'b'\`, \`'e'\`

**Step 2:** Python creates one list object.
\`\`\`text
List
-------------
Reference
Reference
Reference
Reference
Reference
\`\`\`

**Step 3:** The variable points to the list.
\`\`\`text
my_list
    │
    ▼
List Object
\`\`\`

---

## Printing the Entire List

Notebook code:

\`\`\`python
print(my_list)
\`\`\`

Output:

\`\`\`python
['p', 'r', 'o', 'b', 'e']
\`\`\`

### Internal Execution Flow

\`\`\`text
print()
      │
      ▼
Fetch variable
      │
      ▼
Locate List Object
      │
      ▼
Read every element
      │
      ▼
Convert to string representation
      │
      ▼
Display on screen
\`\`\`

---

## Indexing

Every element inside a list has an index. Python starts counting from **0**.

\`\`\`text
Index

 0    1    2    3    4

+----+----+----+----+----+
| p  | r  | o  | b  | e  |
+----+----+----+----+----+
\`\`\`

### Accessing First Element

Notebook:

\`\`\`python
print(my_list[0])
\`\`\`

Output:
\`\`\`text
p
\`\`\`

**Internal Working:** Python performs these steps:
1. Locate \`my_list\`.
2. Find the list object in memory.
3. Read the element at index \`0\`.
4. Return the reference to \`'p'\`.
5. Print the string.

### Accessing Third Element

\`\`\`python
print(my_list[2])
\`\`\`

Output:
\`\`\`text
o
\`\`\`

Python counts: \`0 → p\`, \`1 → r\`, \`2 → o\`. Hence, \`my_list[2]\` is \`o\`.

### Accessing Last Element

Notebook:

\`\`\`python
print(my_list[4])
\`\`\`

Output:
\`\`\`text
e
\`\`\`

---

## Nested Lists (List of Lists)

Notebook:

\`\`\`python
n_list = ["Happy", [2, 0, 1, 5]]
\`\`\`

This is known as a **nested list**, where one list contains another list as one of its elements.

Memory representation:

\`\`\`text
n_list
   │
   ▼
+-----------------------------+
| "Happy" |      •           |
+-----------------------------+
                 │
                 ▼
        +-----------------+
        | 2 | 0 | 1 | 5 |
        +-----------------+
\`\`\`

The second element of \`n_list\` is itself another list.

### Accessing Nested Elements

\`\`\`python
print(n_list[0])
\`\`\`
Output: \`Happy\`

\`\`\`python
print(n_list[1])
\`\`\`
Output: \`[2, 0, 1, 5]\`

\`\`\`python
print(n_list[1][3])
\`\`\`
Output: \`5\`

Execution steps:
1. Access \`n_list[1]\` → \`[2, 0, 1, 5]\`.
2. From that inner list, access index \`3\`.
3. Return \`5\`.

---

## Negative Indexing

Python also supports indexing from the end of the list.

\`\`\`text
Positive Index
 0   1   2   3   4
 p   r   o   b   e
-5  -4  -3  -2  -1
Negative Index
\`\`\`

Notebook:

\`\`\`python
print(my_list[-1])
\`\`\`

Output: \`e\`

Here, \`-1\` always refers to the last element of the list.

Similarly, \`print(my_list[-5])\` returns the first element because \`-5\` refers to the fifth position counted backward. 

<Callout type="tip" title="Pro Tip">
Negative indexing is especially useful when you need the last few elements of a sequence without knowing its exact length.
</Callout>

---

## List Slicing

Slicing allows you to retrieve a portion of a list.

General syntax:

\`\`\`python
list[start:stop]
\`\`\`

The \`start\` index is included, while the \`stop\` index is excluded.

For example:

\`\`\`python
print(my_list[2:5])
\`\`\`

Output:
\`\`\`python
['o', 'b', 'e']
\`\`\`

Python reads elements at indices \`2\`, \`3\`, and \`4\`, stopping before index \`5\`.

Another example:

\`\`\`python
print(my_list[1:3])
\`\`\`

Returns \`['r', 'o']\` because indices \`1\` and \`2\` are included, but index \`3\` is not. 

Negative indices can also be used in slicing:

\`\`\`python
print(my_list[${'-4:-1'}])
\`\`\`

Output:
\`\`\`python
['r', 'o', 'b']
\`\`\`

Here, Python starts at index \`-4\` (\`'r'\`) and stops before index \`-1\` (\`'e'\`), producing \`['r', 'o', 'b']\`.

---

## Key Takeaways (Part 1)

* A list is an ordered, mutable, and dynamically sized collection.
* Lists store references to objects, enabling heterogeneous collections.
* Indexing starts at \`0\`.
* Negative indexing starts from \`-1\` and counts backward.
* Nested lists allow hierarchical data structures.
* Slicing returns a new list and follows the rule: **start is inclusive, stop is exclusive**.
* Lists are foundational to Python programming and are heavily used in real-world software, data processing, automation, and machine learning.

> In **Part 2**, we'll dive into **modifying lists**, covering item assignment, slice assignment, \`append()\`, \`extend()\`, list concatenation (\`+\`), repetition (\`*\`), and \`insert()\`, along with their internal behavior, memory effects, time complexity, and production best practices.
`
};

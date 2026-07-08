import { Chapter } from '../types';

export const chapter6: Chapter = {
  id: 'variables',
  title: '6. Variables & Memory References',
  sections: [
    {
      type: 'paragraph',
      content: `In languages like C or Java, a variable is analogous to a <strong>box</strong> (a specific memory address) into which you place a value. In Python, a variable is analogous to a <strong>nametag</strong> tied to an object in memory.`
    },
    {
      type: 'heading2',
      content: 'The Nametag Analogy'
    },
    {
      type: 'paragraph',
      content: `When you write <code>x = 10</code>, Python does not create a variable named 'x' and put the number 10 inside it. Instead, it creates an integer object <code>10</code> in memory, and then creates a label (pointer) <code>x</code> that points to that object.`
    },
    {
      type: 'code',
      language: 'python',
      content: `x = [1, 2, 3]  # Create list object, point x to it
y = x          # Point y to the SAME object x is pointing to

y.append(4)    # Mutate the object

print(x)       # [1, 2, 3, 4] -- x is affected because x and y share the object!`,
    },
    {
      type: 'warning-box',
      title: 'Shared References (The Mutation Trap)',
      content: `This behavior is the source of countless bugs for junior developers. Because <code>x</code> and <code>y</code> are just pointers to the same underlying heap object, modifying the object via <code>y</code> immediately reflects in <code>x</code>. This applies to <strong>mutable</strong> objects (lists, dictionaries, sets).`
    },
    {
      type: 'heading2',
      content: 'Identity vs Equality (is vs ==)'
    },
    {
      type: 'paragraph',
      content: `Because of the "nametag" system, Python provides two ways to compare variables:`
    },
    {
      type: 'info-box',
      title: 'is vs ==',
      content: `<ul>
<li><code>==</code> (Equality): Do these two objects have the same <strong>value</strong>?</li>
<li><code>is</code> (Identity): Are these two variables pointing to the exact same <strong>memory address</strong>?</li>
</ul>`
    },
    {
      type: 'code',
      language: 'python',
      content: `a = [1, 2, 3]
b = [1, 2, 3]

print(a == b)  # True: The values are identical.
print(a is b)  # False: They are two separate objects in memory.

c = a
print(a is c)  # True: They point to the exact same memory address.`,
    },
    {
      type: 'heading2',
      content: 'Interning (Memory Optimization)'
    },
    {
      type: 'paragraph',
      content: `To save memory, CPython pre-allocates and caches small integers (typically from -5 to 256) and short strings. This optimization is called <strong>interning</strong>.`
    },
    {
      type: 'code',
      language: 'python',
      content: `a = 256
b = 256
print(a is b)  # True! Python interns small integers.

c = 1000
d = 1000
print(c is d)  # False! (In standard REPL, large numbers are created as separate objects)`,
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: Why does modifying a string in Python require reassignment, unlike modifying a list?</strong><br/>
<em>Answer:</em> Strings are <strong>immutable</strong> in Python. You cannot change a string object in place in memory. When you do <code>s = s + "a"</code>, Python creates a brand new string object in the heap and points the label <code>s</code> to it. Lists are <strong>mutable</strong> and can be modified in place.`
    }
  ]
};

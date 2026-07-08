import { Chapter } from '../types';

export const chapter9: Chapter = {
  id: 'operators',
  title: '9. Operators & Magic Methods',
  sections: [
    {
      type: 'paragraph',
      content: `Operators in Python (such as <code>+</code>, <code>-</code>, <code>*</code>, <code>==</code>) are not hardcoded compiler primitives like they are in C. They are syntactic sugar that resolve into <strong>Magic Methods (Dunder Methods)</strong> implemented on the underlying object.`
    },
    {
      type: 'heading2',
      content: 'The Dunder Method Architecture'
    },
    {
      type: 'paragraph',
      content: `When you evaluate <code>a + b</code>, Python internally executes <code>a.__add__(b)</code>. If <code>a</code> does not know how to add <code>b</code>, it returns a <code>NotImplemented</code> flag, and Python falls back to <code>b.__radd__(a)</code>.`
    },
    {
      type: 'code',
      language: 'python',
      content: `class Vector2D:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        
    # Operator Overloading for the '+' operator
    def __add__(self, other):
        return Vector2D(self.x + other.x, self.y + other.y)
        
v1 = Vector2D(10, 20)
v2 = Vector2D(5, 5)

# This triggers v1.__add__(v2)
v3 = v1 + v2
print(v3.x, v3.y)  # 15, 25`,
    },
    {
      type: 'info-box',
      title: 'Polymorphism at its Finest',
      content: `This architecture is why you can add two integers (math), add two strings (concatenation), and add two lists (merging) using the exact same <code>+</code> operator. Each class defines its own <code>__add__</code> implementation.`
    },
    {
      type: 'heading2',
      content: 'Short-Circuit Evaluation'
    },
    {
      type: 'paragraph',
      content: `Logical operators (<code>and</code>, <code>or</code>) use <strong>short-circuit evaluation</strong> to optimize runtime.`
    },
    {
      type: 'code',
      language: 'python',
      content: `def expensive_operation():
    print("This takes 5 seconds...")
    return True

# In an 'or' statement, if the first condition is True, 
# the second condition is NEVER evaluated.
if True or expensive_operation():
    print("Done") # expensive_operation() is completely skipped!`,
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: What is the difference between 'is' and '=='?</strong><br/>
<em>Answer:</em> <code>==</code> evaluates the <code>__eq__()</code> dunder method to compare value equality. <code>is</code> compares the actual memory addresses using the C-level <code>id()</code> pointer equivalent.`
    }
  ]
};

import { Chapter } from '../types';

export const chapter5: Chapter = {
  id: 'basics',
  title: '5. Python Basics & Execution Flow',
  sections: [
    {
      type: 'paragraph',
      content: `At its core, Python enforces a design philosophy that prioritizes readability above all else. This is immediately visible in its syntax, which drops the curly braces <code>{}</code> and semicolons <code>;</code> typical of C-family languages, relying instead on <strong>whitespace and indentation</strong> to define structure.`
    },
    {
      type: 'heading2',
      content: 'The Indentation Constraint'
    },
    {
      type: 'paragraph',
      content: `In Python, indentation is not cosmetic; it is syntactically mandatory. The Python parser uses exact leading whitespace spaces to determine block scope (such as function bodies, loops, and conditionals).`
    },
    {
      type: 'code',
      language: 'python',
      content: `# CORRECT
def calculate_metrics():
    print("Calculating...")
    if True:
        print("Success")

# INCORRECT (Will raise IndentationError)
def calculate_metrics():
print("Calculating...")`,
    },
    {
      type: 'best-practice',
      content: `<strong>PEP-8 Standard:</strong> Always use exactly <strong>4 spaces</strong> for indentation. Do not use tabs, and never mix tabs and spaces. Modern IDEs handle this automatically, but understanding the rule is critical for cross-platform collaboration.`
    },
    {
      type: 'heading2',
      content: 'Execution Flow'
    },
    {
      type: 'paragraph',
      content: `Unlike Java or C, Python does not require a designated <code>main()</code> function to execute. The Python interpreter reads the script top-to-bottom, executing statements as it encounters them. However, for production-grade scripts, defining an entry point using the <code>if __name__ == "__main__":</code> guard is an architectural necessity.`
    },
    {
      type: 'code',
      language: 'python',
      content: `# module.py

def core_logic():
    print("Executing core logic")

# This print statement executes immediately when the file is imported or run!
print("Module initialized")

if __name__ == "__main__":
    # This block ONLY executes if the file is run directly, NOT if imported.
    core_logic()`,
    },
    {
      type: 'info-box',
      title: 'The __name__ Variable',
      content: `Whenever the Python interpreter runs a script, it assigns the special variable <code>__name__</code> to the string <code>"__main__"</code>. If the script is being imported as a module by another script, <code>__name__</code> is set to the name of the module. The guard prevents code from running unintentionally during an import.`
    },
    {
      type: 'heading2',
      content: 'Everything is an Object'
    },
    {
      type: 'paragraph',
      content: `In Java, primitive types (like <code>int</code> or <code>char</code>) are fundamentally different from Objects to save memory. In Python, <strong>everything is an object</strong>, instantiated from a class in memory. Functions are objects, integers are objects, and classes themselves are objects (metaclasses).`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: Are functions first-class citizens in Python?</strong><br/>
<em>Answer:</em> Yes. Because functions are objects, they can be assigned to variables, passed as arguments to other functions, and returned from other functions. This is the foundation of Python's decorators and functional programming capabilities.`
    }
  ]
};

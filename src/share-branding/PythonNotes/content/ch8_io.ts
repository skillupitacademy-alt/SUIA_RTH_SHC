import { Chapter } from '../types';

export const chapter8: Chapter = {
  id: 'io',
  title: '8. Input, Output & File Handling',
  sections: [
    {
      type: 'paragraph',
      content: `In standard tutorials, I/O is taught via <code>print()</code> and <code>input()</code>. In enterprise systems, I/O extends to file streams, standard out/error file descriptors, serialization, and asynchronous data buffers.`
    },
    {
      type: 'heading2',
      content: 'Standard I/O Streams'
    },
    {
      type: 'paragraph',
      content: `The <code>print()</code> function is essentially a wrapper around <code>sys.stdout.write()</code>. It automatically formats the data and appends a newline character.`
    },
    {
      type: 'code',
      language: 'python',
      content: `import sys

# Standard print
print("Hello World")

# What print actually does under the hood
sys.stdout.write("Hello World\\n")

# Redirecting error logs to standard error
print("Critical Failure", file=sys.stderr)`,
    },
    {
      type: 'heading2',
      content: 'File I/O and Context Managers'
    },
    {
      type: 'paragraph',
      content: `When a file is opened, the operating system allocates a file descriptor. If the file is not explicitly closed, it causes a memory leak and eventually crashes the application with a "Too many open files" exception (Error code 24).`
    },
    {
      type: 'best-practice',
      content: `Never use <code>f = open('file.txt')</code> followed manually by <code>f.close()</code>. If an exception occurs before <code>close()</code>, the file remains open. <strong>Always use Context Managers (the <code>with</code> statement).</strong>`
    },
    {
      type: 'code',
      language: 'python',
      content: `# CORRECT (Context Manager)
# The __exit__ method of the file object is guaranteed to execute,
# closing the file even if a ZeroDivisionError happens inside the block.
with open('data.json', 'r') as file:
    data = file.read()
    # 1/0 (If it crashed here, the file still closes safely)
`,
    },
    {
      type: 'heading2',
      content: 'Serialization (JSON)'
    },
    {
      type: 'paragraph',
      content: `Production applications communicate primarily via JSON over HTTP. The <code>json</code> standard library maps JSON types to Python types (e.g., JSON Object -> Python Dictionary).`
    },
    {
      type: 'code',
      language: 'python',
      content: `import json

data = {"status": "success", "code": 200, "payload": [1, 2, 3]}

# Serialize Python Dict to JSON String
json_string = json.dumps(data)

# Deserialize JSON String back to Python Dict
parsed_data = json.loads(json_string)`,
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: What is the difference between dump() and dumps()?</strong><br/>
<em>Answer:</em> <code>dumps()</code> (dump string) serializes an object into a string variable in memory. <code>dump()</code> serializes an object and writes it directly to a file stream. Use <code>dump()</code> for large payloads to avoid memory spikes.`
    }
  ]
};

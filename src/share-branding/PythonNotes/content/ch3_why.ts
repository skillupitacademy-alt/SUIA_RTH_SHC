import { Chapter } from '../types';

export const chapter3: Chapter = {
  id: 'why-python',
  title: '3. Why Python?',
  sections: [
    {
      type: 'paragraph',
      content: `The decision to adopt a programming language at an enterprise scale is never taken lightly. When organizations like Netflix, Instagram, and Spotify chose Python to handle their core logic, they evaluated the trade-offs between execution speed, developer productivity, and ecosystem maturity.`
    },
    {
      type: 'heading2',
      content: 'The "Developer Time" vs "Machine Time" Paradigm'
    },
    {
      type: 'paragraph',
      content: `In the early days of computing, machine time (CPU cycles and RAM) was incredibly expensive, while developer salaries were comparatively negligible. Languages like C and C++ were designed to extract maximum performance from hardware. Today, the paradigm has flipped. Cloud computing is cheap, but senior engineering time is extremely expensive.`
    },
    {
      type: 'info-box',
      title: 'Python\'s Core Value Proposition',
      content: `Python is designed to optimize <strong>developer productivity</strong>. It allows engineers to write, test, and deploy features exponentially faster than in statically typed, verbose languages. If a Python script takes 10 milliseconds instead of C++'s 1 millisecond, the user will not notice, but the company saved weeks of development time.`
    },
    {
      type: 'heading2',
      content: 'Massive Standard Library and Ecosystem'
    },
    {
      type: 'paragraph',
      content: `Python is famous for its "Batteries Included" philosophy. The standard library provides out-of-the-box support for JSON parsing, HTTP requests, regular expressions, multi-threading, and data serialization. Beyond the standard library, the Python Package Index (PyPI) hosts millions of third-party libraries.`
    },
    {
      type: 'best-practice',
      content: `Never reinvent the wheel in Python. Before writing a custom algorithm to parse CSVs, parse dates, or handle timezone conversions, check the standard library or PyPI. <code>pandas</code> and <code>datetime</code> already solve these problems with highly optimized C-extensions.`
    },
    {
      type: 'heading2',
      content: 'Multi-Paradigm Support'
    },
    {
      type: 'paragraph',
      content: `Unlike Java (which forces Object-Oriented Programming) or Haskell (which forces Functional Programming), Python allows you to use the best paradigm for the problem at hand:`
    },
    {
      type: 'code',
      language: 'python',
      content: `# 1. Procedural (Scripting)
def process_data(data):
    return [x * 2 for x in data]

# 2. Object-Oriented
class DataProcessor:
    def __init__(self, multiplier):
        self.multiplier = multiplier
        
    def process(self, data):
        return [x * self.multiplier for x in data]

# 3. Functional
data = [1, 2, 3]
result = list(map(lambda x: x * 2, data))`
    },
    {
      type: 'heading2',
      content: 'C-Extension Integration (The "Glue" Language)'
    },
    {
      type: 'paragraph',
      content: `A common critique is that "Python is slow." This is true for pure Python loops. However, Python is rarely used to do heavy mathematical lifting directly. Instead, Python acts as a high-level "glue" language that orchestrates highly optimized C, C++, and Fortran libraries. For example, when you multiply matrices in NumPy, the computation is actually happening in C, operating at near-hardware speeds while you enjoy Python's beautiful syntax.`
    },
    {
      type: 'interview-tip',
      content: `<strong>Q: If Python is so slow, why is it used for Machine Learning (which requires massive computation)?</strong><br/>
<em>Answer:</em> Python is merely the frontend API. The actual heavy lifting (matrix multiplication, gradient descent) is delegated to underlying C++ and CUDA (GPU) libraries like TensorFlow and PyTorch. Python provides the usability; C++ provides the speed.`
    }
  ]
};

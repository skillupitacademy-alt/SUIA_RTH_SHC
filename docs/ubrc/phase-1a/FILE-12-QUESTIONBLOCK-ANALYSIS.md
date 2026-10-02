# FILE 12 — QUESTIONBLOCK ANALYSIS

**Phase 1A: Educational Block Reference Architecture Investigation**  
**Analysis Date**: 2026-10-02  
**Corpus Source**: `E:\onlinewebsites\quiz-platform\ILS_UI_UX\docs\blocksmdfiles\QuestionBlock.md`  
**Evidence Classification**: VERIFIED (from dedicated family .md file)

---

## PART 1: BLOCK IDENTITY

### Family Name
**QuestionBlock** (Block #12 in 18-block sequence)

### Semantic Purpose
Engages learners through progressively complex question formats from simple concept checks (Q1) through explanation requests (Q2), reasoning probes (Q3), hypothetical scenarios (Q4), output predictions (Q5), code analysis (Q6), scenario applications (Q7), to open-ended technical discourse (Q8), creating active thinking and response opportunities that support learning through retrieval practice without formal assessment scoring.

### Educational Position
- **After**: SummaryBlock (Block #11)
- **Before**: ExerciseBlock (Block #13, per completion statement)
- **Purpose**: Learning through thinking and active recall, NOT formal assessment

### Critical Distinction
**QuestionBlock ≠ QuizBlock**
- QuestionBlock: Learning through thinking (active recall, concept exploration)
- QuizBlock: Formal assessment (scoring, evaluation, grading)
- QuestionBlock: "Think about this concept"
- QuizBlock: "Select correct answer A/B/C/D, submit, score"

### Version Count
**8 versions confirmed** (Q1-Q8) — **COMPLETE FAMILY, NO GAPS DETECTED** ✅

---

## PART 2: EDUCATIONAL CONTEXT

### Learning Objectives by Version

**Q1 — Simple Concept Question**
- Check understanding of one core concept
- "What is X?" or "What does X do?"
- Short conceptual answer expected
- Single-concept isolation
- Active recall practice

**Q2 — Explain in Your Own Words**
- Test deeper understanding through explanation
- "Explain how X works" or "Describe X in your own words"
- Requires conceptual reformulation
- Tests internalization, not memorization
- Learner must demonstrate comprehension

**Q3 — Why Question**
- Probe reasoning and purpose understanding
- "Why does X work this way?" or "Why is X important?"
- Requires causal/purposeful reasoning
- Connects concept to rationale
- Tests understanding of underlying principles

**Q4 — What Happens If...?**
- Explore consequences through hypothetical scenarios
- "What happens if we change X?" or "What if Y condition?"
- Requires predictive reasoning
- Tests mental model robustness
- Explores conceptual boundaries

**Q5 — Predict the Output**
- Predict execution results from code
- "What will this code produce?"
- Requires execution tracing mental model
- Code comprehension without running
- Tests understanding through prediction

**Q6 — Code Reasoning**
- Analyze code behavior and explain reasoning
- "Why does this code behave this way?"
- Requires code reading + conceptual explanation
- Deeper than Q5 (not just output, but WHY)
- Tests code comprehension and reasoning

**Q7 — Scenario-Based Question**
- Apply knowledge to realistic practical scenarios
- "How would you solve this real-world problem?"
- Requires contextual application
- Tests transfer of learning
- Simulates professional decision-making

**Q8 — Open-Ended Technical Question**
- Engage in comprehensive technical reasoning
- "Discuss the relationship between X, Y, and Z"
- Requires synthesis and discourse
- Tests deep conceptual integration
- Most complex cognitive demand

### Pedagogical Progression

```
Q1: Recall (what is it?)
  ↓
Q2: Explain (describe it)
  ↓
Q3: Reason (why?)
  ↓
Q4: Predict (what if?)
  ↓
Q5: Trace (what output?)
  ↓
Q6: Analyze (why this behavior?)
  ↓
Q7: Apply (real scenario?)
  ↓
Q8: Synthesize (comprehensive discourse)
```

**Cognitive Progression**: Bloom's Taxonomy alignment
- Q1: Remember/Understand
- Q2: Understand
- Q3: Understand/Analyze
- Q4: Apply/Analyze
- Q5: Apply/Analyze
- Q6: Analyze
- Q7: Apply/Evaluate
- Q8: Analyze/Evaluate/Create

### Key Distinctions

**QuestionBlock vs QuizBlock**:
```
QuestionBlock:
- Learning through thinking
- Active recall
- No scoring/grading
- "Think about this"
- Reveal answer pattern
- Optional self-check

QuizBlock:
- Formal assessment
- Multiple choice (A/B/C/D)
- Scoring/evaluation
- "Submit for grade"
- Correct/incorrect feedback
- Assessment results
```

**QuestionBlock vs ExerciseBlock**:
```
QuestionBlock:
- Think/explain/reason
- Primarily conceptual
- May not require code execution

ExerciseBlock:
- Practice a skill
- Hands-on implementation
- Requires active doing
```

**QuestionBlock vs TaskBlock**:
```
QuestionBlock:
- Thought exercise

TaskBlock:
- Practical task performance
- Real-world activity
```

---

## PART 3: UNIVERSAL PRINCIPLES VERIFIED

### Cross-Version Constants

1. **Learning-First Philosophy** (all versions):
   - Primary purpose: Learning through active thinking
   - NOT assessment/grading engine
   - Supports retrieval practice
   - Encourages active recall

2. **SUIA Color System** (all versions):
   - Primary: `#F54A8D` (pink/accent)
   - Secondary: `#0B1B3D` (navy/structure)
   - Light theme
   - Minimal decoration

3. **Reveal Answer Pattern** (all versions):
   - Question displayed first
   - Learner encouraged to think
   - "Reveal Answer" interaction
   - Answer + explanation shown
   - Optional self-check ("Did you know this?")

4. **Responsive Design** (all versions):
   - Desktop: Centered question cards
   - Tablet/Mobile: Full-width, stacked
   - Readable typography
   - Clear interaction targets

5. **JSON-Driven Architecture** (all versions):
   - Question content in JSON
   - Answer/explanation in JSON
   - Renderer determines presentation
   - Version-specific schemas

6. **No Automatic Scoring**:
   - Questions support learning, not evaluation
   - Optional self-reflection
   - No grade calculation
   - Feedback is educational, not evaluative

---

## PART 4: VERSION SPECIFICATIONS

### Q1 — Simple Concept Question

**Presentation**: Simple Concept Question  
**Status**: 🔵 Simplest, single-concept check

**Purpose**: Check whether learner understands one core concept

**Core Structure**:
```
CONCEPT
  ↓
SIMPLE QUESTION
  ↓
THINK
  ↓
ANSWER
  ↓
UNDERSTANDING
```

**Mental Model**: "Do I understand this concept?"

**Question Patterns**:
```
- WHAT IS ______?
- WHAT DOES ______ DO?
- CAN ______?
- WHAT IS THE PURPOSE OF ______?
- WHAT DOES ______ MEAN?
```

**Question Types**:
- Definition: "What is a list?"
- Purpose: "What is the purpose of `finally`?"
- Behavior: "Are Python lists mutable?"
- Terminology: "What does polymorphism mean?"
- Role: "What is the role of authentication?"
- Basic distinction: "What does `is` test?"

**Answer Model**:
```
SHORT ANSWER
+
OPTIONAL EXPLANATION
```

**HTML Structure**:
```html
<section class="tutorial-block question-block question-q1"
         data-block="question" data-version="Q1">
  <header class="question-header">
    <span class="question-eyebrow">QUESTIONBLOCK</span>
    <h2 class="question-title">Simple Concept Question</h2>
  </header>
  
  <!-- QUESTION STATE -->
  <div class="question-card">
    <span class="question-label">QUESTION</span>
    <h3>[Question text]</h3>
    <p class="question-prompt">Think about the concept before revealing the answer.</p>
    <button class="reveal-answer-btn">Reveal Answer</button>
  </div>
  
  <!-- ANSWER STATE (after reveal) -->
  <div class="answer-card">
    <span class="answer-label">ANSWER</span>
    <p class="answer-text">[Short answer]</p>
    <div class="key-idea">
      <span>KEY IDEA</span>
      <p>[Explanation]</p>
    </div>
  </div>
  
  <!-- OPTIONAL SELF-CHECK -->
  <div class="self-check">
    <p>Did you know this?</p>
    <button>✓ Yes</button>
    <button>Need Review</button>
  </div>
</section>
```

**SUIA Colors**: Primary #F54A8D, Secondary #0B1B3D

**Examples from Corpus**:
```
Q: What is a Python list?
A: An ordered, mutable sequence.

Q: Can a Python list be modified after creation?
A: Yes. Lists are mutable.

Q: What does a Python variable refer to?
A: A variable name refers to an object.

Q: What does authentication establish?
A: The identity of the requester.
```

**Content Rules**:
- ONE concept per question
- Short, clear question
- Concise answer
- Avoid complexity (that's Q8)
- Focus on recall/understanding

---

### Q2 — Explain in Your Own Words

**Presentation**: Explain in Your Own Words  
**Status**: 🔵 Deeper understanding through explanation

**Purpose**: Test deeper understanding by requiring learner to explain concept in their own words

**Core Structure**:
```
CONCEPT
  ↓
"EXPLAIN THIS"
  ↓
REFORMULATION
  ↓
UNDERSTANDING VERIFIED
```

**Mental Model**: "Can I explain this concept without memorized phrasing?"

**Question Patterns**:
```
- EXPLAIN HOW ______ WORKS
- DESCRIBE ______ IN YOUR OWN WORDS
- HOW WOULD YOU EXPLAIN ______ TO SOMEONE?
- WHAT DOES ______ MEAN IN YOUR OWN UNDERSTANDING?
```

**vs Q1**:
- Q1: Short factual answer ("What is X?")
- Q2: Explanation in own words (requires reformulation)
- Q1: Tests recall
- Q2: Tests internalization

**Answer Model**:
```
EXPLANATION (paragraph form)
+
KEY POINTS (optional bullet list)
```

**HTML Structure**: Similar to Q1 but with:
```html
<div class="explanation-prompt">
  <p>Explain in your own words before revealing the model answer.</p>
</div>
<div class="model-explanation">
  <span>MODEL EXPLANATION</span>
  <p>[Paragraph explanation]</p>
  <ul class="key-points">
    <li>[Point 1]</li>
    <li>[Point 2]</li>
  </ul>
</div>
```

**Examples from Corpus**:
```
Q: Explain how Python list indexing works.
A: List indexing allows you to access individual elements by their position. 
   Positive indices count from the beginning (0 is first), while negative 
   indices count from the end (-1 is last). The index identifies the element's 
   position in the ordered sequence.

Q: Describe what happens during exception propagation.
A: When an exception is raised and not immediately caught, Python searches 
   upward through the call stack for a matching exception handler. Each 
   function in the stack is checked until a handler is found or the exception 
   reaches the top level.
```

---

### Q3 — Why Question

**Presentation**: Why Question  
**Status**: 🔵 Reasoning and purpose understanding

**Purpose**: Probe reasoning and purpose understanding through "why" questions

**Core Structure**:
```
CONCEPT/BEHAVIOR
  ↓
"WHY?"
  ↓
REASONING
  ↓
PRINCIPLE UNDERSTANDING
```

**Mental Model**: "Do I understand WHY, not just WHAT?"

**Question Patterns**:
```
- WHY DOES ______ WORK THIS WAY?
- WHY IS ______ IMPORTANT?
- WHY SHOULD YOU ______?
- WHY NOT ______?
- WHAT IS THE REASON FOR ______?
```

**vs Q1/Q2**:
- Q1: What is it? (definition)
- Q2: How does it work? (explanation)
- Q3: **Why does it matter?** (reasoning/purpose)

**Answer Model**:
```
REASONING
+
PURPOSE/BENEFIT
+
OPTIONAL EXAMPLE/CONSEQUENCE
```

**Examples from Corpus**:
```
Q: Why are Python lists mutable?
A: Mutability allows lists to be modified after creation, supporting efficient 
   in-place operations and dynamic data structures without creating new objects.

Q: Why should you use specific exception handling?
A: Specific exception handling prevents unrelated errors from being accidentally 
   caught and swallowed, making failures more predictable and debuggable.

Q: Why does Python use reference semantics for variables?
A: Reference semantics enables efficient memory usage by allowing multiple names 
   to refer to the same object without duplication, while supporting object 
   identity and shared state patterns.
```

---

### Q4 — What Happens If...?

**Presentation**: What Happens If...?  
**Status**: 🔵 Hypothetical scenario exploration

**Purpose**: Explore consequences through hypothetical scenarios and counterfactual reasoning

**Core Structure**:
```
SCENARIO
  ↓
"WHAT IF WE CHANGE X?"
  ↓
PREDICTION
  ↓
CONSEQUENCE UNDERSTANDING
```

**Mental Model**: "What are the consequences of this change?"

**Question Patterns**:
```
- WHAT HAPPENS IF WE ______?
- WHAT IF ______ INSTEAD OF ______?
- WHAT WOULD OCCUR IF ______?
- HOW WOULD BEHAVIOR CHANGE IF ______?
```

**vs Previous Versions**:
- Q1: What is it?
- Q2: Explain it
- Q3: Why?
- Q4: **What if...?** (hypothetical reasoning)

**Answer Model**:
```
CONSEQUENCE
+
REASONING
+
PRACTICAL IMPACT
```

**Examples from Corpus**:
```
Q: What happens if we modify a list while another variable references the same list?
A: Both variables reference the same object, so modifications through one variable 
   are visible through the other. This is aliasing behavior.

Q: What happens if an exception is raised but never caught?
A: The exception propagates to the top level, causing the program to terminate 
   with an unhandled exception error message and traceback.

Q: What if you use mutable default arguments in a Python function?
A: The default object is created once at function definition and shared across 
   all calls, leading to unexpected behavior when the mutable object is modified.
```

---

### Q5 — Predict the Output

**Presentation**: Predict the Output  
**Status**: 🔵 Code execution prediction

**Purpose**: Predict execution results from code without running it

**Core Structure**:
```
CODE
  ↓
"WHAT WILL THIS PRODUCE?"
  ↓
MENTAL EXECUTION
  ↓
OUTPUT PREDICTION
```

**Mental Model**: "Can I trace execution mentally?"

**Question Pattern**:
```
[Code snippet shown]

What will this code produce?
```

**vs Q6**:
- Q5: **What is the output?** (prediction)
- Q6: **Why does it produce this output?** (reasoning)

**Answer Model**:
```
OUTPUT (exact or described)
+
EXECUTION TRACE (optional)
+
KEY CONCEPT (why this output)
```

**HTML Structure**:
```html
<div class="code-prediction-question">
  <pre><code>[Code snippet]</code></pre>
  <p>What will this code produce?</p>
  <p class="hint">Trace the execution mentally before revealing.</p>
  <button>Reveal Output</button>
</div>
<div class="output-reveal">
  <span>OUTPUT</span>
  <pre><code>[Actual output]</code></pre>
  <div class="execution-explanation">
    <span>EXECUTION TRACE</span>
    <ol>
      <li>[Step 1]</li>
      <li>[Step 2]</li>
    </ol>
  </div>
</div>
```

**Examples from Corpus**:
```
Q: 
numbers = [1, 2, 3]
numbers.append(4)
print(numbers)

What will this produce?

A: [1, 2, 3, 4]
   The append() method adds 4 as a single element to the end.

---

Q:
a = [1, 2]
b = a
b.append(3)
print(a)

What will this produce?

A: [1, 2, 3]
   Both a and b reference the same list object, so mutation through b is 
   visible through a.
```

---

### Q6 — Code Reasoning

**Presentation**: Code Reasoning  
**Status**: 🔵 Code analysis with explanation

**Purpose**: Analyze code behavior and explain the reasoning behind it

**Core Structure**:
```
CODE + BEHAVIOR
  ↓
"WHY DOES IT BEHAVE THIS WAY?"
  ↓
CODE ANALYSIS
  ↓
CONCEPTUAL EXPLANATION
```

**Mental Model**: "Why does this code work this way?"

**vs Q5**:
- Q5: What is the output? (prediction focus)
- Q6: **Why this behavior?** (reasoning focus)
- Q5: Execution trace
- Q6: Conceptual explanation

**Question Pattern**:
```
[Code snippet shown]
[Behavior described]

Why does this code behave this way?
```

**Answer Model**:
```
REASONING
+
UNDERLYING CONCEPT
+
STEP-BY-STEP EXPLANATION
```

**Examples from Corpus**:
```
Q:
def append_to(element, target=[]):
    target.append(element)
    return target

Why does calling this function multiple times with the default argument 
produce unexpected results?

A: The default list is created once at function definition and shared across 
   all calls. Each invocation modifies the same list object. This is Python's 
   default argument evaluation behavior—defaults are evaluated at definition 
   time, not call time.

---

Q:
x = [1, 2, 3]
y = x
x = [4, 5, 6]
print(y)

Why does y still reference [1, 2, 3]?

A: The assignment x = [4, 5, 6] rebinds the name x to a new list object. 
   It does not modify the original list that y references. This demonstrates 
   the difference between rebinding (assignment) and mutation.
```

---

### Q7 — Scenario-Based Question

**Presentation**: Scenario-Based Question  
**Status**: 🔵 Real-world application

**Purpose**: Apply knowledge to realistic practical scenarios

**Core Structure**:
```
REALISTIC SCENARIO
  ↓
"HOW WOULD YOU SOLVE THIS?"
  ↓
APPLIED REASONING
  ↓
PRACTICAL SOLUTION
```

**Mental Model**: "Can I apply this knowledge to real problems?"

**Question Pattern**:
```
[Scenario description]

How would you approach this problem?
What solution would you use?
What factors should you consider?
```

**vs Previous Versions**:
- Q1-Q6: Primarily conceptual/analytical
- Q7: **Practical application** to realistic contexts

**Answer Model**:
```
APPROACH
+
SOLUTION STRATEGY
+
CONSIDERATIONS
+
EXAMPLE IMPLEMENTATION (optional)
```

**Examples from Corpus**:
```
Q: You need to store user data that will be accessed frequently and modified 
   often. The data has a natural key-value structure. What Python data 
   structure would you choose and why?

A: A dictionary would be appropriate. Dictionaries provide O(1) average-case 
   lookup by key, support modification, and naturally represent key-value 
   relationships. Consider whether keys are hashable and whether insertion 
   order matters (preserved in Python 3.7+).

---

Q: Your application receives data from an external API. How should you handle 
   potential failures when processing this data?

A: Implement validation at the boundary (check data structure and types), use 
   specific exception handling for expected failures (network errors, malformed 
   data), provide meaningful error messages, consider retry logic for transient 
   failures, and log errors for debugging. Don't silently swallow exceptions.
```

---

### Q8 — Open-Ended Technical Question

**Presentation**: Open-Ended Technical Question  
**Status**: 🔵 Comprehensive synthesis

**Purpose**: Engage in comprehensive technical reasoning and discourse

**Core Structure**:
```
COMPLEX TOPIC
  ↓
"DISCUSS/ANALYZE/COMPARE..."
  ↓
SYNTHESIS
  ↓
COMPREHENSIVE UNDERSTANDING
```

**Mental Model**: "Can I engage in technical discourse about this topic?"

**Question Pattern**:
```
- DISCUSS THE RELATIONSHIP BETWEEN X, Y, AND Z
- COMPARE AND CONTRAST X AND Y
- ANALYZE HOW X AFFECTS Y IN CONTEXT OF Z
- EXPLAIN THE TRADEOFFS BETWEEN X AND Y
```

**vs All Previous Versions**:
- Q1-Q7: Focused questions
- Q8: **Comprehensive** technical discourse
- Requires synthesis across multiple concepts
- Most complex cognitive demand

**Answer Model**:
```
COMPREHENSIVE EXPLANATION
+
MULTIPLE PERSPECTIVES
+
RELATIONSHIPS/CONNECTIONS
+
TRADEOFFS/CONSIDERATIONS
+
EXAMPLES
```

**Examples from Corpus**:
```
Q: Discuss the relationship between Python's reference semantics, mutability, 
   and aliasing. How do these concepts interact, and what implications do they 
   have for programming?

A: Python variables are references to objects, not containers. When multiple 
   variables reference the same mutable object (aliasing), modifications through 
   one reference affect all references. Immutable objects avoid this because 
   operations create new objects rather than modifying existing ones. This 
   affects function argument passing, default arguments, and data structure 
   design. Understanding these relationships is crucial for predicting behavior 
   and avoiding bugs like unintended shared state.

---

Q: Compare exception handling strategies in Python. What are the tradeoffs 
   between specific exception handling, broad catch blocks, and allowing 
   exceptions to propagate?

A: Specific handling (except ValueError) provides precise control and prevents 
   masking unrelated errors, but requires knowledge of possible exceptions. 
   Broad handling (except Exception) catches more but risks swallowing important 
   errors. Propagation allows callers to handle exceptions but requires 
   coordination. Best practice often combines specific handling for expected 
   failures, letting unexpected exceptions propagate, and using finally for 
   cleanup. Context determines the right approach—library code often propagates, 
   application boundaries often handle.
```

---

## PART 5: VERSION DIFFERENTIATION MATRIX

| Aspect | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 |
|--------|----|----|----|----|----|----|----|----|
| **Core Focus** | Concept recall | Explanation | Reasoning | Hypothetical | Output prediction | Code analysis | Application | Synthesis |
| **Primary Question** | What is it? | Explain it | Why? | What if? | What output? | Why this behavior? | How to solve? | Discuss/analyze |
| **Cognitive Level** | Remember/Understand | Understand | Understand/Analyze | Apply/Analyze | Apply/Analyze | Analyze | Apply/Evaluate | Analyze/Evaluate/Create |
| **Answer Length** | Short | Paragraph | Paragraph | Paragraph | Specific output | Explanation | Solution strategy | Comprehensive |
| **Complexity** | Simple | Moderate | Moderate | Moderate | Moderate | Moderate-High | High | Highest |
| **Code Required** | No | No | No | No | Yes | Yes | Maybe | Maybe |
| **Scope** | Single concept | Single concept explained | Purpose/reason | Scenario exploration | Code execution | Code reasoning | Real scenario | Multiple concepts |

**Progression Summary**:
```
Q1: Recall basic concept
Q2: Explain concept in own words
Q3: Understand reasoning/purpose
Q4: Explore hypothetical scenarios
Q5: Predict code output
Q6: Analyze code reasoning
Q7: Apply to realistic scenarios
Q8: Synthesize comprehensive understanding
```

---

## PART 6: PROJECT LLM REQUIREMENTS

### JSON Schema Architecture

**Base Schema** (all versions):
```json
{
  "type": "question",
  "version": "Q1",
  "presentation": "Simple Concept Question",
  "content": {
    "question": {
      "text": "",
      "prompt": ""
    },
    "answer": {
      "text": "",
      "explanation": "",
      "keyIdea": ""
    }
  },
  "metadata": {
    "difficulty": "easy|medium|hard",
    "keyConcepts": [],
    "relatedBlocks": []
  },
  "presentationConfig": {
    "theme": "light",
    "primaryColor": "#f54a8d",
    "secondaryColor": "#0B1B3D",
    "revealPattern": "click|time|scroll"
  }
}
```

**Q1 Schema** (Simple Concept):
```json
{
  "type": "question",
  "version": "Q1",
  "content": {
    "question": {
      "text": "What is a Python list?",
      "prompt": "Think about the definition before revealing."
    },
    "answer": {
      "text": "An ordered, mutable sequence.",
      "keyIdea": "Lists preserve order and can be modified."
    },
    "selfCheck": {
      "enabled": true
    }
  }
}
```

**Q2 Schema** (Explain):
```json
{
  "type": "question",
  "version": "Q2",
  "content": {
    "question": {
      "text": "Explain how Python list indexing works.",
      "prompt": "Explain in your own words before revealing."
    },
    "modelExplanation": {
      "text": "[Paragraph explanation]",
      "keyPoints": [
        "Positive indices from start",
        "Negative indices from end"
      ]
    }
  }
}
```

**Q5 Schema** (Predict Output):
```json
{
  "type": "question",
  "version": "Q5",
  "content": {
    "code": {
      "language": "python",
      "source": "numbers = [1, 2, 3]\nnumbers.append(4)\nprint(numbers)"
    },
    "question": {
      "text": "What will this code produce?"
    },
    "output": {
      "text": "[1, 2, 3, 4]",
      "explanation": "append() adds 4 as single element"
    },
    "executionTrace": {
      "enabled": true,
      "steps": [...]
    }
  }
}
```

**Q8 Schema** (Open-Ended):
```json
{
  "type": "question",
  "version": "Q8",
  "content": {
    "question": {
      "text": "Discuss the relationship between..."
    },
    "modelAnswer": {
      "sections": [
        {
          "heading": "Reference Semantics",
          "content": "..."
        },
        {
          "heading": "Mutability",
          "content": "..."
        }
      ],
      "summary": "..."
    }
  }
}
```

### Reveal Answer Interaction

```javascript
// Conceptual interaction model
{
  state: "question" | "revealed",
  onReveal: () => {
    setState("revealed");
    showAnswer();
    optionallyShowSelfCheck();
  }
}
```

---

## PART 7: COMPONENT CATALOG

### Reusable Components

1. **QuestionHeader** (all versions)
   - Eyebrow "QUESTIONBLOCK"
   - Version-specific title
   - Context description

2. **QuestionCard** (all versions)
   - Question label
   - Question text
   - Optional prompt
   - Reveal button

3. **AnswerCard** (all versions)
   - Answer label
   - Answer text/explanation
   - Key idea section

4. **CodeBlock** (Q5, Q6, Q7, Q8)
   - Syntax-highlighted code
   - Language identifier
   - Line numbers optional

5. **OutputDisplay** (Q5)
   - Output label
   - Formatted output
   - Execution trace

6. **ExecutionTrace** (Q5, Q6)
   - Step-by-step list
   - Visual flow
   - Concept connections

7. **ModelExplanation** (Q2, Q6, Q8)
   - Paragraph text
   - Key points list
   - Section headings

8. **SelfCheckControl** (Q1, Q2)
   - "Did you know this?" prompt
   - Yes/Need Review buttons
   - Optional reflection note

9. **RevealButton** (all versions)
   - Primary action button
   - "Reveal Answer" label
   - State management

### Atomic Design

```
Atoms:
- Button (reveal, self-check)
- Label (QUESTION, ANSWER)
- Code inline
- Icon (optional)

Molecules:
- Question prompt (label + text + hint)
- Answer block (label + text + explanation)
- Code snippet (language + code + caption)
- Self-check control (prompt + buttons)

Organisms:
- Question card
- Answer card
- Code prediction question
- Scenario question
- Open-ended question

Templates:
- Q1 layout
- Q2 layout
- Q3 layout
- Q4 layout
- Q5 layout
- Q6 layout
- Q7 layout
- Q8 layout

Pages:
- Question block instances
```

---

## PART 8: PATTERN CATALOG

### Educational Patterns

1. **Active Recall Pattern**
   - Question → Think → Reveal → Check
   - Supports retrieval practice
   - Strengthens memory

2. **Reveal Answer Pattern**
   - Default: question visible, answer hidden
   - User action triggers reveal
   - Encourages thinking before seeing answer

3. **Self-Check Pattern**
   - Optional post-reveal reflection
   - "Did you know this?"
   - Learning feedback, not grading

4. **Progressive Complexity**
   - Q1: Simplest (recall)
   - Q8: Most complex (synthesis)
   - Learner can engage at appropriate level

5. **Code Prediction Pattern** (Q5)
   - Show code
   - Request output prediction
   - Reveal actual output + trace
   - Reinforces mental execution model

6. **Scenario Application Pattern** (Q7)
   - Present realistic scenario
   - Request solution approach
   - Provide model solution
   - Bridges theory to practice

### Interaction Patterns

1. **Reveal Interaction**
   ```
   [Question visible]
   [Reveal button]
     ↓ click
   [Answer appears]
   [Optional self-check]
   ```

2. **Code Trace Interaction** (Q5, Q6)
   ```
   [Code displayed]
   [Predict prompt]
   [Reveal button]
     ↓ click
   [Output shown]
   [Execution trace]
   [Concept explanation]
   ```

3. **Progressive Disclosure** (Q8)
   ```
   [Question]
   [Reveal button]
     ↓
   [Model answer sections]
   [Expandable details]
   ```

### Content Patterns

**Question Formulation**:
- Q1: "What is X?"
- Q2: "Explain X"
- Q3: "Why X?"
- Q4: "What if X?"
- Q5: "What output?"
- Q6: "Why this behavior?"
- Q7: "How to solve?"
- Q8: "Discuss/analyze X"

**Answer Structure**:
- Q1: Short answer + key idea
- Q2: Explanation + key points
- Q3: Reasoning + purpose
- Q4: Consequence + impact
- Q5: Output + trace + concept
- Q6: Reasoning + underlying concept
- Q7: Approach + solution + considerations
- Q8: Comprehensive sections + synthesis

---

## PART 9: COMPOSITION MATRIX

### Version Composition

| Component | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 |
|-----------|----|----|----|----|----|----|----|----|
| Header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Question Card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Answer Card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Block | ❌ | ❌ | ❌ | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| Output Display | ❌ | ❌ | ❌ | ❌ | ✅ | 🟡 | ❌ | ❌ |
| Execution Trace | ❌ | ❌ | ❌ | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| Key Idea | ✅ | 🟡 | 🟡 | 🟡 | ✅ | ✅ | 🟡 | 🟡 |
| Model Explanation | ❌ | ✅ | 🟡 | 🟡 | 🟡 | ✅ | ✅ | ✅ |
| Self-Check | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Reveal Button | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend:
- ✅ = Required/Primary
- 🟡 = Optional/Contextual
- ❌ = Not typically included

---

## PART 10: UBRC (UNIVERSAL BLOCK REFERENCE CODE)

### UBRC Designation
**UBRC-Q** (QuestionBlock)

### Version Codes
- **UBRC-Q-01**: Q1 — Simple Concept Question
- **UBRC-Q-02**: Q2 — Explain in Your Own Words
- **UBRC-Q-03**: Q3 — Why Question
- **UBRC-Q-04**: Q4 — What Happens If...?
- **UBRC-Q-05**: Q5 — Predict the Output
- **UBRC-Q-06**: Q6 — Code Reasoning
- **UBRC-Q-07**: Q7 — Scenario-Based Question
- **UBRC-Q-08**: Q8 — Open-Ended Technical Question

### Block Position
- **Sequence**: Block #12 of 18
- **After**: SummaryBlock (Block #11)
- **Before**: ExerciseBlock (Block #13, per completion statement)

### Critical Identity
**QuestionBlock ≠ QuizBlock**
- QuestionBlock: Learning through active thinking
- QuizBlock: Formal assessment with scoring

### Version Relationship
```
Q1 ← Simplest (single concept recall)
 ↓
Q2 ← Explanation required
 ↓
Q3 ← Reasoning/purpose
 ↓
Q4 ← Hypothetical scenarios
 ↓
Q5 ← Code output prediction
 ↓
Q6 ← Code behavior reasoning
 ↓
Q7 ← Practical scenario application
 ↓
Q8 ← Comprehensive synthesis (most complex)
```

---

## PART 11: ILS (INSTRUCTIONAL LAYER SYSTEM)

### Instructional Layers Present

**Layer 1: Presentation**
- Question cards with clear typography
- Answer cards with structured explanations
- Code blocks with syntax highlighting
- Reveal button as primary interaction
- SUIA color system (minimal decoration)

**Layer 2: Interaction**
- Reveal answer pattern (primary)
- Optional self-check buttons
- Progressive disclosure (Q8)
- State management (question → revealed)

**Layer 3: Semantic Meaning**
- Question = learning opportunity (not assessment)
- Reveal = active choice (not automatic)
- Self-check = reflection (not grading)
- Answer = educational feedback (not evaluation)

**Layer 4: Educational Flow**
- Q1→Q8 cognitive progression
- Bloom's taxonomy alignment
- Retrieval practice support
- Active recall encouragement

**Layer 5: Contextual Adaptation**
- Version selected based on learning objective
- Code examples language-specific
- Scenarios contextually relevant
- Multiple instances possible per tutorial

---

## PART 12: LSNB (LEARNING SEQUENCE NAVIGATION BOUNDARY)

### Entry Points by Version

**Q1 Entry**: After concept introduction, basic understanding check

**Q2 Entry**: After concept explanation, test internalization

**Q3 Entry**: After rule/principle teaching, probe reasoning

**Q4 Entry**: After concept mastery, explore boundaries

**Q5 Entry**: After code teaching, test execution model

**Q6 Entry**: After code examples, test deep comprehension

**Q7 Entry**: After concept completion, test practical application

**Q8 Entry**: After comprehensive topic, test synthesis

### Exit Criteria by Version

**Q1 Exit**: Can recall basic concept

**Q2 Exit**: Can explain in own words

**Q3 Exit**: Understands reasoning/purpose

**Q4 Exit**: Can predict consequences

**Q5 Exit**: Can trace code execution mentally

**Q6 Exit**: Can analyze code behavior

**Q7 Exit**: Can apply to realistic scenarios

**Q8 Exit**: Can synthesize comprehensive understanding

### Position in Tutorial

**After SummaryBlock**:
- Learner reviewed concepts
- Now tests understanding through questions
- Active recall reinforces learning

**Before ExerciseBlock**:
- Questions test understanding
- Exercises provide practice
- Natural progression: Understand → Practice

**Within Tutorial Flow**:
- Multiple questions possible
- Different versions for different purposes
- Can appear after each major concept

---

## PART 13: RSSB (RESPONSIVE STATE-SPACE BOUNDARY)

### Desktop Responsive States

**All Versions**:
- Breakpoint: ≥1024px
- Layout: Centered question card (max-width for readability)
- Button: Centered below question
- Answer: Appears below question after reveal
- Code: Full-width within card

### Tablet/Mobile Responsive States

**All Versions**:
- Breakpoint: <1024px
- Layout: Full-width cards, stacked
- Button: Full-width or centered
- Answer: Full-width reveal
- Code: Horizontal scroll if needed, or wrap

### Interaction States

**Question State**:
- Question visible
- Answer hidden
- Reveal button enabled

**Revealed State**:
- Question remains visible
- Answer appears
- Self-check appears (if enabled)
- Reveal button hidden or disabled

### Accessibility

**Keyboard Navigation**:
- Tab to reveal button
- Enter/Space to activate
- Tab through self-check options

**Screen Reader**:
- Question announced
- Button role/label clear
- Answer announced on reveal
- State changes communicated

---

## PART 14: UNIVERSAL TUTORIAL PAGE (INTEGRATION)

### Tutorial Page Composition

**QuestionBlock Position**:
```
[Tutorial Header]
[Learning Objectives]
    ↓
[Teaching Blocks]
├── IntroductionBlock
├── DefinitionBlock
├── CodeBlock
├── ExecutionBlock
├── MemoryBlock
├── MistakeBlock
├── BestPracticeBlock
├── SummaryBlock
    ↓
├── **QuestionBlock** ← Position #12
│   ├── Q1 (concept check)
│   ├── Q2 (explanation)
│   ├── Q5 (code prediction)
│   └── Q7 (scenario)
    ↓
[Practice Blocks]
├── ExerciseBlock
└── [Other blocks...]
```

### Integration Strategy

**After SummaryBlock**:
- Natural checkpoint after content review
- "Review then test understanding" flow
- Questions reinforce summarized concepts

**Before ExerciseBlock**:
- Understanding verified before practice
- Questions → Exercises → Tasks progression
- Cognitive before kinesthetic

**Within Tutorial**:
- Q1 after basic concepts
- Q2 after explanations
- Q5 after code examples
- Q7 after practical teaching
- Q8 at end of major topic

---

## PART 15: COMPOSER (AUTHORING)

### Content Authoring Workflow

**Q1 Authoring**:
```
1. Identify single core concept
2. Write simple "What is/does X?" question
3. Write short answer (1-2 sentences)
4. Add key idea explanation
5. Verify one-concept focus
```

**Q2 Authoring**:
```
1. Select concept requiring explanation
2. Write "Explain X" prompt
3. Create model explanation (paragraph)
4. Extract key points (optional list)
5. Verify explanation clarity
```

**Q5 Authoring**:
```
1. Write focused code snippet
2. Ensure code demonstrates concept
3. Determine correct output
4. Create execution trace
5. Explain key concept illustrated
```

**Q8 Authoring**:
```
1. Identify complex topic requiring synthesis
2. Write open-ended discussion prompt
3. Create comprehensive model answer
4. Structure into sections/perspectives
5. Include relationships/tradeoffs
6. Provide synthesis/summary
```

### Quality Checklist

```
□ Question clear and focused
□ Appropriate for version type
□ Answer technically accurate
□ Explanation helpful
□ Difficulty appropriate
□ Supports learning (not just testing)
□ Reveal pattern implemented
□ No grading/scoring language
□ SUIA design followed
□ Accessible markup
```

---

## PART 16: PRODUCTION CORRELATION

### Current Production Implementation

**Status**: NOT YET INVESTIGATED

**Expected Locations**:
- `apps/*/src/components/blocks/` (block components)
- `packages/shared/src/types/` (TypeScript interfaces)
- Question/answer state management
- Reveal interaction logic

**Investigation Required**:
1. Search for "Question" or "question" component references
2. Check reveal button implementation
3. Verify state management (question → revealed)
4. Test self-check functionality
5. Review code syntax highlighting (Q5, Q6)
6. Validate accessibility (keyboard, screen reader)

---

## PART 17: EVIDENCE CLASSIFICATION

### VERIFIED Evidence

**Block Identity**:
- ✅ Family name: QuestionBlock
- ✅ Block position: #12 in 18-block sequence
- ✅ Version count: 8 (Q1-Q8)
- ✅ All 8 versions fully documented in 8642-line corpus
- ✅ Completion statement: "QuestionBlock is now fully defined: 8 versions, Q1–Q8"
- ✅ Next block identified: ExerciseBlock (Block #13, EX1-EX8)

**Version Specifications**:
- ✅ Q1: Simple Concept Question
- ✅ Q2: Explain in Your Own Words
- ✅ Q3: Why Question
- ✅ Q4: What Happens If...?
- ✅ Q5: Predict the Output
- ✅ Q6: Code Reasoning
- ✅ Q7: Scenario-Based Question
- ✅ Q8: Open-Ended Technical Question

**Critical Distinction**:
- ✅ QuestionBlock ≠ QuizBlock explicitly documented
- ✅ Learning vs Assessment distinction clear

**HTML Structure**:
- ✅ Reveal answer pattern documented
- ✅ Question/answer card structures
- ✅ Optional self-check pattern

**SUIA Colors**:
- ✅ Primary: #F54A8D
- ✅ Secondary: #0B1B3D
- ✅ Light theme

### NO GAPS DETECTED

**Version Completeness**: All 8 versions (Q1-Q8) fully documented ✅

**Achievement**: QuestionBlock is FOURTH complete family with all documented versions present and no missing versions in sequence.

---

## SUMMARY

**QuestionBlock** (UBRC-Q, Block #12) is a complete 8-version educational family engaging learners through progressively complex questions:

1. **Q1** — Simple Concept Question (recall)
2. **Q2** — Explain in Your Own Words (explanation)
3. **Q3** — Why Question (reasoning)
4. **Q4** — What Happens If...? (hypothetical)
5. **Q5** — Predict the Output (code prediction)
6. **Q6** — Code Reasoning (code analysis)
7. **Q7** — Scenario-Based Question (application)
8. **Q8** — Open-Ended Technical Question (synthesis)

**Distinguishing Features**:
- **Learning-first** (NOT assessment/grading)
- Reveal answer pattern (active recall)
- Optional self-check (reflection, not scoring)
- Cognitive progression (Bloom's taxonomy)
- QuestionBlock ≠ QuizBlock (critical distinction)

**Educational Model**: Recall → Explain → Reason → Predict → Analyze → Apply → Synthesize

**SUIA Colors**: Primary #F54A8D, Secondary #0B1B3D

**Next Block**: ExerciseBlock (Block #13, EX1-EX8 expected)

**Status**: Complete family documentation ✅ | Production implementation NOT YET INVESTIGATED ⚠️

---

**ANALYSIS COMPLETE**: FILE 12 — QuestionBlock  
**Next Investigation**: FILE 13 — ExerciseBlock (EX1-EX8 expected)

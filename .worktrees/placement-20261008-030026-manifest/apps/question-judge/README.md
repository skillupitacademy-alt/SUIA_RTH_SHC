# Question Duplicate Judge

Private FastAPI microservice for detecting duplicate questions in the SkillHub question bank.

## Overview

This service evaluates whether two questions are duplicates based on the principle:

> **Two questions are duplicates when they assess substantially the same knowledge objective, require substantially the same reasoning or execution process, and lead the candidate toward the same answer determination, even if wording, variable names, formatting, or surface context differ.**

## Architecture

### Multi-Signal Analysis

The judge evaluates 7 signals to determine duplication:

1. **Cross-encoder relevance score** - Primary semantic signal
2. **Code Similarity** - Normalized structural comparison
3. **Concept Match** - Same knowledge area (e.g., `javascript_closure_lexical_scope`)
4. **Objective Match** - Same learning goal (e.g., `javascript_closure_predict_output`)
5. **Type Match** - Same question format (MCQ, code_mcq, etc.)
6. **Reasoning Match** - Requires same thought process (heuristic)
7. **Answer Objective Match** - Leads to same answer (heuristic)

### Decision Examples

| Existing Question | Candidate Question | Verdict | Reason |
|-------------------|-------------------|---------|--------|
| "What does this closure output?" | "Which value is logged by this closure?" | 🔴 **DUPLICATE** | Same objective, equivalent reasoning |
| "What does this closure output?" | "Why does the closure retain x?" | 🟢 **NEW** | Different objectives (predict vs explain) |
| "What does this closure output?" | "Which variable is captured?" | 🟢 **NEW** | Different objectives (output vs identification) |
| "What does this closure output?" | Same question, variables renamed | 🔴 **DUPLICATE** | Superficial changes only |

## API Contract

### Endpoint

```
POST /judge/question
```

### Request

```json
{
  "existing": {
    "text": "What will be printed to the console?",
    "type": "code_mcq",
    "concept_key": "javascript.closures.lexical-scope",
    "objective_key": "javascript.closures.predict-output",
    "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
  },
  "candidate": {
    "text": "Which value is logged by the following code?",
    "type": "code_mcq",
    "concept_key": "javascript.closures.lexical-scope",
    "objective_key": "javascript.closures.predict-output",
    "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
  }
}
```

### Response

```json
{
  "duplicate": true,
  "confidence": 0.94,
  "reason": "Both questions assess the same learning objective with equivalent reasoning requirements.",
  "signals": {
    "text_similarity": 0.91,
    "code_similarity": 1.0,
    "concept_match": true,
    "objective_match": true,
    "type_match": true,
    "reasoning_match": true,
    "answer_objective_match": true
  }
}
```

## Model

### Cross-Encoder

- **Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2`
- **Size**: ~80MB
- **Performance**: Fast on CPU (sub-second inference)
- **Fallback**: Token overlap similarity if model unavailable

### Why Cross-Encoder?

Cross-encoders are specifically designed for sentence-pair similarity tasks, making them superior to:
- Embedding-based cosine similarity (separate encoding)
- LLM text comparison (slower, non-deterministic)
- Simple token overlap (too coarse)

## Deployment

### Environment Variables

```bash
# Optional authentication
QUESTION_JUDGE_SHARED_SECRET=your-secret-key

# Port (default: 8000)
PORT=8000

# Environment
ENV=production
```

### Docker

```bash
# Build
docker build -t question-judge:latest .

# Run
docker run -p 8000:8000 \
  -e QUESTION_JUDGE_SHARED_SECRET=your-secret \
  question-judge:latest
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run with hot reload
ENV=development python -m uvicorn app.main:app --reload --port 8000
```

### Health Check

```bash
curl http://localhost:8000/health
```

## Integration with Main API

The main API server (`apps/api-server`) calls this service via:

```typescript
// apps/api-server/src/modules/intelligence/question-judge.client.ts
const verdict = await judgeQuestion({
  existing: { text, type, concept_key, objective_key, code },
  candidate: { text, type, concept_key, objective_key, code }
});

if (!verdict.available) {
  // Judge unavailable → send to REVIEW (never auto-accept)
}
```

### Degradation Policy

When this service is unavailable:
- Semantic scores 0.90–0.95 → **REVIEW** (human decision)
- **NEVER** automatically accept as NEW
- Main pipeline continues to function

## Calibration

### Threshold Tuning

The duplicate decision thresholds can be tuned based on real-world results:

```python
# In judge.py, adjust these decision boundaries:
if text_sim >= 0.95:  # Very high similarity
    duplicate = True
elif text_sim >= 0.90 and concept_match:  # High + concept
    duplicate = True
```

### Evaluation Dataset

Before adjusting thresholds, create a labeled test set with categories:

1. **EXACT_DUPLICATE** - Same text, minor rewording
2. **REWORDED_DUPLICATE** - Different words, same objective
3. **SAME_CODE_DIFFERENT_OBJECTIVE** - Identical code, different questions
4. **SAME_CONCEPT_DIFFERENT_OBJECTIVE** - Related but distinct
5. **SAME_TOPIC_DIFFERENT_CONCEPT** - Broader topic area
6. **SUPERFICIALLY_SIMILAR_BUT_DIFFERENT** - Look alike, actually different
7. **GENUINELY_NEW** - Clearly distinct

Run the judge against this dataset and measure:
- **False Positives**: Valid questions rejected as duplicates
- **False Negatives**: Duplicates accepted as new
- **Precision/Recall**: Overall accuracy

## Performance

- **Latency**: < 200ms average (CPU)
- **Throughput**: ~50 requests/second (single core)
- **Memory**: ~500MB with model loaded
- **Scalability**: Stateless, horizontally scalable

## Future Enhancements

### Optional LLM Reasoning

Add Ollama/vLLM integration for richer explanations:

```python
# After cross-encoder decision, optionally call local LLM
if duplicate and confidence < 0.95:
    explanation = await generate_explanation_with_llm(existing, candidate, signals)
```

### Fine-Tuning

Train on SkillHub-specific question pairs:

```python
# Collect labeled pairs from admin decisions
training_data = [
  (question_a, question_b, is_duplicate),
  ...
]

# Fine-tune cross-encoder on domain-specific data
model.fit(training_data)
```

## Maintenance

### Model Updates

Update the cross-encoder model:

```python
# In app/model.py
_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-12-v2"  # Larger, more accurate
```

### Logging

Logs include:
- Request/response for each judgment
- Model inference timing
- Signal values for debugging
- Errors with stack traces

### Monitoring

Key metrics to track:
- `judge.request.count` - Total requests
- `judge.request.latency` - Response time
- `judge.duplicate.rate` - % marked as duplicate
- `judge.error.rate` - Service errors

## License

Internal SkillHub service - not for public distribution.

## Support

For issues or questions, contact the platform engineering team.

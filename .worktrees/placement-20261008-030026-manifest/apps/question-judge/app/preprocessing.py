"""
Normalization utilities for the question judge.

The normalization contract MUST stay in sync with the TypeScript side:
    apps/api-server/src/modules/question/question-hash.ts
    packages/db/migrations/0027_add_question_duplicate_detection.sql

Contract: lower + trim + collapse all whitespace runs to a single space.
"""

import re

_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(text: str | None) -> str:
    """Normalize question text: lower, trim, collapse whitespace."""
    if text is None:
        return ""
    return _WHITESPACE_RE.sub(" ", text.lower().strip())


def normalize_code(code: str | None) -> str:
    """Whitespace-insensitive normalized code for structural comparison."""
    if code is None:
        return ""
    return _WHITESPACE_RE.sub(" ", code.lower().strip())


def normalize_concept_key(concept_key: str | None) -> str:
    """
    Canonical concept key. Treats ".", "-", "/" and whitespace as equivalents,
    so "javascript.closures.lexical-scope" == "javascript_closures_lexical_scope".
    """
    if concept_key is None:
        return ""
    value = concept_key.lower().strip()
    value = _WHITESPACE_RE.sub("_", value)
    value = re.sub(r"[.\-/]+", "_", value)
    value = re.sub(r"_+", "_", value)
    return value.strip("_")


def normalize_objective_key(objective_key: str | None) -> str:
    """
    Canonical objective key (same normalization as concept_key).
    Example: "javascript.closures.predict-output" → "javascript_closures_predict_output"
    """
    return normalize_concept_key(objective_key)


def normalize_type(question_type: str | None) -> str:
    """Normalize question type for equality comparison."""
    if question_type is None:
        return ""
    return question_type.lower().strip().replace(" ", "_")


def token_overlap_similarity(a: str, b: str) -> float:
    """Deterministic coarse text similarity fallback when the cross-encoder
    model is not installed / not loadable. Jaccard over normalized tokens."""
    tokens_a = set(normalize_text(a).split())
    tokens_b = set(normalize_text(b).split())
    if not tokens_a or not tokens_b:
        return 0.0
    union = tokens_a | tokens_b
    return len(tokens_a & tokens_b) / len(union)

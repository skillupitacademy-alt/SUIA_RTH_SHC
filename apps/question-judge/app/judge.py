"""
Core duplicate judgment logic.

DUPLICATE DEFINITION:
Two questions are duplicates when they assess substantially the same
knowledge objective, require substantially the same reasoning or execution
process, and lead the candidate toward the same answer determination,
even if wording, variable names, formatting, or surface context differ.
"""

import logging
from .model import compute_similarity
from .preprocessing import (
    normalize_text,
    normalize_code,
    normalize_concept_key,
    normalize_type,
)
from .schemas import JudgeRequest, JudgeResponse, JudgeSignals

logger = logging.getLogger(__name__)


def judge_questions(request: JudgeRequest) -> JudgeResponse:
    """
    Evaluate whether two questions are duplicates.
    
    Uses multi-signal analysis:
    1. Cross-encoder text similarity (primary signal)
    2. Code similarity (when code present)
    3. Concept match (same knowledge area)
    4. Objective match (same learning goal)
    5. Type match (same question format)
    6. Reasoning heuristic (inferred from text + code)
    7. Answer objective heuristic (inferred from question structure)
    """
    existing = request.existing
    candidate = request.candidate

    # ── Signal 1: Text similarity (cross-encoder) ──────────────────────
    text_sim = compute_similarity(existing.text, candidate.text)

    # ── Signal 2: Code similarity ──────────────────────────────────────
    code_sim = 0.0
    if existing.code and candidate.code:
        norm_existing_code = normalize_code(existing.code)
        norm_candidate_code = normalize_code(candidate.code)
        if norm_existing_code and norm_candidate_code:
            # Exact normalized match
            if norm_existing_code == norm_candidate_code:
                code_sim = 1.0
            else:
                # Token overlap for structural similarity
                code_sim = compute_similarity(existing.code, candidate.code)

    # ── Signal 3: Concept match ────────────────────────────────────────
    concept_match = False
    if existing.concept_key and candidate.concept_key:
        norm_existing_concept = normalize_concept_key(existing.concept_key)
        norm_candidate_concept = normalize_concept_key(candidate.concept_key)
        concept_match = norm_existing_concept == norm_candidate_concept

    # ── Signal 4: Objective match (strong signal) ──────────────────────
    objective_match = False
    if existing.objective_key and candidate.objective_key:
        norm_existing_obj = normalize_concept_key(existing.objective_key)
        norm_candidate_obj = normalize_concept_key(candidate.objective_key)
        objective_match = norm_existing_obj == norm_candidate_obj

    # ── Signal 5: Type match ───────────────────────────────────────────
    type_match = False
    if existing.type and candidate.type:
        type_match = normalize_type(existing.type) == normalize_type(candidate.type)

    # ── Signal 6: Reasoning match (heuristic) ──────────────────────────
    # Same code + high text similarity → likely same reasoning
    reasoning_match = False
    if code_sim >= 0.95 and text_sim >= 0.85:
        reasoning_match = True
    elif objective_match and text_sim >= 0.80:
        reasoning_match = True

    # ── Signal 7: Answer objective match (heuristic) ───────────────────
    # Same objective + same type + high similarity → same answer goal
    answer_objective_match = False
    if objective_match and type_match and text_sim >= 0.85:
        answer_objective_match = True
    elif code_sim >= 0.98 and concept_match:
        # Identical code + same concept → likely same answer
        answer_objective_match = True

    # ── Duplicate decision logic ───────────────────────────────────────
    
    # Very high text similarity → duplicate regardless of other signals
    if text_sim >= 0.95:
        duplicate = True
        confidence = text_sim
        reason = "Questions are semantically identical with very high text similarity."
    
    # Strong objective + reasoning alignment
    elif objective_match and reasoning_match and text_sim >= 0.85:
        duplicate = True
        confidence = min(0.95, (text_sim + 0.95) / 2)
        reason = "Both questions assess the same learning objective with equivalent reasoning requirements."
    
    # Identical code + same concept + borderline text similarity
    elif code_sim >= 0.98 and concept_match and text_sim >= 0.80:
        duplicate = True
        confidence = min(0.93, (code_sim + text_sim) / 2)
        reason = "Questions use identical code structures to test the same concept, despite minor wording differences."
    
    # High text similarity + concept match (no objective available)
    elif text_sim >= 0.90 and concept_match and not objective_match:
        duplicate = True
        confidence = text_sim
        reason = "Questions test the same concept with very similar wording and likely assess the same knowledge."
    
    # Borderline text + strong objective signal
    elif text_sim >= 0.85 and objective_match and answer_objective_match:
        duplicate = True
        confidence = 0.88
        reason = "Questions target the same learning objective and lead to equivalent answer determinations."
    
    # Different objectives despite similar text → NOT duplicate
    elif text_sim >= 0.85 and existing.objective_key and candidate.objective_key and not objective_match:
        duplicate = False
        confidence = 0.85
        reason = "Questions have similar wording but assess different learning objectives (predict-output vs explain-mechanism)."
    
    # Same code but low text similarity → NOT duplicate (different questions about same code)
    elif code_sim >= 0.95 and text_sim < 0.75:
        duplicate = False
        confidence = 0.82
        reason = "Questions use similar code but ask fundamentally different things (e.g., 'What is output?' vs 'Why does this work?')."
    
    # Low similarity overall → clearly new
    elif text_sim < 0.80:
        duplicate = False
        confidence = 1.0 - text_sim
        reason = "Questions are semantically distinct and assess different knowledge."
    
    # Borderline case → conservative duplicate detection
    else:
        # Aggregate signals for final decision
        signal_score = (
            text_sim * 0.5 +
            code_sim * 0.2 +
            (0.15 if objective_match else 0.0) +
            (0.10 if concept_match else 0.0) +
            (0.05 if reasoning_match else 0.0)
        )
        
        if signal_score >= 0.88:
            duplicate = True
            confidence = signal_score
            reason = "Aggregate assessment signals indicate the questions assess substantially the same knowledge."
        else:
            duplicate = False
            confidence = 0.80
            reason = "Questions show some similarity but provide materially different assessment opportunities."

    signals = JudgeSignals(
        text_similarity=round(text_sim, 3),
        code_similarity=round(code_sim, 3),
        concept_match=concept_match,
        objective_match=objective_match,
        type_match=type_match,
        reasoning_match=reasoning_match,
        answer_objective_match=answer_objective_match,
    )

    return JudgeResponse(
        duplicate=duplicate,
        confidence=round(confidence, 3),
        reason=reason,
        signals=signals,
    )

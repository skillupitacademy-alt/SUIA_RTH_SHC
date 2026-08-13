"""
Request/response schemas for the question duplicate judge API.

MUST stay synchronized with TypeScript contract:
    apps/api-server/src/modules/intelligence/question-judge.client.ts
"""

from pydantic import BaseModel, Field


class QuestionInput(BaseModel):
    """A single question to compare."""

    text: str = Field(..., description="Question text (normalized)")
    type: str | None = Field(None, description="Question type (mcq, code_mcq, etc.)")
    concept_key: str | None = Field(
        None, description="Concept being tested (e.g. 'javascript_closure_lexical_scope')"
    )
    objective_key: str | None = Field(
        None,
        description="Learning objective (e.g. 'javascript_closure_predict_output')",
    )
    code: str | None = Field(None, description="Code snippet if applicable")


class JudgeRequest(BaseModel):
    """Request payload for duplicate judgment."""

    existing: QuestionInput = Field(..., description="Existing question in the bank")
    candidate: QuestionInput = Field(..., description="New candidate question")


class JudgeSignals(BaseModel):
    """Detailed signals that contributed to the duplicate decision."""

    text_similarity: float = Field(
        ..., ge=0.0, le=1.0, description="Cross-encoder text similarity"
    )
    code_similarity: float = Field(
        ..., ge=0.0, le=1.0, description="Normalized code similarity"
    )
    concept_match: bool = Field(..., description="Same concept_key")
    objective_match: bool = Field(..., description="Same objective_key")
    type_match: bool = Field(..., description="Same question type")
    reasoning_match: bool = Field(
        ..., description="Requires same reasoning process (heuristic)"
    )
    answer_objective_match: bool = Field(
        ..., description="Leads to same answer determination (heuristic)"
    )


class JudgeResponse(BaseModel):
    """Response from the duplicate judge."""

    duplicate: bool = Field(
        ...,
        description="True when questions assess substantially the same knowledge objective",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence in the duplicate determination [0, 1]",
    )
    reason: str = Field(
        ...,
        description="Human-readable explanation of why the questions are/aren't duplicates",
    )
    signals: JudgeSignals = Field(..., description="Detailed signal breakdown")

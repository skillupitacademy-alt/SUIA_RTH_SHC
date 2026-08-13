"""
FastAPI service for question duplicate detection.

This is a private microservice that evaluates whether two questions are
duplicates based on multi-signal analysis including text similarity,
code comparison, concept/objective alignment, and reasoning requirements.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from .judge import judge_questions
from .schemas import JudgeRequest, JudgeResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Shared secret for authentication
SHARED_SECRET = os.getenv("QUESTION_JUDGE_SHARED_SECRET", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle handler - preload model on startup."""
    logger.info("Question Judge service starting up...")
    
    # Preload the cross-encoder model
    from .model import load_model
    load_model()
    
    logger.info("Question Judge service ready")
    yield
    logger.info("Question Judge service shutting down")


app = FastAPI(
    title="Question Duplicate Judge",
    description="Private microservice for detecting duplicate questions in the SkillHub question bank",
    version="1.0.0",
    lifespan=lifespan,
)


def verify_auth(x_judge_secret: str | None) -> None:
    """Verify shared secret authentication."""
    if SHARED_SECRET and (not x_judge_secret or x_judge_secret != SHARED_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy", "service": "question-judge"}


@app.post("/judge/question", response_model=JudgeResponse)
async def judge_question_endpoint(
    request: JudgeRequest,
    x_judge_secret: str | None = Header(None, alias="X-Judge-Secret"),
) -> JudgeResponse:
    """
    Evaluate whether two questions are duplicates.
    
    **Authentication**: Requires X-Judge-Secret header when QUESTION_JUDGE_SHARED_SECRET is set.
    
    **Decision Criteria**:
    - Same knowledge objective
    - Same reasoning process
    - Same answer determination
    
    Even if wording, variable names, or formatting differ.
    """
    verify_auth(x_judge_secret)
    
    try:
        result = judge_questions(request)
        logger.info(
            f"Judge verdict: duplicate={result.duplicate}, confidence={result.confidence:.3f}"
        )
        return result
    except Exception as e:
        logger.error(f"Judge request failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal judge error")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler to prevent service crashes."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "duplicate": False,
            "confidence": 0.0,
            "reason": "judge_internal_error",
            "signals": {
                "text_similarity": 0.0,
                "code_similarity": 0.0,
                "concept_match": False,
                "objective_match": False,
                "type_match": False,
                "reasoning_match": False,
                "answer_objective_match": False,
            },
        },
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENV") == "development",
    )

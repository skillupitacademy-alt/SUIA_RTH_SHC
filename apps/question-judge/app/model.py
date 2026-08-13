"""
Cross-encoder model loader and inference.

Uses a lightweight sentence-transformer cross-encoder for deterministic
duplicate scoring without external API dependencies.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

_MODEL_INSTANCE: Optional[object] = None
_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"  # ~80MB, fast on CPU


def load_model():
    """
    Lazy-load the cross-encoder model.

    Falls back to token overlap similarity if sentence-transformers is unavailable.
    This allows the service to degrade gracefully in resource-constrained environments.
    """
    global _MODEL_INSTANCE

    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    try:
        from sentence_transformers import CrossEncoder

        logger.info(f"Loading cross-encoder model: {_MODEL_NAME}")
        _MODEL_INSTANCE = CrossEncoder(_MODEL_NAME, max_length=512)
        logger.info("Cross-encoder model loaded successfully")
        return _MODEL_INSTANCE
    except ImportError:
        logger.warning(
            "sentence-transformers not installed - falling back to token overlap"
        )
        _MODEL_INSTANCE = None
        return None
    except Exception as e:
        logger.error(f"Failed to load cross-encoder model: {e}")
        _MODEL_INSTANCE = None
        return None


def compute_similarity(text_a: str, text_b: str) -> float:
    """
    Compute semantic similarity between two texts using the cross-encoder.

    Returns a score in [0, 1] where:
        0.0 = completely different
        1.0 = semantically identical

    Falls back to token overlap if model is unavailable.
    """
    from .preprocessing import token_overlap_similarity

    model = load_model()

    if model is None:
        # Fallback: deterministic token overlap
        return token_overlap_similarity(text_a, text_b)

    try:
        # Cross-encoder returns logits; convert to probability via sigmoid
        import math

        score = model.predict([(text_a, text_b)])[0]
        # Sigmoid normalization: logit → [0, 1]
        probability = 1.0 / (1.0 + math.exp(-score))
        return float(probability)
    except Exception as e:
        logger.error(f"Cross-encoder inference failed: {e}")
        return token_overlap_similarity(text_a, text_b)

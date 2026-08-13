"""
Test script for the question judge service.

Run this after starting the service to verify it's working correctly.
"""

import requests
import json

BASE_URL = "http://localhost:8000"
SHARED_SECRET = "dev-secret-change-in-production"

def test_health():
    """Test health check endpoint."""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("✅ Health check passed")


def test_exact_duplicate():
    """Test detection of exact duplicates (minor rewording)."""
    print("\n=== Testing Exact Duplicate ===")
    payload = {
        "existing": {
            "text": "What will be printed to the console when this code executes?",
            "type": "code_mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.predict-output",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        },
        "candidate": {
            "text": "Which value is logged by the following closure?",
            "type": "code_mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.predict-output",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/judge/question",
        json=payload,
        headers={"X-Judge-Secret": SHARED_SECRET}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Duplicate: {result['duplicate']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Reason: {result['reason']}")
    print(f"Signals: {json.dumps(result['signals'], indent=2)}")
    
    assert result['duplicate'] == True
    assert result['confidence'] > 0.85
    print("✅ Exact duplicate detected correctly")


def test_different_objective():
    """Test that different objectives are NOT marked as duplicates."""
    print("\n=== Testing Different Objectives ===")
    payload = {
        "existing": {
            "text": "What will this closure print to the console?",
            "type": "code_mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.predict-output",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        },
        "candidate": {
            "text": "Why does the closure retain access to the variable x?",
            "type": "mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.explain-mechanism",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/judge/question",
        json=payload,
        headers={"X-Judge-Secret": SHARED_SECRET}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Duplicate: {result['duplicate']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Reason: {result['reason']}")
    print(f"Signals: {json.dumps(result['signals'], indent=2)}")
    
    assert result['duplicate'] == False
    print("✅ Different objectives correctly identified as NOT duplicate")


def test_same_code_different_question():
    """Test that same code with completely different questions are NOT duplicates."""
    print("\n=== Testing Same Code, Different Question ===")
    payload = {
        "existing": {
            "text": "What will be printed?",
            "type": "code_mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.predict-output",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        },
        "candidate": {
            "text": "Which variable is captured by the inner function?",
            "type": "mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "objective_key": "javascript.closures.identify-variable",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/judge/question",
        json=payload,
        headers={"X-Judge-Secret": SHARED_SECRET}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Duplicate: {result['duplicate']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Reason: {result['reason']}")
    print(f"Signals: {json.dumps(result['signals'], indent=2)}")
    
    assert result['duplicate'] == False
    print("✅ Same code with different questions correctly identified as NOT duplicate")


def test_genuinely_new():
    """Test clearly different questions."""
    print("\n=== Testing Genuinely New Question ===")
    payload = {
        "existing": {
            "text": "What will this closure print?",
            "type": "code_mcq",
            "concept_key": "javascript.closures.lexical-scope",
            "code": "function outer() { var x = 10; return function() { console.log(x); }; }"
        },
        "candidate": {
            "text": "How do you define a class in Python?",
            "type": "mcq",
            "concept_key": "python.oop.classes"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/judge/question",
        json=payload,
        headers={"X-Judge-Secret": SHARED_SECRET}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Duplicate: {result['duplicate']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Reason: {result['reason']}")
    
    assert result['duplicate'] == False
    assert result['signals']['text_similarity'] < 0.5
    print("✅ Genuinely new question correctly identified")


if __name__ == "__main__":
    print("🧪 Starting Question Judge Service Tests")
    print("=" * 60)
    
    try:
        test_health()
        test_exact_duplicate()
        test_different_objective()
        test_same_code_different_question()
        test_genuinely_new()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to service. Is it running?")
        print("Start with: python -m uvicorn app.main:app --reload")
        exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        exit(1)

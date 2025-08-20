#!/usr/bin/env python3
import requests
import json
import time
import os
import base64
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from frontend .env file to get the backend URL
frontend_env_path = Path("/app/frontend/.env")
load_dotenv(frontend_env_path)

# Get the backend URL from the frontend .env file
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"

print(f"Testing backend API at: {API_URL}")

# Test getting a speaking exercise
def test_get_speaking_exercise():
    """Test getting a speaking exercise"""
    response = requests.get(f"{API_URL}/speak/exercise")
    assert response.status_code == 200
    data = response.json()
    
    # Verify exercise structure
    assert "id" in data
    assert "type" in data
    assert "content" in data
    assert "difficulty_level" in data
    
    # Verify exercise type
    assert data["type"] in ["word", "sentence", "shadowing"]
    
    print(f"✅ Get speaking exercise endpoint is working")
    print(f"Exercise type: {data['type']}")
    print(f"Exercise content: {data['content']}")
    
    return data

# Test submitting a speaking exercise
def test_submit_speaking_exercise(exercise_data=None):
    """Test submitting a speaking exercise for analysis"""
    if exercise_data is None:
        # Get a new exercise if none provided
        exercise_data = test_get_speaking_exercise()
    
    # Create a mock audio data (base64 encoded)
    mock_audio = base64.b64encode(b"mock audio data for testing").decode('utf-8')
    
    payload = {
        "exercise_type": exercise_data["type"],
        "content": exercise_data["content"],
        "audio_data": mock_audio
    }
    
    try:
        print(f"Sending request to {API_URL}/speak/submit with payload: {json.dumps(payload)[:100]}...")
        response = requests.post(f"{API_URL}/speak/submit", json=payload)
        
        # Print detailed response information for debugging
        print(f"Response status code: {response.status_code}")
        
        try:
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json)[:200]}...")
        except Exception as json_err:
            print(f"Failed to parse response as JSON: {str(json_err)}")
            print(f"Response text: {response.text[:200]}...")
        
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        
        data = response.json()
        
        # Verify response structure
        assert "pronunciation_score" in data
        assert "feedback" in data
        assert "detailed_analysis" in data
        
        # Verify scores
        assert isinstance(data["pronunciation_score"], (int, float))
        assert 0 <= data["pronunciation_score"] <= 100
        
        if exercise_data["type"] == "sentence":
            assert "intonation_score" in data
            if data["intonation_score"] is not None:
                assert 0 <= data["intonation_score"] <= 100
        
        print(f"✅ Submit speaking exercise endpoint is working")
        print(f"Pronunciation score: {data['pronunciation_score']:.1f}")
        if "intonation_score" in data and data["intonation_score"] is not None:
            print(f"Intonation score: {data['intonation_score']:.1f}")
        print(f"Feedback: {data['feedback'][:100]}...")
        
        return data
    except requests.exceptions.HTTPError as e:
        print(f"❌ Submit speaking exercise endpoint returned error: {e}")
        print(f"Response status code: {e.response.status_code}")
        print(f"Response text: {e.response.text[:500]}...")
        raise
    except Exception as general_err:
        print(f"❌ Unexpected error testing speaking exercise endpoint: {str(general_err)}")
        raise

# Test all three exercise types
def test_all_exercise_types():
    """Test all three exercise types: word, sentence, and shadowing"""
    # Test word exercise
    print("\n--- Testing Word Exercise ---")
    for _ in range(5):  # Try up to 5 times to get a word exercise
        exercise = test_get_speaking_exercise()
        if exercise["type"] == "word":
            test_submit_speaking_exercise(exercise)
            break
    
    # Test sentence exercise
    print("\n--- Testing Sentence Exercise ---")
    for _ in range(5):  # Try up to 5 times to get a sentence exercise
        exercise = test_get_speaking_exercise()
        if exercise["type"] == "sentence":
            test_submit_speaking_exercise(exercise)
            break
    
    # Test shadowing exercise
    print("\n--- Testing Shadowing Exercise ---")
    for _ in range(5):  # Try up to 5 times to get a shadowing exercise
        exercise = test_get_speaking_exercise()
        if exercise["type"] == "shadowing":
            test_submit_speaking_exercise(exercise)
            break
    
    print("\n✅ All speaking exercise types tested successfully")

if __name__ == "__main__":
    print("\n🔍 Starting Elysian Speaking Module Tests\n")
    
    # Test getting a speaking exercise
    print("\n--- Testing Get Speaking Exercise ---")
    exercise_data = test_get_speaking_exercise()
    
    # Test submitting a speaking exercise
    print("\n--- Testing Submit Speaking Exercise ---")
    test_submit_speaking_exercise(exercise_data)
    
    # Test all exercise types
    test_all_exercise_types()
    
    print("\n✅ All speaking module tests completed successfully!")
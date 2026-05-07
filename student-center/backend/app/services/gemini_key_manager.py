import os
import random

def get_next_gemini_key() -> str:
    """Returns a random Gemini API key from the pool defined in .env."""
    from dotenv import load_dotenv
    load_dotenv('.env')

    keys = []
    
    # Check variables like GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
    for k, v in os.environ.items():
        if k.startswith("GEMINI_API_KEY") and v:
            keys.append(v)
            
    if keys:
        return random.choice(keys)
    raise ValueError("GEMINI_API_KEY not found in environment")

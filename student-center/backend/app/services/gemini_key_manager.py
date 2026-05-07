import os

def get_next_gemini_key() -> str:
    """Returns the Gemini API key from the environment."""
    from dotenv import load_dotenv
    load_dotenv('.env')
    
    env_key = os.getenv("GEMINI_API_KEY")
    if not env_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    return env_key

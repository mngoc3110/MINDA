import os
import random

_KEYS = [
    "AIzaSyB1mSgCAeJOe3OARTSJjYMAPbgu1e6k7wI",
    "AIzaSyAOOJ8X6cpjxApXXcXYHhnrro9cimjPD8Q",
    "AIzaSyClGst4euTmZheiAFBTKv0P_pgYn1iPadU",
    "AIzaSyDsso64BY5bv8o02My0ek9iszWs9kWMMJg"
]

def get_next_gemini_key() -> str:
    """Returns a random Gemini API key from the pool."""
    keys = _KEYS.copy()
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key and env_key not in keys:
        keys.append(env_key)
    return random.choice(keys)

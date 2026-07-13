import os
import sys

# Detect if we are running inside a Hugging Face Space container
if os.environ.get("SPACE_ID"):
    # Remove the current directory from sys.path temporarily to prevent self-import loop
    current_dir = os.path.dirname(__file__)
    has_dir = current_dir in sys.path
    if has_dir:
        sys.path.remove(current_dir)
        
    # Import the system-wide installed huggingface 'spaces' package
    import spaces as real_spaces
    
    # Restore path
    if has_dir:
        sys.path.append(current_dir)
        
    # Export the real GPU decorator
    GPU = real_spaces.GPU
else:
    # Local fallback: dummy decorator that does nothing
    def GPU(func):
        return func

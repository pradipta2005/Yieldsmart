import os
import sys

# Detect if we are running inside a Hugging Face Space container
if os.environ.get("SPACE_ID"):
    # Save the current local spaces module from sys.modules
    local_spaces = sys.modules.get("spaces")
    
    # Temporarily remove local spaces module from sys.modules so Python is forced to search the path
    if "spaces" in sys.modules:
        del sys.modules["spaces"]
        
    # Temporarily remove current directory from sys.path to prevent self-import
    current_dir = os.path.dirname(__file__)
    has_dir = current_dir in sys.path
    if has_dir:
        sys.path.remove(current_dir)
        
    try:
        # Import the real system-wide huggingface spaces package
        import spaces as real_spaces
        GPU = real_spaces.GPU
    finally:
        # Restore sys.path
        if has_dir:
            sys.path.append(current_dir)
        # Restore the local spaces module to sys.modules
        if local_spaces is not None:
            sys.modules["spaces"] = local_spaces
else:
    # Local fallback: dummy decorator that does nothing
    def GPU(func):
        return func

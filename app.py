"""
app.py — YieldSmart Hugging Face Space Entrypoint Wrapper
This file sits at the root to satisfy Hugging Face Space's Gradio SDK requirement,
directing execution to the backend package cleanly.
"""
import os
import sys

# Add backend directory to sys.path so imports work seamlessly
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the actual deployment app
from backend.app import demo

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

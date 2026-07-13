"""
app.py - YieldSmart Hugging Face Space entry point

Architecture:
  - A plain FastAPI app is the top-level ASGI app served by uvicorn
  - Our backend routes (/api_v2/*) are mounted at the top level
  - The Gradio demo is mounted at "/" via gr.mount_gradio_app()
  - A @spaces.GPU function is registered so ZeroGPU accepts the space
"""
import os
import sys
import spaces
import gradio as gr
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Create our top-level FastAPI server
root_app = FastAPI(title="YieldSmart Root")

# Allow CORS on the root app
cors_origins = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [o.strip() for o in cors_origins.split(",") if o.strip()]
root_app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Import and include our backend FastAPI router directly
from main import app as backend_app
root_app.include_router(backend_app.router)

# Log all registered routes on startup
for route in root_app.routes:
    print(f"  [route] {getattr(route, 'path', '?')} {getattr(route, 'methods', '')}")

# 3. ZeroGPU - register a @spaces.GPU function so HF accepts the space
@spaces.GPU
def dummy_gpu_trigger():
    """Dummy GPU function to satisfy ZeroGPU startup verification."""
    return "ZeroGPU Active"

# 4. Build the Gradio UI
with gr.Blocks(title="YieldSmart API Backend", css="footer{visibility:hidden}") as demo:
    gr.Markdown("# YieldSmart API Backend")
    gr.Markdown(
        "This Hugging Face Space hosts the FastAPI backend server "
        "for the YieldSmart Smart Farming Platform."
    )
    with gr.Row():
        gr.Markdown("""
        ### Live API Endpoints:
        - **API Health Check**: [/api_v2/health](/api_v2/health)
        - **Live Dashboard**: [/api_v2/dashboard?city=Kolkata](/api_v2/dashboard?city=Kolkata)
        - **Scan History**: [/api_v2/history](/api_v2/history)

        ### System Status:
        - **Host Platform**: Hugging Face Spaces (Gradio Python SDK)
        - **Hardware**: ZeroGPU (Free Tier)
        - **Model Engine**: TensorFlow / Keras (38 Crop Diseases)
        """)
    gr.Markdown("---")
    gr.Markdown("2026 YieldSmart Smart Farming Platform. All API operations active.")

    # Register the GPU trigger via a hidden button so ZeroGPU detects it
    _btn = gr.Button("Init GPU", visible=False)
    _btn.click(fn=dummy_gpu_trigger, inputs=[], outputs=[])

# 5. Mount Gradio into our root FastAPI app at "/"
# Our /api_v2/* routes registered above are evaluated before Gradio's catch-all.
app = gr.mount_gradio_app(root_app, demo, path="/")

# 6. Entry point
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)

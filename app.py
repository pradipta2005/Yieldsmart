"""
app.py - YieldSmart Hugging Face Space entry point

Fix: Patch App.__call__ (the ASGI entry point of Gradio's FastAPI app)
to intercept /api/* requests BEFORE any Gradio routing runs.
This bypasses Gradio's SvelteKit SSR which was 308-redirecting unknown paths.
"""
import os
import spaces
import gradio as gr
from gradio.routes import App
from main import app as backend_app

# ── Patch App.__call__ to intercept /api/* at the ASGI level ─────────────────
_original_call = App.__call__

async def _patched_call(self, scope, receive, send):
    """Route /api/* directly to our FastAPI backend. Everything else → Gradio."""
    if scope.get("type") == "http" and scope.get("path", "").startswith("/api/"):
        await backend_app(scope, receive, send)
    else:
        await _original_call(self, scope, receive, send)

App.__call__ = _patched_call

# ── ZeroGPU: register a @spaces.GPU fn so HF accepts the space ───────────────
@spaces.GPU
def dummy_gpu_trigger():
    return "ZeroGPU Active"

# ── Gradio UI ─────────────────────────────────────────────────────────────────
with gr.Blocks(title="YieldSmart API Backend", css="footer{visibility:hidden}") as demo:
    gr.Markdown("# YieldSmart API Backend")
    gr.Markdown("FastAPI backend for the YieldSmart Smart Farming Platform.")
    with gr.Row():
        gr.Markdown("""
        ### Live API Endpoints:
        - **Health Check**: [/api/health](/api/health)
        - **Dashboard**: [/api/dashboard?city=Kolkata](/api/dashboard?city=Kolkata)
        - **History**: [/api/history](/api/history)

        ### System Status:
        - Host: Hugging Face Spaces (ZeroGPU)
        - Model: TensorFlow / Keras (38 Crop Diseases)
        """)
    gr.Markdown("---")
    gr.Markdown("2026 YieldSmart Smart Farming Platform.")
    _btn = gr.Button("Init GPU", visible=False)
    _btn.click(fn=dummy_gpu_trigger, inputs=[], outputs=[])

# ── Launch (required for ZeroGPU handshake) ───────────────────────────────────
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

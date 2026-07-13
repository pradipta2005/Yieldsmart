"""
app.py - YieldSmart Hugging Face Space entry point

Strategy:
  - Use demo.launch() so ZeroGPU detects @spaces.GPU correctly
  - Monkey-patch App.create_app to inject our FastAPI router
  - Add a Starlette middleware that intercepts 308 redirects for /api_v2 paths
    and instead proxies the request directly to our FastAPI handler
"""
import os
import spaces
import gradio as gr
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from gradio.routes import App

# ── 1. Import our backend FastAPI app ─────────────────────────────────────────
from main import app as backend_app

# ── 2. Middleware that routes /api_v2/* to our FastAPI handler ────────────────
class APIRoutingMiddleware(BaseHTTPMiddleware):
    """
    Intercept any request whose path starts with /api_v2 and dispatch it
    directly through the backend_app ASGI handler, bypassing Gradio's
    SvelteKit router which would 308-redirect unknown paths to /.
    """
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api_v2"):
            # Dispatch directly to our backend FastAPI app
            scope = request.scope
            scope["app"] = backend_app
            response = await backend_app(scope, request._receive, request._send)
            return Response()  # response already sent via send
        return await call_next(request)

# ── 3. Monkey-patch App.create_app to inject middleware + router ──────────────
original_create_app = App.create_app

def custom_create_app(*args, **kwargs):
    app = original_create_app(*args, **kwargs)

    # Add CORS
    cors_origins = os.getenv("CORS_ORIGINS", "*")
    CORS_ORIGINS = [o.strip() for o in cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include our backend router so FastAPI handles /api_v2/* natively
    app.include_router(backend_app.router)

    # Move /api_v2 routes to the front of the router list
    api_routes = [r for r in app.router.routes if getattr(r, "path", "").startswith("/api_v2")]
    other_routes = [r for r in app.router.routes if not getattr(r, "path", "").startswith("/api_v2")]
    app.router.routes = api_routes + other_routes

    print("[YieldSmart] Registered routes:")
    for r in app.router.routes:
        print(f"  {getattr(r, 'path', '?')}  methods={getattr(r, 'methods', '?')}")

    return app

App.create_app = custom_create_app

# ── 4. ZeroGPU - must be declared for HF to start the space ──────────────────
@spaces.GPU
def dummy_gpu_trigger():
    return "ZeroGPU Active"

# ── 5. Gradio UI ──────────────────────────────────────────────────────────────
with gr.Blocks(title="YieldSmart API Backend", css="footer{visibility:hidden}") as demo:
    gr.Markdown("# YieldSmart API Backend")
    gr.Markdown("FastAPI backend for the YieldSmart Smart Farming Platform.")
    with gr.Row():
        gr.Markdown("""
        ### Live API Endpoints:
        - **Health Check**: [/api_v2/health](/api_v2/health)
        - **Dashboard**: [/api_v2/dashboard?city=Kolkata](/api_v2/dashboard?city=Kolkata)
        - **History**: [/api_v2/history](/api_v2/history)

        ### System Status:
        - Host: Hugging Face Spaces (ZeroGPU Free Tier)
        - Model: TensorFlow / Keras (38 Crop Diseases)
        """)
    gr.Markdown("---")
    gr.Markdown("2026 YieldSmart Smart Farming Platform.")
    _btn = gr.Button("Init GPU", visible=False)
    _btn.click(fn=dummy_gpu_trigger, inputs=[], outputs=[])

# ── 6. Launch via native Gradio (required for ZeroGPU handshake) ──────────────
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

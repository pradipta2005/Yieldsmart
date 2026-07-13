import os
import spaces
import gradio as gr
from fastapi import FastAPI
from main import app as fastapi_app
from gradio.routes import App

# 1. Monkey-patch Gradio's App.create_app to mount our FastAPI app inside Gradio
original_create_app = App.create_app

def custom_create_app(*args, **kwargs):
    # Build the standard Gradio FastAPI app
    app = original_create_app(*args, **kwargs)
    # Include the routes from our FastAPI backend app directly
    app.include_router(fastapi_app.router)
    # Prioritize any routes starting with "/api_v2" by moving them to the top
    if app.router.routes:
        api_routes = [r for r in app.router.routes if getattr(r, "path", "").startswith("/api_v2")]
        non_api_routes = [r for r in app.router.routes if not getattr(r, "path", "").startswith("/api_v2")]
        app.router.routes = api_routes + non_api_routes
        print("Registered routes in order:")
        for r in app.router.routes:
            print(f"  - {getattr(r, 'path', 'No Path')} ({type(r).__name__})")
    return app

App.create_app = custom_create_app

# 2. Define our dummy GPU function for ZeroGPU verification
@spaces.GPU
def dummy_gpu_trigger():
    return "ZeroGPU Active"

# 3. Define the Gradio Blocks UI layout
with gr.Blocks(title="YieldSmart API", css="footer {visibility: hidden}") as demo:
    gr.Markdown("# 🌱 YieldSmart API Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend server for the YieldSmart Smart Farming Platform.")
    
    with gr.Row():
        gr.Markdown("""
        ### 🚀 Live API Endpoints:
        - **API Health Check**: [/api_v2/health](/api_v2/health)
        - **Live Dashboard**: [/api_v2/dashboard?city=Kolkata](/api_v2/dashboard?city=Kolkata)
        - **Scan History**: [/api_v2/history](/api_v2/history)
        
        ### ⚙️ System Status:
        - **Host Platform**: Hugging Face Spaces (Gradio Python SDK)
        - **Hardware**: ZeroGPU (Free Tier)
        - **Model Engine**: TensorFlow / Keras (38 Crop Diseases)
        """)
    
    gr.Markdown("---")
    gr.Markdown("© 2026 YieldSmart Smart Farming Platform. All API operations active.")
    
    # Active event listener to register the GPU trigger with ZeroGPU
    dummy_btn = gr.Button("Initialize GPU Context", visible=False)
    dummy_btn.click(fn=dummy_gpu_trigger, inputs=[], outputs=[])

# 4. Launch the Gradio app natively.
# This will call App.create_app(demo), triggering our monkey patch to mount FastAPI
# and initiate the ZeroGPU handshake natively on port 7860.
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

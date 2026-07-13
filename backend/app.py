import gradio as gr
from main import app as fastapi_app

# Define a clean, minimal status dashboard for your Hugging Face space
with gr.Blocks(title="YieldSmart API", css="footer {visibility: hidden}") as demo:
    gr.Markdown("# 🌱 YieldSmart API Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend server for the YieldSmart Smart Farming Platform.")
    
    with gr.Row():
        gr.Markdown("""
        ### 🚀 Live API Endpoints:
        - **API Health Check**: [/api/health](/api/health)
        - **Live Dashboard**: [/api/dashboard?city=Kolkata](/api/dashboard?city=Kolkata)
        - **Scan History**: [/api/history](/api/history)
        
        ### ⚙️ System Status:
        - **Host Platform**: Hugging Face Spaces (Gradio Python SDK)
        - **Hardware**: CPU Basic (Free Tier - 16 GB RAM)
        - **Model Engine**: TensorFlow / Keras (38 Crop Diseases)
        """)
    
    gr.Markdown("---")
    gr.Markdown("© 2026 YieldSmart Smart Farming Platform. All API operations active.")

# Mount the Gradio web UI onto the FastAPI application at the root route
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)


"""
model_service.py — Keras model inference wrapper for plant disease detection
"""
import os
import json
import numpy as np
from PIL import Image
import io
import threading

# Lazy-load TensorFlow to speed up startup
_model = None
_class_labels = None
_model_lock = threading.Lock()

# Look for model in same directory first (Hugging Face or moved), fallback to parent directory
MODEL_PATH = os.path.join(os.path.dirname(__file__), "plant_disease_recog_model.keras")
if not os.path.exists(MODEL_PATH):
    parent_path = os.path.join(os.path.dirname(__file__), "..", "plant_disease_recog_model.keras")
    if os.path.exists(parent_path):
        MODEL_PATH = parent_path

# Global cache for the resolved model path (which might point to the Hugging Face hub cache)
RESOLVED_MODEL_PATH = MODEL_PATH

# TF 2.13 compatibility: suppress noisy warnings
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "class_labels.json")

def get_labels():
    global _class_labels
    if _class_labels is None:
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        _class_labels = data
    return _class_labels

def check_and_download_model():
    """Ensure the actual 770MB Keras model file is resolved, downloading it if it is missing or a Git LFS pointer."""
    global RESOLVED_MODEL_PATH
    
    needs_download = False
    if not os.path.exists(RESOLVED_MODEL_PATH):
        needs_download = True
    elif os.path.getsize(RESOLVED_MODEL_PATH) < 100000:
        print(f"Model file at {RESOLVED_MODEL_PATH} is a Git LFS pointer ({os.path.getsize(RESOLVED_MODEL_PATH)} bytes).")
        needs_download = True
        
    if needs_download:
        print("Resolving model file via Hugging Face Hub download...")
        try:
            from huggingface_hub import hf_hub_download
            downloaded_path = hf_hub_download(
                repo_id="pradipta2005/yieldsmart-api",
                repo_type="space",
                filename="plant_disease_recog_model.keras"
            )
            RESOLVED_MODEL_PATH = downloaded_path
            print("Model resolved successfully via HF Hub:", RESOLVED_MODEL_PATH)
            return
        except Exception as hf_err:
            print("HF Hub download failed, falling back to direct URL download:", hf_err)
            
        url = "https://github.com/pradipta2005/Yieldsmart/releases/download/model/plant_disease_recog_model.keras"
        try:
            import requests
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            temp_path = RESOLVED_MODEL_PATH + ".tmp"
            with open(temp_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            os.replace(temp_path, RESOLVED_MODEL_PATH)
            print("Download complete. Model saved successfully.")
        except Exception as e:
            if os.path.exists(RESOLVED_MODEL_PATH + ".tmp"):
                os.remove(RESOLVED_MODEL_PATH + ".tmp")
            raise FileNotFoundError(
                f"Model file not found at {RESOLVED_MODEL_PATH} and auto-download failed: {e}. "
                "Please place the model file manually in the backend directory."
            )

def get_model():
    global _model
    with _model_lock:
        if _model is None:
            check_and_download_model()
            import tensorflow as tf
            print(f"Loading Keras model from {RESOLVED_MODEL_PATH}... (this may take a moment)")
            _model = tf.keras.models.load_model(RESOLVED_MODEL_PATH)
            print("Model loaded successfully.")
        return _model


# Number of valid plant disease classes
NUM_CLASSES = 38

def compute_normalized_confidence(preds):
    """
    Convert sigmoid outputs to a relative probability distribution.
    Reconstructs logits: logit = log(p / (1 - p)).
    Applies softmax to the reconstructed logits to normalize.
    """
    eps = 1e-7
    clipped_preds = np.clip(preds, eps, 1.0 - eps)
    logits = np.log(clipped_preds / (1.0 - clipped_preds))
    # Subtract max logit for numerical stability
    exp_logits = np.exp(logits - np.max(logits))
    return exp_logits / np.sum(exp_logits)

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a model-ready numpy array.
    
    Model: EfficientNetB7 fine-tuned on PlantVillage (38 classes).
    Input: 160x160 RGB, pixel values in [0, 255] — EfficientNet handles
    its own internal normalization (do NOT divide by 255 here).
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((160, 160))
    img_array = np.array(image, dtype=np.float32)  # Keep [0, 255] range
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def predict_disease(image_bytes: bytes) -> dict:
    """
    Run inference on an uploaded leaf image.
    Returns the predicted class, confidence score, and full disease info.
    
    Note: The model output layer has 48 units (sigmoid) but only 38
    correspond to valid plant disease classes. We slice to the first
    NUM_CLASSES values before taking argmax to prevent IndexError.
    """
    # 1. Leaf presence detection pre-filter (HSV check)
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("HSV")
        h, s, v = image.split()
        h_arr, s_arr, v_arr = np.array(h), np.array(s), np.array(v)
        # Plant hues: Green, Yellow, Orange, Brown (<=115) and Red (>=240)
        # Exclude Blue, Cyan, Purple, Magenta (115 < Hue < 240)
        # Ensure decent saturation (>25) and value (>20, <245) to ignore dark/white backgrounds
        is_plant = ((h_arr <= 115) | (h_arr >= 240)) & (s_arr > 25) & (v_arr > 20) & (v_arr < 245)
        plant_ratio = float(np.sum(is_plant) / is_plant.size)
        if plant_ratio < 0.15:
            raise ValueError("No plant leaf detected in the image. Please upload a clear photo of a plant leaf.")
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        # Ignore other image parsing errors here; they will be caught by PIL in preprocess_image
        pass

    labels_data = get_labels()
    class_list = labels_data["labels"]
    solutions_db = labels_data["solutions"]

    model = get_model()
    img_array = preprocess_image(image_bytes)

    raw_predictions = model(img_array, training=False).numpy()
    # Slice to valid class range only
    predictions = raw_predictions[0][:NUM_CLASSES]

    class_idx = int(np.argmax(predictions))
    
    # Calculate normalized relative probabilities (Softmax over reconstructed logits)
    softmax_probs = compute_normalized_confidence(predictions)
    confidence = float(softmax_probs[class_idx])

    # Out-Of-Distribution (OOD) check: detect if image is a non-leaf or model is highly confused
    # Condition 1: Multiple contradictory classes have high sigmoid activation (e.g. >0.7)
    # Condition 2: Top relative confidence is extremely low (e.g. <0.30)
    high_act_count = int(np.sum(predictions > 0.70))
    is_valid_leaf = True
    warning_msg = None
    
    if high_act_count > 2 or confidence < 0.30:
        is_valid_leaf = False
        warning_msg = "The uploaded photo does not appear to be a clear, single leaf. Please upload a clear photo of a plant leaf under good lighting."

    # Get top-3 predictions for UI display
    top3_indices = np.argsort(predictions)[::-1][:3]
    top3 = [
        {
            "label": class_list[int(i)],
            "confidence": float(softmax_probs[int(i)])
        }
        for i in top3_indices
    ]

    predicted_label = class_list[class_idx]
    disease_info = solutions_db.get(predicted_label, {
        "display": predicted_label.replace("___", " — ").replace("_", " "),
        "plant": "Unknown",
        "severity": "unknown",
        "cause": "Information not available.",
        "symptoms": "Please consult an agronomist.",
        "treatments": [],
        "prevention": [],
        "organic": False
    })

    return {
        "label": predicted_label,
        "confidence": round(confidence * 100, 2),
        "top3": top3,
        "disease_info": disease_info,
        "is_valid_leaf": is_valid_leaf,
        "warning": warning_msg
    }

import os
import json
import numpy as np
from PIL import Image
import threading

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILENAME = "plant_disease_recog_model.tflite"
RESOLVED_MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)
LABELS_PATH = os.path.join(BASE_DIR, "class_labels.json")

# Global state
_interpreter = None
_model_lock = threading.Lock()
labels_data = None
NUM_CLASSES = 48

def load_labels():
    global labels_data
    if labels_data is None:
        if not os.path.exists(LABELS_PATH):
            raise FileNotFoundError(f"class_labels.json not found at {LABELS_PATH}")
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            labels_data = json.load(f)

def check_and_download_model():
    global RESOLVED_MODEL_PATH
    if not os.path.exists(RESOLVED_MODEL_PATH):
        print(f"Model not found locally at {RESOLVED_MODEL_PATH}.")
        print("Resolving model file via Hugging Face Hub download...")
        try:
            from huggingface_hub import hf_hub_download
            downloaded_path = hf_hub_download(
                repo_id="pradipta2005/yieldsmart-api",
                repo_type="space",
                filename="backend/" + MODEL_FILENAME,
                token=os.environ.get("HF_TOKEN")
            )
            RESOLVED_MODEL_PATH = downloaded_path
            print("Model resolved successfully via HF Hub:", RESOLVED_MODEL_PATH)
            return
        except Exception as hf_err:
            print("HF Hub download failed:", hf_err)
            raise FileNotFoundError(
                f"Model file not found at {RESOLVED_MODEL_PATH} and auto-download failed: {hf_err}. "
                "Please place the model file manually in the backend directory."
            )

def get_interpreter():
    global _interpreter
    with _model_lock:
        if _interpreter is None:
            check_and_download_model()
            import tensorflow as tf
            print(f"Loading TFLite model from {RESOLVED_MODEL_PATH}...")
            _interpreter = tf.lite.Interpreter(model_path=RESOLVED_MODEL_PATH)
            _interpreter.allocate_tensors()
            print("TFLite Model loaded successfully.")
        return _interpreter

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

def is_green_dominant(img: Image.Image, threshold=0.15) -> bool:
    img_hsv = img.convert("HSV")
    np_img = np.array(img_hsv)
    h_channel = np_img[:, :, 0]
    s_channel = np_img[:, :, 1]
    v_channel = np_img[:, :, 2]
    green_mask = (h_channel >= 30) & (h_channel <= 90) & (s_channel >= 40) & (v_channel >= 40)
    green_ratio = np.sum(green_mask) / (np_img.shape[0] * np_img.shape[1])
    return green_ratio >= threshold

def predict_disease(image_bytes: bytes):
    load_labels()
    try:
        img = Image.open(import_io_bytes(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")
    except Exception as e:
        raise ValueError("Invalid image file.") from e

    valid_leaf = is_green_dominant(img)
    img_resized = img.resize((160, 160))
    img_array = np.array(img_resized, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)

    interpreter = get_interpreter()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    raw_predictions = interpreter.get_tensor(output_details[0]['index'])
    
    predictions = raw_predictions[0]
    norm_preds = compute_normalized_confidence(predictions)
    
    class_idx = int(np.argmax(norm_preds))
    confidence_score = float(norm_preds[class_idx]) * 100

    predicted_label = labels_data["labels"][class_idx]
    disease_info = labels_data["solutions"].get(predicted_label, {
        "display": predicted_label.replace("___", " ").replace("_", " "),
        "severity": "unknown",
        "cause": "Information not available.",
        "symptoms": "N/A",
        "treatments": [],
        "prevention": [],
        "organic": False
    })

    top_3_indices = np.argsort(norm_preds)[-3:][::-1]
    top_3 = []
    for idx in top_3_indices:
        lbl = labels_data["labels"][idx]
        display_lbl = labels_data["solutions"].get(lbl, {}).get("display", lbl)
        top_3.append({
            "label": lbl,
            "display": display_lbl,
            "confidence": float(norm_preds[idx])
        })

    result = {
        "label": predicted_label,
        "confidence": round(confidence_score, 2),
        "top3": top_3,
        "disease_info": disease_info,
        "is_valid_leaf": bool(valid_leaf)
    }

    if not valid_leaf:
        result["warning"] = "The uploaded photo does not appear to be a clear, single leaf. Please upload a clear photo of a plant leaf under good lighting."

    return result

def import_io_bytes(b):
    import io
    return io.BytesIO(b)

import sys
import os

# We suppress warnings
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
import keras

print("TF version:", tf.__version__)
print("Keras version:", keras.__version__)

if "keras.src" not in sys.modules:
    sys.modules["keras.src"] = keras
if "keras.src.models" not in sys.modules:
    sys.modules["keras.src.models"] = keras.models

try:
    from keras.engine import functional
    sys.modules["keras.src.models.functional"] = functional
    print("Mapped to keras.engine.functional")
except ImportError:
    sys.modules["keras.src.models.functional"] = keras.models
    print("Mapped to keras.models")

model_path = os.path.join(os.path.dirname(__file__), "plant_disease_recog_model.keras")

try:
    model = tf.keras.models.load_model(model_path)
    print("Successfully loaded the model using monkey patching!")
except Exception as e:
    print("Error loading model:", e)

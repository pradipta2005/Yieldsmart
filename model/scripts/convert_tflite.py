import tensorflow as tf

print("Loading Keras model...")
model = tf.keras.models.load_model(r"c:\Users\ADMIN\OneDrive\Documents\Desktop\College_project\backend\plant_disease_recog_model.keras")

print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
# Optional: Quantize for even lower latency and size
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

print("Saving TFLite model...")
with open(r"c:\Users\ADMIN\OneDrive\Documents\Desktop\College_project\backend\plant_disease_recog_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Conversion complete!")

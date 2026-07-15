# YieldSmart — System Architecture

YieldSmart is an intelligent, full-stack smart farming platform. It integrates local weather prediction, crop recommendations, soil quality analysis, and real-time plant disease detection using deep learning.

---

## System Diagram

```mermaid
graph TD
    User([Farmer / App User]) -->|HTTP / WebSockets| FE[Next.js Frontend]
    FE -->|API Requests| BE[FastAPI Backend]
    
    subgraph BE_Services [FastAPI Services]
        BE --> Auth[JWT Auth Service]
        BE --> Weather[OpenWeather Service]
        BE --> Soil[Soil Prediction Engine]
        BE --> Model[TFLite Inference Engine]
    end

    subgraph Data_Storage [Data Storage]
        Auth --> DB[(SQLite / PostgreSQL DB)]
        Model --> DB
    end

    subgraph ML_Model [Machine Learning Model]
        Model -->|Runs inference| TFLite[plant_disease_recog_model.tflite]
        TFLite -->|Reference| Labels[class_labels.json]
    end
    
    subgraph External_APIs [External APIs]
        Weather -->|Fetches real-time| OWM[OpenWeatherMap API]
    end
```

---

## Component Details

### 1. Frontend Architecture (Next.js)
- **App Router**: Uses Next.js App Router for dynamic layout routing (`/dashboard`, `/disease`, `/history`, `/auth`).
- **State & Logic**: Fully client-side React components featuring interactive dashboards, image drag-and-drop uploads, and dynamic modal dialogs.
- **Styling**: Curated custom styling utilizing harmonious palettes (CSS variables), sleek dark mode transitions, and glassmorphic designs.

### 2. Backend Architecture (FastAPI)
- **FastAPI Core**: High-performance ASGI framework with route handlers for user profiles, history logging, dashboard telemetry, and machine learning inference.
- **Double Database Strategy**: Built-in SQLite handler for local offline setup, with automatic fallback and integration support for Postgres/Supabase database systems in production environments.
- **JWT Authentication**: Secure user registration, encrypted login verification, and token authentication headers.

### 3. ML Inference Pipeline (TensorFlow Lite)
- **TFLite Interpreter**: Utilizes a highly optimized, quantized `.tflite` model running low-latency inference on the server.
- **Logit Softmax Normalization**: Converted sigmoid raw outputs back to logit levels, applying standard softmax normalization to provide highly accurate probability distributions.
- **Green Color Threshold Masking**: Analyzes HSV values of the uploaded image to ensure it contains a valid leaf before invoking model inference.

---

## Telemetry & Data Flow

```mermaid
sequenceDiagram
    autonumber
    Farmer->>Frontend: Upload leaf image
    Frontend->>Backend: POST /api/detect-disease (multipart form)
    Backend->>Backend: HSV check (green dominant?)
    Backend->>Backend: Preprocess image (resize to 160x160)
    Backend->>TFLite Model: Run model inference
    TFLite Model-->>Backend: Raw probability logits
    Backend->>Backend: Normalize outputs via Softmax
    Backend->>Backend: Fetch solutions from class_labels.json
    Backend->>Database: Save scan record (if authenticated)
    Backend-->>Frontend: JSON result (label, confidence, treatments, prevention)
    Frontend-->>Farmer: Display detailed farmer-friendly solutions
```

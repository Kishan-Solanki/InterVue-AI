from flask import Flask, request, jsonify
import librosa
import numpy as np
import joblib
import os
import tempfile
from flask_cors import CORS
import soundfile as sf

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ------------------------------
# Load model + scaler
# ------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "nervousness_model.pkl")

print(f"📁 Loading model from: {MODEL_PATH}")
model_data = joblib.load(MODEL_PATH)
model = model_data["model"]
scaler = model_data["scaler"]

print(f"✅ Model expects {scaler.n_features_in_} features")

# ------------------------------
# Feature Extraction Function
# ------------------------------

def extract_features(path):
    """Extract audio features for nervousness detection - MUST match training features."""
    try:
        print(f"🎵 Loading audio file: {path}")
        y, sr = librosa.load(path, sr=22050)
        
        if len(y) == 0:
            raise ValueError("Audio file is empty or unreadable")
        
        print(f"✅ Audio loaded successfully: {len(y)} samples at {sr} Hz")

        # Extract all features that match your training
        features = []
        
        # 1. MFCC (13 coefficients) - Mean across time
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        features.extend(mfcc_mean)
        print(f"✅ MFCC features: {len(mfcc_mean)}")
        
        # 2. MFCC Delta (13 coefficients) - Mean across time
        mfcc_delta = librosa.feature.delta(mfcc)
        mfcc_delta_mean = np.mean(mfcc_delta, axis=1)
        features.extend(mfcc_delta_mean)
        print(f"✅ MFCC Delta features: {len(mfcc_delta_mean)}")
        
        # 3. Zero Crossing Rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        features.append(zcr)
        print(f"✅ ZCR: {zcr}")
        
        # 4. RMS Energy
        rms = np.mean(librosa.feature.rms(y=y))
        features.append(rms)
        print(f"✅ RMS: {rms}")
        
        # 5. Spectral Centroid
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        features.append(spectral_centroid)
        print(f"✅ Spectral Centroid: {spectral_centroid}")
        
        # 6. Spectral Rolloff
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
        features.append(spectral_rolloff)
        print(f"✅ Spectral Rolloff: {spectral_rolloff}")
        
        # 7. Spectral Bandwidth
        spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))
        features.append(spectral_bandwidth)
        print(f"✅ Spectral Bandwidth: {spectral_bandwidth}")
        
        # 8. Tempo (beat tracking)
        try:
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            # Convert tempo to scalar - it may be returned as an array
            tempo_value = float(tempo) if isinstance(tempo, (int, float)) else float(tempo[0])
            features.append(tempo_value)
            print(f"✅ Tempo: {tempo_value}")
        except:
            features.append(120.0)  # Default tempo
            print("⚠️ Tempo detection failed, using default: 120.0")
        
        # 9. Chroma features (12 pitch classes) - Mean across time
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        features.extend(chroma_mean)
        print(f"✅ Chroma features: {len(chroma_mean)}")
        
        features_array = np.array(features)
        print(f"✅ Total features extracted: {len(features_array)}")
        print(f"   Expected by model: {scaler.n_features_in_}")
        
        # Verify feature count matches
        if len(features_array) != scaler.n_features_in_:
            raise ValueError(
                f"Feature mismatch! Extracted {len(features_array)} features, "
                f"but model expects {scaler.n_features_in_} features"
            )
        
        return features_array
        
    except Exception as e:
        print(f"❌ Feature extraction error: {e}")
        raise

# ------------------------------
# Default Route
# ------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Nervousness Detection API Running",
        "expected_features": int(scaler.n_features_in_)
    }), 200

# ------------------------------
# Analyze Route
# ------------------------------

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    print("\n" + "="*50)
    print("📩 Request received at /analyze")
    print("="*50)

    # Handle CORS Preflight
    if request.method == "OPTIONS":
        resp = jsonify({"status": "CORS OK"})
        resp.headers.add("Access-Control-Allow-Origin", "*")
        resp.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        resp.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return resp, 200

    # Check if file exists
    if "file" not in request.files:
        print("❌ Error: No file uploaded")
        return jsonify({"error": "No file uploaded"}), 400

    # Save audio file temporarily
    file = request.files["file"]
    
    # Use proper file extension
    file_ext = ".webm"
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_ext = ext
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        file.save(tmp.name)
        temp_path = tmp.name

    print(f"💾 File saved to: {temp_path}")
    print(f"📊 File size: {os.path.getsize(temp_path)} bytes")

    try:
        # Extract features
        print("🔍 Extracting features...")
        features = extract_features(temp_path)
        
        # Scale features
        print("⚖️ Scaling features...")
        scaled_features = scaler.transform([features])
        
        # Predict probability
        print("🤖 Making prediction...")
        score = float(model.predict_proba(scaled_features)[0][1])

        result = {
            "nervousness_score": round(score, 3)
        }

        print(f"\n✅ SUCCESS - Prediction Result: {result}")
        print("="*50 + "\n")
        return jsonify(result), 200

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*50 + "\n")
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temporary file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"🗑️ Cleaned up temp file: {temp_path}")
        except Exception as e:
            print(f"⚠️ Could not delete temp file: {e}")

# ------------------------------
# Run Server
# ------------------------------

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Nervousness Detection API")
    print("="*50)
    print(f"📍 Running on http://localhost:5000")
    print(f"📍 Network: http://0.0.0.0:5000")
    print(f"🎯 Model expects {scaler.n_features_in_} features")
    print("="*50 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
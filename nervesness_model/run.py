from flask import Flask, request, jsonify
import librosa
import numpy as np
import joblib
import os
import tempfile
from flask_cors import CORS
import soundfile as sf
import subprocess
from pydub import AudioSegment

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
# Audio Conversion Function
# ------------------------------

def convert_to_wav(input_path):
    """Convert audio file to WAV format using pydub (which uses ffmpeg internally)"""
    try:
        wav_path = input_path.rsplit('.', 1)[0] + '_converted.wav'
        
        print(f"🔄 Converting {input_path} to WAV format...")
        
        # Use pydub to convert (automatically handles ffmpeg)
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(22050).set_channels(1)  # 22050 Hz, mono
        audio.export(wav_path, format="wav")
        
        print(f"✅ Conversion successful: {wav_path}")
        return wav_path
        
    except Exception as e:
        print(f"❌ Audio conversion failed: {str(e)}")
        raise Exception(
            f"Audio conversion failed. Make sure FFmpeg is installed and in PATH.\n"
            f"Error: {str(e)}"
        )

# ------------------------------
# Feature Extraction Function
# ------------------------------

def extract_features(path):
    """Extract audio features for nervousness detection - MUST match training features."""
    wav_path = None
    try:
        # Convert to WAV if needed
        if path.lower().endswith(('.webm', '.mp4', '.m4a', '.ogg')):
            wav_path = convert_to_wav(path)
            audio_path = wav_path
        else:
            audio_path = path
        
        print(f"🎵 Loading audio file: {audio_path}")
        # Match training: duration=3, offset=0.5
        y, sr = librosa.load(audio_path, sr=22050, duration=3, offset=0.5)
        
        if len(y) == 0:
            raise ValueError("Audio file is empty or unreadable")
        
        print(f"✅ Audio loaded successfully: {len(y)} samples at {sr} Hz")

        # EXACTLY match training feature extraction
        
        # 1. MFCC (13 coefficients) - Mean across time
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        print(f"✅ MFCC features: {len(mfcc_mean)}")
        
        # 2. Chroma (12 pitch classes) - Mean across time
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        print(f"✅ Chroma features: {len(chroma_mean)}")
        
        # 3. Spectral Contrast (7 bands by default) - Mean across time
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast_mean = np.mean(contrast, axis=1)
        print(f"✅ Spectral Contrast features: {len(contrast_mean)}")
        
        # 4. Zero Crossing Rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        print(f"✅ ZCR: {zcr}")
        
        # 5. RMS Energy
        rms = np.mean(librosa.feature.rms(y=y))
        print(f"✅ RMS: {rms}")
        
        # 6. Pitch (Fundamental Frequency)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_mean = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0
        print(f"✅ Pitch Mean: {pitch_mean}")
        
        # Concatenate all features in the SAME ORDER as training
        features = np.concatenate([
            mfcc_mean,      # 13 features
            chroma_mean,    # 12 features
            contrast_mean,  # 7 features
            [zcr, rms, pitch_mean]  # 3 features
        ])
        
        print(f"✅ Total features extracted: {len(features)}")
        print(f"   Expected by model: {scaler.n_features_in_}")
        print(f"   Breakdown: MFCC(13) + Chroma(12) + Contrast(7) + Others(3) = {13+12+7+3}")
        
        # Verify feature count matches
        if len(features) != scaler.n_features_in_:
            raise ValueError(
                f"Feature mismatch! Extracted {len(features)} features, "
                f"but model expects {scaler.n_features_in_} features"
            )
        
        return features
        
    except Exception as e:
        print(f"❌ Feature extraction error: {e}")
        raise
    
    finally:
        # Clean up converted WAV file
        if wav_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
                print(f"🗑️ Cleaned up converted file: {wav_path}")
            except Exception as e:
                print(f"⚠️ Could not delete converted file: {e}")

# ------------------------------
# Default Route
# ------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Nervousness Detection API Running",
        "expected_features": int(scaler.n_features_in_),
        "supported_formats": [".webm", ".wav", ".mp3", ".m4a", ".ogg"]
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
    
    # Log frontend data
    print("\n" + "🌐 FRONTEND DATA:")
    print(f"   📄 Filename: {file.filename}")
    print(f"   📦 Content Type: {file.content_type}")
    print(f"   🔍 File Object: {file}")
    
    # Use proper file extension
    file_ext = ".webm"
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_ext = ext
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        file.save(tmp.name)
        temp_path = tmp.name

    print(f"\n💾 File saved to: {temp_path}")
    print(f"📊 File size: {os.path.getsize(temp_path)} bytes")
    print(f"✅ Data from frontend received perfectly!")

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
    print(f"🎵 Supported formats: WebM, WAV, MP3, M4A, OGG")
    print("="*50 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
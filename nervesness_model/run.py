from flask import Flask, request, jsonify
import librosa, numpy as np, joblib, os, tempfile
from flask_cors import CORS

app = Flask(__name__)
# Allow all origins, headers, and methods
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Load model + scaler
model_data = joblib.load("nervousness_model.pkl")
model = model_data["model"]
scaler = model_data["scaler"]

def extract_features(path):
    """Extract short-term audio features for nervousness detection"""
    y, sr = librosa.load(path, sr=22050)
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13), axis=1)
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))
    rms = np.mean(librosa.feature.rms(y=y))
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return np.hstack([mfcc, zcr, rms, tempo])

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    print("📩 Received request to /analyze")

    if request.method == "OPTIONS":
        # Handle preflight CORS request
        response = jsonify({"message": "CORS preflight OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response, 200

    # Ensure file was uploaded
    if "file" not in request.files:
        print("❌ No file field in request")
        return jsonify({"error": "No file provided"}), 400

    # Save file temporarily
    file = request.files["file"]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    print(f"🎧 Analyzing file: {tmp_path}")

    try:
        features = extract_features(tmp_path)
        scaled = scaler.transform([features])
        score = float(model.predict_proba(scaled)[0][1])  # Nervousness probability
        result = {"nervousness_score": round(score, 3)}
        print("✅ Analysis result:", result)
        return jsonify(result)
    except Exception as e:
        print("❌ Error during analysis:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    print("🚀 Flask Nervousness API running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)

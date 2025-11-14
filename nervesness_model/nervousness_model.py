import os
import numpy as np
import librosa
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import warnings
warnings.filterwarnings("ignore")

# ---------------------------
# STEP 1: CONFIG
# ---------------------------
# Update this to where you extracted the Kaggle dataset
# It should contain folders like "RAVDESS" and "TESS"
# DATASET_PATH = "C://Users//Kishan Solanki//OneDrive//Desktop//Intervue//nervesness_model//DATA"
DATASET_PATH = "D://Sem 7//sem7//InterVue-AI//nervesness_model//DATA"

# Emotions mapping (RAVDESS)
RAVDESS_EMOTION_MAP = {
    1: "neutral",
    2: "calm",
    3: "happy",
    4: "sad",
    5: "angry",
    6: "fearful",
    7: "disgust",
    8: "surprised"
}

# Emotions mapping (TESS uses folder names like "OAF_angry", "YAF_neutral" etc.)
TESS_LABELS = {
    "angry": "angry",
    "disgust": "disgust",
    "fear": "fearful",
    "happy": "happy",
    "neutral": "neutral",
    "ps": "surprised",  # "pleasant surprise"
    "sad": "sad"
}

NERVOUS_LABELS = ["fearful", "angry", "disgust", "sad"]
CALM_LABELS = ["neutral", "calm", "happy", "surprised"]

# ---------------------------
# STEP 2: FEATURE EXTRACTION
# ---------------------------

def extract_features(file_path):
    """Extract acoustic features for nervousness detection."""
    try:
        y, sr = librosa.load(file_path, sr=22050, duration=3, offset=0.5)
        if len(y) == 0:
            return None

        # MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)

        # Chroma
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)

        # Spectral contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast_mean = np.mean(contrast, axis=1)

        # Zero Crossing Rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))

        # RMS Energy
        rms = np.mean(librosa.feature.rms(y=y))

        # Pitch (Fundamental Frequency)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_mean = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0

        features = np.concatenate([
            mfcc_mean, chroma_mean, contrast_mean, [zcr, rms, pitch_mean]
        ])
        return features

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return None


# ---------------------------
# STEP 3: LOAD DATA
# ---------------------------

def load_dataset():
    X, y = [], []

    # --- Load RAVDESS ---
    ravdess_path = os.path.join(DATASET_PATH, "RAVDESS")
    for root, _, files in os.walk(ravdess_path):
        for file in files:
            if not file.endswith(".wav"):
                continue
            parts = file.split("-")
            if len(parts) < 3:
                continue
            emotion_id = int(parts[2])
            emotion = RAVDESS_EMOTION_MAP.get(emotion_id)
            if emotion not in NERVOUS_LABELS + CALM_LABELS:
                continue
            label = 1 if emotion in NERVOUS_LABELS else 0
            path = os.path.join(root, file)
            features = extract_features(path)
            if features is not None:
                X.append(features)
                y.append(label)

    # --- Load TESS ---
    tess_path = os.path.join(DATASET_PATH, "TESS")
    for root, _, files in os.walk(tess_path):
        for file in files:
            if not file.endswith(".wav"):
                continue
            folder = os.path.basename(root).lower()
            emotion = None
            for key, value in TESS_LABELS.items():
                if key in folder:
                    emotion = value
                    break
            if emotion not in NERVOUS_LABELS + CALM_LABELS:
                continue
            label = 1 if emotion in NERVOUS_LABELS else 0
            path = os.path.join(root, file)
            features = extract_features(path)
            if features is not None:
                X.append(features)
                y.append(label)

    print(f"✅ Loaded {len(X)} total samples from RAVDESS + TESS")
    return np.array(X), np.array(y)


# ---------------------------
# STEP 4: TRAIN & SAVE MODEL
# ---------------------------

def train_model():
    print("📦 Loading dataset...")
    X, y = load_dataset()
    if len(X) == 0:
        print("❌ No samples found. Check DATASET_PATH.")
        return

    print("⚙️ Normalizing features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    print("🎯 Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n✅ Accuracy: {acc:.3f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

    joblib.dump({"model": model, "scaler": scaler}, "nervousness_model.pkl")
    print("\n🎉 Saved trained model as 'nervousness_model.pkl'")


# ---------------------------
# RUN TRAINING
# ---------------------------

if __name__ == "__main__":
    train_model()

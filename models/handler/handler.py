import os

import joblib
import numpy as np
from fastapi import FastAPI
from mangum import Mangum
from pydantic import BaseModel

MODEL_DIR = os.environ.get("MODEL_DIR", "/opt/ml")
_pca = _regressor = _classifier = None

EMBEDDING_DIM = 384

TABULAR_FEATURE_ORDER = [
    "ticket_type_id",
    "ticket_severity_id",
    "business_impact_id",
    "users_impacted",
    "deadline_offset_days",
    "is_after_hours",
]


def _load_models():
    global _pca, _regressor, _classifier
    if _pca is None or _regressor is None or _classifier is None:
        _pca = joblib.load(os.path.join(MODEL_DIR, "pca.pkl"))
        _regressor = joblib.load(os.path.join(MODEL_DIR, "regressor.pkl"))
        _classifier = joblib.load(os.path.join(MODEL_DIR, "classifier.pkl"))


def _build_feature_vector(embedding: list, features: dict):
    """
    1. Apply PCA to the 384-dim embedding to turn it into 32 dim
    2. Concat with 6 tabular features
    Returns a (1, 38) array ready for XGBoost inference
    """
    assert _pca is not None

    emb_array = np.array(embedding, dtype=np.float32).reshape(1, -1)
    emb_reduced = _pca.transform(emb_array)

    tabular = np.array(
        [features[k] for k in TABULAR_FEATURE_ORDER], dtype=np.float32
    ).reshape(1, -1)

    return np.hstack([emb_reduced, tabular])


def _predict(embedding: list, features: dict) -> dict:
    _load_models()

    X = _build_feature_vector(embedding, features)

    assert _regressor is not None
    assert _classifier is not None

    reg_preds = _regressor.predict(X)[0]
    hours_min = max(0.0, float(reg_preds[0]))
    hours_max = min(hours_min, float(reg_preds[1]))
    cost = max(0.0, float(reg_preds[2]))

    proba = _classifier.predict_proba(X)[0]
    class_idx = int(np.argmax(proba))
    priority_id = class_idx + 1  # 0-based to 1-based indexing
    confidence = float(proba[class_idx])

    return {
        "estimated_hours_minimum": round(hours_min, 2),
        "estimated_hours_maximum": round(hours_max, 2),
        "estimated_cost": round(cost, 2),
        "suggested_ticket_priority_id": priority_id,
        "priority_confidence": round(confidence, 4),
    }


class PredictRequest(BaseModel):
    embedding: list[float]
    features: dict[str, float]


app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    if len(req.embedding) != EMBEDDING_DIM:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400,
            detail=f"embedding must be {EMBEDDING_DIM}-dim, got {len(req.embedding)}",
        )

    missing = set(TABULAR_FEATURE_ORDER) - set(req.features.keys())
    if missing:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=400, detail=f"missing feature fields: {missing}"
        )

    return _predict(req.embedding, req.features)


handler = Mangum(app, lifespan="off")

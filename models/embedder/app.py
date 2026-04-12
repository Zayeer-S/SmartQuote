from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model
    _model = SentenceTransformer(MODEL_NAME)
    yield


app = FastAPI(lifespan=lifespan)


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "ready": _model is not None}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    vector = _model.encode(req.text, normalize_embeddings=True).tolist()
    return EmbedResponse(embedding=vector, dim=len(vector))


# Lambda Function URL entry point.
# Mangum translates the Lambda HTTP event/context into ASGI and back.
handler = Mangum(app, lifespan="on")

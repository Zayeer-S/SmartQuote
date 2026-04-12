# Local
FROM python:3.12-slim AS local

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py .
COPY artifacts/pca.pkl .
COPY artifacts/classifier.pkl .
COPY artifacts/regressor.pkl .

ENV MODEL_DIR=/app

EXPOSE 8000
CMD ["uvicorn", "handler:app", "--host", "0.0.0.0", "--port", "8000"]

# Lambda
FROM public.ecr.aws/lambda/python:3.12 AS lambda

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py ${LAMBDA_TASK_ROOT}/
COPY artifacts/pca.pkl .
COPY artifacts/classifier.pkl .
COPY artifacts/regressor.pkl .

CMD ["handler.handler"]
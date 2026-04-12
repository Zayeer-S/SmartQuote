# Local
FROM python:3.12-slim AS local

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY app.py .

EXPOSE 8000
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8000"]

# Lambda
FROM public.ecr.aws/lambda/python:3.12 AS lambda

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"
 
COPY app.py .
 
CMD ["app.handler"]
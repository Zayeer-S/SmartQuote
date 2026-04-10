FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py ${LAMBDA_TASK_ROOT}/

COPY artifacts/pca.pkl .
COPY artifacts/classifier.pkl .
COPY artifacts/regressor.pkl .

CMD ["handler.handler"]
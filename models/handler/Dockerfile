FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py ${LAMBDA_TASK_ROOT}/

COPY artifacts/pca.pk1 .
COPY artifacts/classifier.pk1 .
COPY artifacts/regressor.pk1 .

CMD ["handler.handler"]
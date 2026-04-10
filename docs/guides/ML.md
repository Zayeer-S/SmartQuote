The ML quoting pipeline augments the rule-based engine with XGBoost predictions. Both estimates are shown side-by-side to the admin on the quote panel.

### How it works

1. When a ticket is created, AWS Bedrock generates a 1536-dim Titan embedding from the ticket title and description. This is stored in the `ticket_embeddings` table.
2. When an admin triggers auto-generate quote, the Node API fetches the stored embedding and tabular ticket features, then invokes the ML Lambda.
3. The ML Lambda applies a pre-fitted PCA (1536 -> 32 dims) to the embedding, concatenates it with the 6 tabular features, and runs two XGBoost models:
   - `XGBRegressor`: predicts `estimated_hours_minimum`, `estimated_hours_maximum`, `estimated_cost`
   - `XGBClassifier`: predicts `suggested_ticket_priority_id` (P1-P4) with a confidence score
4. Both the rule-based and ML estimates are returned to the admin UI.

### Retraining the model

```bash
# 1. Set up Python environment
cd models
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Regenerate synthetic training data (optional -- existing CSV can be reused)
python scripts/generate_synthetic_data.py

# 3. Open and run the training notebook
jupyter notebook notebooks/xgboost_quote_estimator.ipynb
# Run all cells -- artifacts are saved to models/output/ and copied to models/handler/artifacts/

# 4. Build and push the updated container image
aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin 149195855178.dkr.ecr.eu-west-2.amazonaws.com

docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --output type=docker \
  -t smartquote-ml-quote \
  ./models/handler/

docker tag smartquote-ml-quote:latest \
  149195855178.dkr.ecr.eu-west-2.amazonaws.com/smartquote-ml-quote:latest

docker push \
  149195855178.dkr.ecr.eu-west-2.amazonaws.com/smartquote-ml-quote:latest

# 5. Redeploy the app stack to pick up the new image
npm run infra:deploy-all
```

> **Important:** Always build with `--platform linux/amd64 --provenance=false --output type=docker`. Building on Windows/WSL2 without these flags produces an OCI manifest that Lambda rejects.

### Model artifacts

Artifacts are gitignored and must be regenerated locally before building the container.

| File | Description |
|---|---|
| `models/output/pca.pkl` | Fitted PCA transformer (1536 -> 32 dims) |
| `models/output/regressor.pkl` | Fitted XGBRegressor (hours + cost) |
| `models/output/classifier.pkl` | Fitted XGBClassifier (priority P1-P4) |
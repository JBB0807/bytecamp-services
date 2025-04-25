#!/usr/bin/env bash

while true; do
  # Fetch the latest notebook from S3 (common bucket + prefix)
  aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
    s3 cp "s3://$BUCKET_NAME/$INSTANCE_PREFIX/notebook.ipynb" notebook.ipynb

  # Execute all cells, including run_server(...) in the last cell
  jupyter nbconvert \
    --to notebook \
    --execute \
    --inplace \
    --ExecutePreprocessor.timeout=0 \
    notebook.ipynb

  echo "Notebook executed; restarting..."
  sleep 1
done

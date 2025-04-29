#!/usr/bin/env bash
NOTEBOOK_DIR="notebooks"
mkdir -p "${NOTEBOOK_DIR}"

# fetch latest notebook
aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
  s3 sync "s3://$BUCKET_NAME/$INSTANCE_PREFIX/notebooks/" "${NOTEBOOK_DIR}/"

# convert to Python script for dynamic import
latest_ipynb=$(ls -t "${NOTEBOOK_DIR}"/*.ipynb | head -1)
if [ -n "$latest_ipynb" ]; then
  jupyter nbconvert --to script "$latest_ipynb" --output "${NOTEBOOK_DIR}/notebook.py"
fi

# start the Flask server
python snakeapi_server.py

#!/usr/bin/env bash
NOTEBOOK_DIR="notebooks"
mkdir -p "${NOTEBOOK_DIR}"

# fetch latest notebook via prefix sync
aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
  s3 sync "s3://$BUCKET_NAME/$INSTANCE_PREFIX/notebooks/" "${NOTEBOOK_DIR}/"

# pick latest .ipynb and normalize name
latest_ipynb=$(ls -t "${NOTEBOOK_DIR}"/*.ipynb | head -1)
if [ -n "$latest_ipynb" ]; then
  mv "$latest_ipynb" "${NOTEBOOK_DIR}/notebook.ipynb"
  jupyter nbconvert --to script "${NOTEBOOK_DIR}/notebook.ipynb" --output "${NOTEBOOK_DIR}/notebook.py"
  export NOTEBOOK_PATH="$(pwd)/${NOTEBOOK_DIR}/notebook.py"
fi

exec python snakeapi_server.py

#!/usr/bin/env bash

NOTEBOOK_DIR="notebooks"
mkdir -p ${NOTEBOOK_DIR}

while true; do
  aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
    s3 sync "s3://$BUCKET_NAME/$INSTANCE_PREFIX/notebooks/" "${NOTEBOOK_DIR}/"

  latest_notebook=$(ls -t ${NOTEBOOK_DIR}/*.ipynb | head -1)

  if [ -n "$latest_notebook" ]; then
    jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=0 "$latest_notebook"
  fi

  sleep 5
done

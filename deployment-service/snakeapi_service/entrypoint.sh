#!/usr/bin/env bash

last_mod=0

while true; do
  aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
    s3 sync "s3://$BUCKET_NAME/$INSTANCE_PREFIX" . --exclude "*" --include "notebook.ipynb"

  if [ -f "notebook.ipynb" ]; then
    new_mod=$(stat -c %Y notebook.ipynb)
  else
    new_mod=0
  fi

  if [ "$new_mod" -ne "$last_mod" ]; then
    last_mod=$new_mod
    jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=0 notebook.ipynb
  fi

  sleep 1
done

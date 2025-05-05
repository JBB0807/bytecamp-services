#!/usr/bin/env bash
set -eux

NOTEBOOK_DIR="notebooks"
mkdir -p "${NOTEBOOK_DIR}"

# sync notebooks from S3
aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
  s3 sync "s3://$COMMON_BUCKET/$INSTANCE_PREFIX/notebooks/" "${NOTEBOOK_DIR}/"

# pick latest notebook
latest_ipynb=$(ls -t "${NOTEBOOK_DIR}"/*.ipynb | head -n1)
cp "$latest_ipynb" "${NOTEBOOK_DIR}/notebook.ipynb"

# convert notebook to script
jupyter nbconvert --to script "${NOTEBOOK_DIR}/notebook.ipynb" \
  --output notebook --output-dir "${NOTEBOOK_DIR}"

# remove IPython magics only
sed -i '/get_ipython()/d' "${NOTEBOOK_DIR}/notebook.py"
sed -i '/^!/d'           "${NOTEBOOK_DIR}/notebook.py"
sed -i '/^%/d'           "${NOTEBOOK_DIR}/notebook.py"

# remove standalone Flask run calls
sed -i '/app\.run(/d'    "${NOTEBOOK_DIR}/notebook.py"

# export path and launch server
export NOTEBOOK_PATH="$(pwd)/${NOTEBOOK_DIR}/notebook.py"
exec python snakeapi_server.py

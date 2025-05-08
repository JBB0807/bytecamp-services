#!/usr/bin/env bash
NOTEBOOK_DIR="notebooks"
echo "Creating notebook directory: ${NOTEBOOK_DIR}"
mkdir -p "${NOTEBOOK_DIR}"

# fetch latest notebook
echo "Syncing notebooks from S3 bucket..."
aws --endpoint-url "$AWS_ENDPOINT_URL_S3" --region "$AWS_REGION" \
  s3 sync "s3://$COMMON_BUCKET/$INSTANCE_PREFIX/notebooks/" "${NOTEBOOK_DIR}/"

# convert to Python script for dynamic import
echo "Finding the latest notebook..."
latest_ipynb=$(ls -t "${NOTEBOOK_DIR}"/*.ipynb | head -1)
if [ -n "$latest_ipynb" ]; then
  echo "Running the latest notebook ${latest_ipynb} with Jupyter..."
  jupyter nbconvert --to notebook --execute "$latest_ipynb" --stdout
  # echo "Converting notebook ${latest_ipynb} to Python script..."
  # jupyter nbconvert --to script "$latest_ipynb" --output "${NOTEBOOK_DIR}/notebook.py"
else
  echo "No notebooks found in ${NOTEBOOK_DIR}."
fi

# # start the Flask server
# echo "Starting the Flask server..."
# python snakeapi_server.py

FROM python:3.11-slim
WORKDIR /app

# disable Python output buffering
ENV PYTHONUNBUFFERED=1
# wrapper server port
ENV PORT=8000
# notebook server port
ENV NOTEBOOK_PORT=3006

RUN pip install --no-cache-dir \
    flask \
    flask-cors \
    awscli \
    jupyter \
    nbconvert \
    nbformat \
    requests

COPY entrypoint.sh .
COPY snakeapi_server.py .
COPY notebooks ./notebooks

RUN chmod +x entrypoint.sh

EXPOSE ${PORT} ${NOTEBOOK_PORT}

CMD ["./entrypoint.sh"]

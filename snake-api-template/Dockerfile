FROM python:3.11-slim
WORKDIR /app

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir jupyter flask awscli flask_cors nbconvert nbformat


COPY ./entrypoint.sh .
COPY ./notebooks ./notebooks
COPY ./snakeapi_server.py .

RUN chmod +x entrypoint.sh

ENV PORT=8000
EXPOSE 8000

CMD ["./entrypoint.sh"]

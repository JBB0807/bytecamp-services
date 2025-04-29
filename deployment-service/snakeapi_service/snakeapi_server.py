import os
import logging
import typing
import json
import nbformat
from nbconvert import PythonExporter
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

def run_server(handlers: typing.Dict):
    app = Flask(__name__)
    CORS(app)

    @app.get("/")
    def on_info():
        return handlers["info"]()

    @app.post("/start")
    def on_start():
        handlers["start"](request.get_json())
        return "ok"

    @app.post("/move")
    def on_move():
        return handlers["move"](request.get_json())

    @app.post("/end")
    def on_end():
        handlers["end"](request.get_json())
        return "ok"

    @app.get("/notebook")
    def get_notebook():
        with open("notebook.ipynb", "r", encoding="utf-8") as f:
            content = f.read()
        return content, 200, {"Content-Type": "application/json"}

    @app.post("/notebook")
    def update_notebook():
        notebook_json = request.get_json()
        with open("notebook.ipynb", "w", encoding="utf-8") as f:
            json.dump(notebook_json, f)
        return {"status": "saved"}, 200

    port = int(os.environ.get("PORT", "3006"))
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="0.0.0.0", port=port)

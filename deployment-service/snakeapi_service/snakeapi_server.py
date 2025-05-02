import os
import logging
import importlib.util
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)

NOTEBOOK_PATH = os.environ.get("NOTEBOOK_PATH")
if not NOTEBOOK_PATH or not os.path.isfile(NOTEBOOK_PATH):
    raise RuntimeError(f"NOTEBOOK_PATH not set or file not found: {NOTEBOOK_PATH}")

# Determine .ipynb path
notebook_ipynb_path = NOTEBOOK_PATH[:-3] + ".ipynb"

spec = importlib.util.spec_from_file_location("notebook_module", NOTEBOOK_PATH)
notebook_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notebook_module)

app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/", methods=["GET"])
def info():
    return jsonify(notebook_module.info())

@app.route("/start", methods=["POST"])
def start():
    data = request.get_json()
    return jsonify(notebook_module.start(data))

@app.route("/move", methods=["POST"])
def move():
    data = request.get_json()
    return jsonify(notebook_module.move(data))

@app.route("/end", methods=["POST"])
def end():
    data = request.get_json()
    return jsonify(notebook_module.end(data))

@app.route("/notebook", methods=["GET"])
def get_notebook():
    if os.path.isfile(notebook_ipynb_path):
        with open(notebook_ipynb_path, "r", encoding="utf-8") as f:
            return Response(f.read(), mimetype="application/json")
    return jsonify({"error": "notebook not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)

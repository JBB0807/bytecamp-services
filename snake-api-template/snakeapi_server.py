# snakeapi_service/snakeapi_server.py
import os
import importlib.util
from flask import Flask, request
from flask_cors import CORS

# load notebook code as module
spec = importlib.util.spec_from_file_location(
    "nb_module", os.path.join("notebooks", "notebook.py")
)
nb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nb)

handlers = {
    "info": nb.info,
    "start": nb.start,
    "move": nb.move,
    "end": nb.end
}

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def on_info():
    return handlers["info"]()

@app.route("/start", methods=["POST"])
def on_start():
    handlers["start"](request.get_json())
    return "ok"

@app.route("/move", methods=["POST"])
def on_move():
    return handlers["move"](request.get_json())

@app.route("/end", methods=["POST"])
def on_end():
    handlers["end"](request.get_json())
    return "ok"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "3006"))
    app.run(host="0.0.0.0", port=port)

import os
import logging
import typing
import importlib.util
from flask import Flask, request, jsonify
from flask_cors import CORS

notebook_path = os.environ.get("NOTEBOOK_PATH")
if not notebook_path or not os.path.isfile(notebook_path):
    raise RuntimeError(f"Notebook module not found: {notebook_path}")

spec = importlib.util.spec_from_file_location("notebook_module", notebook_path)
notebook_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notebook_module)

handlers = {
    "info": notebook_module.info,
    "start": notebook_module.start,
    "move": notebook_module.move,
    "end": notebook_module.end,
}

def run_server(handlers: typing.Dict):
    app = Flask(__name__)
    CORS(app)

    @app.get("/")
    def on_info():
        return handlers["info"]()

    @app.post("/start")
    def on_start():
        game_state = request.get_json()
        handlers["start"](game_state)
        return "ok"

    @app.post("/move")
    def on_move():
        game_state = request.get_json()
        return handlers["move"](game_state)

    @app.post("/end")
    def on_end():
        end_game = request.get_json()
        handlers["end"](end_game)
        return "ok"

    @app.get("/notebook")
    def get_notebook():
        with open(notebook_path.replace('.py', '.ipynb'), "r", encoding="utf-8") as f:
            return f.read(), 200, {"Content-Type": "application/json"}

    @app.get("/notebook/path")
    def get_notebook_path():
        return jsonify({"path": notebook_path})

    host = "0.0.0.0"
    port = int(os.environ.get("PORT", "3006"))
    logging.getLogger("werkzeug").setLevel(logging.ERROR)

    app.run(host=host, port=port)

if __name__ == "__main__":
    run_server(handlers)

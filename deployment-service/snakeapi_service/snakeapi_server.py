import os
import logging
import typing
from flask import Flask, request
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

    @app.after_request
    def identify_server(response):
        response.headers["server"] = "battlesnake/github/starter-snake-python"
        return response

    port = int(os.environ.get("PORT", "3006"))
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="0.0.0.0", port=port)

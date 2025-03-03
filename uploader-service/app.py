import os
import uuid
import sqlite3
import docker
import requests
import threading
from flask import Flask, request, jsonify, render_template
import json
import time
import shutil
import dotenv
dotenv.load_dotenv()

app = Flask(__name__)
DATABASE = "machines.db"
FLY_APP = "snaketest"
FLY_REGISTRY = os.getenv("FLY_REGISTRY")
FLY_API_URL = os.getenv("FLY_API_URL")
FLY_API_TOKEN = os.getenv("FLY_API_TOKEN")

# Ensure database exists
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS machines (
                            name TEXT PRIMARY KEY,
                            pid INTEGER,
                            ipv6 TEXT
                            
                        )''')

ready_to_deploy = False


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No IPython Notebook file uploaded"}), 400
    
    file = request.files["file"]
    json_file = request.files.get("json_file")
    
    name = request.form.get("name")
    if not name:
        return jsonify({"error": "Name is required"}), 400
    # check if name already taken
    with sqlite3.connect(DATABASE) as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM machines WHERE name = ?", (name,))
        if cur.fetchone():
            return jsonify({"error": "Name already taken"}), 409
    
    pid = request.form.get("pid")
    
    unique_id = str(uuid.uuid4())
    
    upload_dir = os.path.join("uploads", unique_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, "notebook.ipynb")
    file.save(file_path)
    
    if json_file:
        json_path = os.path.join(upload_dir, json_file.filename)
        json_file.save(json_path)
    
    os.system(f'cp Dockerfile {upload_dir}/Dockerfile') 
    
    
    # threading.Thread(target=build_and_push_docker_image, args=(name, pid, unique_id, upload_dir)).start()
    ipv6 = build_and_push_docker_image(name, pid, unique_id, upload_dir)

    if ipv6 is None:
        return jsonify({"error": "Failed to deploy this snake"}), 500
    
    print("ipv6", ipv6)
    return jsonify({"message": "File uploaded", "ipv6": ipv6}), 200

def build_and_push_docker_image(name, pid, unique_id, upload_dir):
    print("Building and pushing docker image")
    client = docker.from_env()
    image_tag = f"{FLY_REGISTRY}:{unique_id}"
    
   
    client.images.build(path=upload_dir, tag=image_tag, dockerfile="Dockerfile")
    
    
    client.images.push(image_tag)
    
    print("Docker image built and pushed")
    global ready_to_deploy 
    ready_to_deploy = True
    print("about to deploy", ready_to_deploy)
    ipv6 = deploy_machine(name, pid, image_tag)
    
    # Cleanup junk
    # os.system(f"rm -rf {upload_dir}")
    print("upload", upload_dir)
    shutil.rmtree(upload_dir)
    print("Cleanup done")
    return ipv6

def deploy_machine(name, pid, image_tag):
    print("Deploying machine")
    print("ready to deploy", ready_to_deploy)
    while not ready_to_deploy:
        print("sleeping")
        time.sleep(2)
    headers = {
        "Authorization": f"Bearer {FLY_API_TOKEN}",
        "Content-Type": "application/json"
        }
    data = {
        "config": {
            "env": {
                "FLY_PROCESS_GROUP": "app"
            },
            "init": {},
            "guest": {
                "cpu_kind": "shared",
                "cpus": 1,
                "memory_mb": 512
            },
            "metadata": {
                "fly_flyctl_version": "0.3.87",
                "fly_platform_version": "v2",
                "fly_process_group": "app",
                "fly_release_id": "7pGPxgX11jYG2T94NqvJGYYxB",
                "fly_release_version": "1"
            },
            "services": [
                {
                    "protocol": "tcp",
                    "internal_port": 8000,
                    "force_instance_key": None
                }
            ],
            "image": f"{image_tag}",
            "restart": {
                "policy": "on-failure",
                "max_retries": 10
            }
        }
    }
    # data = json.dumps(data)
    response = requests.post(FLY_API_URL, json=data, headers=headers)
    print(response.json())
    print(response.status_code)
    if response.status_code == 200:
        machine_data = response.json()
        # fly_machine_id = machine_data["id"]
        ipv6 = machine_data["private_ip"]
        print("ipv6", ipv6)
        with sqlite3.connect(DATABASE) as conn:
            conn.execute("INSERT INTO machines (name, pid, ipv6) VALUES (?, ?, ?)", 
                         (name, pid, ipv6))
        print("Machine deployed")
        print(f"Machine deployed with Ip: {ipv6}")
        return ipv6
    else:
        print("Failed to deploy machine.")
        return None
        



def upload_to_battlesnake():
    pass



def get_machine_info(machine_id):
    with sqlite3.connect(DATABASE) as conn:
        cur = conn.cursor()
        cur.execute("SELECT pid, ipv6 FROM machines WHERE name = ?", (name))
        row = cur.fetchone()
        if row:
            return {"ipv6": row[0], "status": row[1]}
    return None






@app.route("/mock", methods=["POST"])
def mock():
    time.sleep(5)
    return jsonify({"message": "File uploaded", "ipv6": "ff:00:00:00:00::ff"}), 200

@app.route("/uploader")
def uploader():
    return render_template("uploader.html")


@app.route("/status/<machine_id>", methods=["GET"])
def status(machine_id):
    result = get_machine_info(machine_id)
    if result is None:
        return jsonify({"error": "Machine not found"}), 404
    return jsonify(result), 200

    
    # return jsonify({"step": get_step(machine_id), **get_machine_status(machine_id)})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')

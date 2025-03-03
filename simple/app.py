from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Define the base port for the target servers
BASE_PORT = 8000

@app.route('/', defaults={'path': ''}, methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@app.route('/<path:path>', methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def proxy(path):
    # Split the path into segments
    path_segments = path.strip('/').split('/')
    
    # The first segment should be the IPv6 address
    if not path_segments:
        return jsonify({"error": "No path provided"}), 400
    
    ipv6_address = path_segments[0]
    
    # Construct the target URL using the extracted IPv6 address
    target_url = f"http://[{ipv6_address}]:{BASE_PORT}"
    
    # Reconstruct the remaining path (if any)
    remaining_path = '/'.join(path_segments[1:])
    
    # Construct the full URL to proxy to
    full_url = f"{target_url}/{remaining_path}" if remaining_path else target_url

    # Forward the request to the target server
    try:
        response = requests.request(
            method=request.method,
            url=full_url,
            headers={key: value for (key, value) in request.headers if key != "Host"},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
        )

        # Return the response from the target server
        return (response.content, response.status_code, response.headers.items())
    except requests.exceptions.RequestException as e:
        stuff = {
            "method": request.method,
            "url": full_url,
            "headers": {key: value for (key, value) in request.headers if key != "Host"},
            "data": request.get_data(),
            "cookies": request.cookies,
            "error": str(e)
        }
        return jsonify(str(stuff)), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)  # Listen on all interfaces
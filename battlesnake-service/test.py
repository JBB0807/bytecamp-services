import requests
from bs4 import BeautifulSoup
import re
import os
import json
import time

# File to store session data
SESSION_FILE = "session_cache.json"
CACHE_DURATION = 30 * 60  # 30 minutes in seconds

# URL of the login page
LOGIN_URL = "https://play.battlesnake.com/login"

def load_session():
    """Load session data from the cache file if it exists and is still valid."""
    if os.path.exists(SESSION_FILE):
        with open(SESSION_FILE, "r") as f:
            session_data = json.load(f)
            # Check if the cache is still valid
            if time.time() - session_data["timestamp"] < CACHE_DURATION:
                session = requests.Session()
                # Load cookies into the session
                session.cookies.update(session_data["cookies"])
                print("Session loaded from cache.")
                return session, session_data.get("csrf_token")
    return None, None

def save_session(session, csrf_token):
    """Save session data and CSRF token to the cache file."""
    session_data = {
        "cookies": dict(session.cookies),
        "csrf_token": csrf_token,
        "timestamp": time.time(),
    }
    with open(SESSION_FILE, "w") as f:
        json.dump(session_data, f)
    print("Session and CSRF token saved to cache.")

def login():
    """Log in to Battlesnake and return the session and CSRF token."""
    session = requests.Session()

    # Get the login page to extract CSRF token
    response = session.get(LOGIN_URL)
    soup = BeautifulSoup(response.text, "html.parser")

    # Extract CSRF token
    csrf_token = soup.find("input", {"name": "csrfmiddlewaretoken"})["value"]

    # Define login payload
    payload = {
        "csrfmiddlewaretoken": csrf_token,
        "username": "bsaroya41@gmail.com",  # Replace with your email
        "password": "Threads@78",  # Replace with your password
    }

    # Headers to mimic a browser
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": LOGIN_URL,
    }

    # Send login request
    login_response = session.post(LOGIN_URL, data=payload, headers=headers)

    # Check if login was successful
    if "logout" in login_response.text:
        print("Login successful!")
        return session, csrf_token
    else:
        print("Login failed.")
        return None, None

def create_snake(session, csrf_token):
    """Creates a new Battlesnake using the logged-in session and CSRF token."""
    # URL to create a new Battlesnake
    CREATE_SNAKE_URL = "https://play.battlesnake.com/account/battlesnakes?s=new"

    # Define create snake payload
    payload = {
        "slug": "",
        "name": "snek",  # Replace with desired snake name
        "url": "https://snaketest.fly.dev/fdaa:c:cd38:a7b:bbfb:6619:1264:2/",  # Replace with your snake's URL
        "engine_region": "engr_HqgfRd3YGM799YRJbGmYF3B7",  # Replace with your engine region
        "description": "",  # Optional: Add a description
        "language_tag": "",  # Optional: Add a language tag
        "platform_tag": "",  # Optional: Add a platform tag
        "is_public": "True",  # Set to "True" or "False"
    }

    # Headers to mimic a browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
        "Accept": "*/*",
        "Accept-Language": "en-CA,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Referer": CREATE_SNAKE_URL,
        "HX-Request": "true",
        "HX-Current-URL": CREATE_SNAKE_URL,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrf_token,
        "Origin": "https://play.battlesnake.com",
        "Alt-Used": "play.battlesnake.com",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Priority": "u=0",
        "TE": "trailers",
    }

    # Send create snake request
    create_snake_response = session.post(CREATE_SNAKE_URL, data=payload, headers=headers)

    # Check if snake creation was successful
    if create_snake_response.status_code == 200:
        print("Battlesnake created successfully!")
    else:
        print(f"Battlesnake creation failed. Status code: {create_snake_response.status_code}")
        print(create_snake_response.text)
    return

# Main logic
session, csrf_token = load_session()
if not session or not csrf_token:
    session, csrf_token = login()
    if session and csrf_token:
        save_session(session, csrf_token)

if session and csrf_token:
    create_snake(session, csrf_token)
else:
    print("Failed to initialize session or CSRF token.")
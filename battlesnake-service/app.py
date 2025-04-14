import requests
from bs4 import BeautifulSoup
import re

# URL of the login page
LOGIN_URL = "https://play.battlesnake.com/login"

def login():
    """Logs in to Battlesnake using a session."""
    # Start a session
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
    print(login_response.cookies)
    if "logout" in login_response.text:
        print("Login successful!")
    else:
        print("Login failed.")


def create_snake(ipv6):
    """Creates a new Battlesnake using the logged-in session."""
    # URL to create a new Battlesnake
    CREATE_SNAKE_URL = "https://play.battlesnake.com/account/battlesnakes?s=new"
    
    # Get the create snake page to extract CSRF token
    response = session.get(CREATE_SNAKE_URL)
    soup = BeautifulSoup(response.text, "html.parser")
    
    script_tag = soup.find('script', string=lambda x: x and 'X-CSRFToken' in x)
    
    if script_tag:
        # Extract the CSRF token from the script tag
        script_content = script_tag.string
        csrf_token = (script_content.split("['X-CSRFToken']")[1])
        
        cleaned_string = re.sub(r'[^a-zA-Z0-9]', '', csrf_token)
        csrf_token = cleaned_string
        
        print(f"CSRF Token: {csrf_token}")
        
    else:
        print("CSRF token not found in the script tag.")
    
    # Define create snake payload
    payload = {
        "slug": "",
        "name": "snekkk",  # Replace with desired snake name
        "url": f"https://snaketest.fly.dev/{ipv6}/",  # Replace with your snake's URL
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
        
        
# Create a new Battlesnake
create_snake()
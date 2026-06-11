import requests

url = "http://127.0.0.1:8000/register"

with open("photo.jpg", "rb") as f:
    response = requests.post(
        url,
        data={"name": "Priyanshu"},
        files={"file": ("photo.jpg", f, "image/jpeg")}
    )

print(f"Status: {response.status_code}")
print(f"Raw response: {response.text}")
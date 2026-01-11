import firebase_admin
from firebase_admin import credentials, firestore
import os

# Check if we are on Render (Cloud) or Local (Laptop)
if os.path.exists("/etc/secrets/serviceAccountKey.json"):
    # We are on the server! Use the secret vault path
    cred = credentials.Certificate("/etc/secrets/serviceAccountKey.json")
else:
    # We are on the laptop! Use the local file
    cred = credentials.Certificate("serviceAccountKey.json")

# Initialize only if not already running
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
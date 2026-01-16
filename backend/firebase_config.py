import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# 1. Check if we are on Vercel (looking for the text variable)
if os.environ.get("FIREBASE_CREDENTIALS"):
    # Convert the massive text string back into a JSON object
    key_dict = json.loads(os.environ.get("FIREBASE_CREDENTIALS"))
    cred = credentials.Certificate(key_dict)

# 2. Check if we are on Render/Laptop (looking for the file)
elif os.path.exists("serviceAccountKey.json"):
    cred = credentials.Certificate("serviceAccountKey.json")
elif os.path.exists("/etc/secrets/serviceAccountKey.json"):
    cred = credentials.Certificate("/etc/secrets/serviceAccountKey.json")
else:
    raise Exception("No Firebase Key found! Check Vercel Env Vars or Local File.")

# Initialize
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
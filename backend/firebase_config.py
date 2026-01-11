import firebase_admin
from firebase_admin import credentials, firestore

# 1. Connect to Firebase using the key you already have
cred = credentials.Certificate("serviceAccountKey.json")

# 2. Check if app is already running
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

# 3. Create the database client
db = firestore.client()
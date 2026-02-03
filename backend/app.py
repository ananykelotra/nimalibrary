from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_config import db 
from firebase_admin import firestore

app = Flask(__name__)
CORS(app) 

# --- ADMIN CONFIGURATION ---
ADMIN_PASSWORD = "admin123"  # 🔒 Change this to whatever password you want

@firestore.transactional
def run_transaction(transaction, slot_ref, booking_data):
    snapshot = slot_ref.get(transaction=transaction)
    if snapshot.exists and snapshot.get('status') == 'booked':
        raise Exception("Slot already booked")

    # Save important search fields at the top level, 
    # and keep the full details in the 'details' suitcase.
    transaction.set(slot_ref, {
        'status': 'booked',
        'date': booking_data.get('date'),          
        'time_slot': booking_data.get('time_slot'),
        'room_id': booking_data.get('room_id'),
        'details': booking_data,
        'timestamp': firestore.SERVER_TIMESTAMP
    }, merge=True)

@app.route('/confirm-booking', methods=['POST'])
def confirm_booking():
    try:
        data = request.json
        # Create unique ID: Room_Date_Time
        slot_id = f"{data['room_id']}_{data['date']}_{data['time_slot']}"
        slot_ref = db.collection('daily_slots').document(slot_id)

        transaction = db.transaction()
        run_transaction(transaction, slot_ref, data)

        return jsonify({"status": "success", "message": "Booking Confirmed!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/cancel-booking', methods=['POST'])
def cancel_booking():
    try:
        data = request.json
        # Reconstruct the ID to find the correct booking to delete
        slot_id = f"{data['room_id']}_{data['date']}_{data['time_slot']}"
        
        slot_ref = db.collection('daily_slots').document(slot_id)
        doc = slot_ref.get()

        if not doc.exists:
            return jsonify({"status": "error", "message": "Booking not found"}), 404

        # Delete the booking
        slot_ref.delete()
        
        return jsonify({"status": "success", "message": "Booking Cancelled Successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/get-bookings', methods=['GET'])
def get_bookings():
    try:
        date = request.args.get('date')
        if not date:
            return jsonify({"bookings": []})
            
        # Return BOTH time and room so frontend can filter correctly
        docs = db.collection('daily_slots').where('date', '==', date).stream()
        bookings = []
        for doc in docs:
            data = doc.to_dict()
            bookings.append({
                "time_slot": data.get('time_slot'),
                "room_id": data.get('room_id')
            })
            
        return jsonify({"bookings": bookings}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# --- NEW: STUDENT DASHBOARD ROUTE ---
@app.route('/my-bookings', methods=['GET'])
def my_bookings():
    try:
        roll_no = request.args.get('roll_no')
        if not roll_no:
            return jsonify({"status": "error", "message": "Roll No required"}), 400
        
        # Search inside the 'details' suitcase for the leader's roll number
        docs = db.collection('daily_slots').where('details.leader_roll_no', '==', roll_no).stream()
        
        bookings = []
        for doc in docs:
            data = doc.to_dict()
            bookings.append({
                "room_id": data.get('room_id'),
                "date": data.get('date'),
                "time_slot": data.get('time_slot'),
                "purpose": data.get('details', {}).get('purpose')
            })
            
        return jsonify({"status": "success", "bookings": bookings}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- NEW: ADMIN LOGIN ROUTE ---
@app.route('/admin-login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        # Check against the constant password defined at the top
        if data.get('password') == ADMIN_PASSWORD:
            return jsonify({"status": "success", "message": "Login Successful"}), 200
        else:
            return jsonify({"status": "error", "message": "Wrong Password"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

# --- NEW: ADMIN GET ALL BOOKINGS ROUTE ---
@app.route('/admin/all-bookings', methods=['GET'])
def all_bookings():
    try:
        # Fetch every single document in the collection
        docs = db.collection('daily_slots').stream()
        
        all_data = []
        for doc in docs:
            data = doc.to_dict()
            all_data.append({
                "room_id": data.get('room_id'),
                "date": data.get('date'),
                "time_slot": data.get('time_slot'),
                # We pull these from 'details' so the admin knows who booked it
                "leader": data.get('details', {}).get('leader_name', 'Unknown'),
                "roll_no": data.get('details', {}).get('leader_roll_no', 'N/A')
            })
            
        return jsonify({"bookings": all_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
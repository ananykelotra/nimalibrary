from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_config import db 
from firebase_admin import firestore

app = Flask(__name__)
CORS(app) 

@firestore.transactional
def run_transaction(transaction, slot_ref, booking_data):
    snapshot = slot_ref.get(transaction=transaction)
    if snapshot.exists and snapshot.get('status') == 'booked':
        raise Exception("Slot already booked")

    transaction.set(slot_ref, {
        'status': 'booked',
        'details': booking_data,
        'timestamp': firestore.SERVER_TIMESTAMP
    }, merge=True)

@app.route('/confirm-booking', methods=['POST'])
def confirm_booking():
    try:
        data = request.json
        slot_id = f"{data['room_id']}_{data['date']}_{data['time_slot']}"
        slot_ref = db.collection('daily_slots').document(slot_id)

        transaction = db.transaction()
        run_transaction(transaction, slot_ref, data)

        return jsonify({"status": "success", "message": "Booking Confirmed!"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/get-bookings', methods=['GET'])
def get_bookings():
    date = request.args.get('date')
    docs = db.collection('daily_slots').where('date', '==', date).stream()
    return jsonify({"booked_slots": [doc.to_dict().get('time_slot') for doc in docs]})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
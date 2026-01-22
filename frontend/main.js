let selectedSlot = null;
let selectedRoom = null;
let currentDayBookings = []; // Store the full booking data here

const BACKEND_URL = "https://nima-backend.vercel.app"; 

/* ---------------- DATE LOGIC ---------------- */
const bookingDate = document.getElementById("bookingDate");
const today = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 7);

bookingDate.min = today.toISOString().split("T")[0];
bookingDate.max = maxDate.toISOString().split("T")[0];
bookingDate.value = bookingDate.min;
bookingDate.addEventListener("change", generateTimeSlots);

/* ---------------- TIME SLOT LOGIC ---------------- */
const slotGrid = document.getElementById("slotGrid");

async function generateTimeSlots() {
    slotGrid.innerHTML = '<p style="color:#666; font-size:14px;">Loading slots...</p>';
    selectedSlot = null;
    selectedRoom = null;
    document.getElementById("roomGrid").innerHTML = '<p class="subtitle">Select a time slot first</p>';

    // 1. Fetch all bookings for this date (Rooms + Times)
    currentDayBookings = await fetchBookedSlots(bookingDate.value);
    
    slotGrid.innerHTML = ""; // Clear loading message

    const now = new Date();
    let startHour = 9; 

    // If today, hide past hours
    if (bookingDate.value === now.toISOString().split("T")[0]) {
        if (now.getHours() >= 9) {
            startHour = now.getHours() + 1;
        }
    }

    // 2. Generate Time Buttons
    for (let hour = startHour; hour < 18; hour++) {
        const slot = `${hour}:00-${hour + 1}:00`;
        const btn = document.createElement("button");
        btn.innerText = slot;
        btn.classList.add("slot-btn");
        btn.classList.add("free"); // Default to free

        // Check if ALL 4 rooms are booked for this slot
        const bookingsForThisSlot = currentDayBookings.filter(b => b.time_slot === slot);
        if (bookingsForThisSlot.length >= 4) {
            btn.classList.remove("free");
            btn.classList.add("booked"); // Turn red only if library is FULL
            btn.disabled = true;
        } else {
            btn.onclick = () => selectSlot(btn, slot);
        }

        slotGrid.appendChild(btn);
    }
}

async function fetchBookedSlots(date) {
    try {
        const res = await fetch(`${BACKEND_URL}/get-bookings?date=${date}`);
        const data = await res.json();
        return data.bookings || []; // Returns array of {time_slot, room_id}
    } catch (err) {
        console.error("Error fetching slots", err);
        return [];
    }
}

// Initialize
generateTimeSlots();

/* ---------------- SLOT SELECTION ---------------- */
function selectSlot(btn, time) {
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSlot = time;
    
    // Now show rooms, but disable the ones taken for THIS time
    loadRooms(time);
}

/* ---------------- ROOM LOGIC (The Fix) ---------------- */
const roomGrid = document.getElementById("roomGrid");

function loadRooms(timeSlot) {
    roomGrid.innerHTML = "";
    selectedRoom = null;

    const rooms = ["Room A", "Room B", "Room C", "Room D"];
    
    // Find which rooms are taken for the selected time
    const takenRooms = currentDayBookings
        .filter(booking => booking.time_slot === timeSlot)
        .map(booking => booking.room_id);

    rooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "room-btn";
        btn.innerText = room;

        if (takenRooms.includes(room)) {
            btn.classList.add("room-booked"); // Red & Disabled
            btn.disabled = true;
            btn.title = "Already booked for this time";
        } else {
            btn.onclick = () => selectRoom(btn, room);
        }
        
        roomGrid.appendChild(btn);
    });
}

function selectRoom(btn, room) {
    document.querySelectorAll(".room-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedRoom = room;
}

/* ---------------- GROUP SIZE LOGIC ---------------- */
const groupSizeSelect = document.getElementById("groupSize");
const groupMembersContainer = document.getElementById("groupMembersContainer");

groupSizeSelect.addEventListener("change", () => {
    groupMembersContainer.innerHTML = "";
    const size = parseInt(groupSizeSelect.value);

    if (!size || size < 1) return;

    for (let i = 1; i <= size; i++) {
        const memberDiv = document.createElement("div");
        memberDiv.className = "member-input-block";
        memberDiv.style.marginTop = "10px"; 

        memberDiv.innerHTML = `
            <h4 style="font-size: 14px; margin-bottom:5px;">Member ${i}</h4>
            <div class="input-group">
                <i class="fa-solid fa-user input-icon"></i>
                <input type="text" class="member-name" placeholder="Name" required style="margin-bottom: 5px;">
            </div>
            <div class="input-group">
                <i class="fa-solid fa-id-card input-icon"></i>
                <input type="text" class="member-roll" placeholder="Roll No" required>
            </div>
        `;
        groupMembersContainer.appendChild(memberDiv);
    }
});

function getGroupMembers() {
    const members = [];
    const nameInputs = document.querySelectorAll('.member-name');
    const rollInputs = document.querySelectorAll('.member-roll');

    nameInputs.forEach((input, index) => {
        const name = input.value.trim();
        const roll = rollInputs[index] ? rollInputs[index].value.trim() : "";
        if (name) members.push({ name: name, roll_no: roll });
    });
    return members;
}

/* ---------------- FINAL SUBMIT (Success Page Fix) ---------------- */
async function bookRoom() {
  if (!selectedSlot || !selectedRoom) {
    alert("Please select both a time slot and a room.");
    return;
  }

  const data = {
    leader_name: document.getElementById("leaderName").value,
    leader_roll_no: document.getElementById("rollNo").value,
    email: document.getElementById("email").value,
    contact: document.getElementById("contactNo").value,
    group_members: getGroupMembers(),
    institute: document.getElementById("institute").value,
    department: document.getElementById("department").value,
    program: document.getElementById("programme").value,
    purpose: document.getElementById("purpose").value,
    room_id: selectedRoom,
    date: document.getElementById("bookingDate").value,
    time_slot: selectedSlot
  };

  try {
    const res = await fetch(`${BACKEND_URL}/confirm-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.status === "success") {
      // ✅ REDIRECT TO SUCCESS PAGE
      window.location.href = "success.html";
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
}
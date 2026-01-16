let selectedSlot = null;
let selectedRoom = null;

// ✅ CONFIRM THIS IS YOUR VERCEL BACKEND URL
const BACKEND_URL = "https://nima-backend.vercel.app"; 

/* ---------------- DATE LOGIC ---------------- */
const bookingDate = document.getElementById("bookingDate");
const today = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 7);

// Set Min and Max dates
bookingDate.min = today.toISOString().split("T")[0];
bookingDate.max = maxDate.toISOString().split("T")[0];
bookingDate.value = bookingDate.min;
bookingDate.addEventListener("change", generateTimeSlots);

/* ---------------- TIME SLOT LOGIC ---------------- */
const slotGrid = document.getElementById("slotGrid");

async function generateTimeSlots() {
    slotGrid.innerHTML = "";
    selectedSlot = null;

    const bookedSlots = await fetchBookedSlots(bookingDate.value);

    const now = new Date();
    let startHour = 9; // Library opens at 9 AM

    // If looking at today, only show future slots
    if (bookingDate.value === now.toISOString().split("T")[0]) {
        const currentHour = now.getHours();
        if (currentHour >= 9) {
            startHour = currentHour + 1;
        }
    }

    for (let hour = startHour; hour < 18; hour++) {
        const slot = `${hour}:00-${hour + 1}:00`;
        const btn = document.createElement("button");

        btn.innerText = slot;
        btn.classList.add("slot-btn");

        if (bookedSlots.includes(slot)) {
            btn.classList.add("booked");
            btn.disabled = true;
        } else {
            btn.classList.add("free");
            btn.onclick = () => selectSlot(btn, slot);
        }

        slotGrid.appendChild(btn);
    }
}

async function fetchBookedSlots(date) {
    try {
        const res = await fetch(`${BACKEND_URL}/get-bookings?date=${date}`);
        const data = await res.json();
        return data.booked_slots || [];
    } catch (err) {
        console.error("Error fetching slots", err);
        return [];
    }
}

// Initialize slots on load
generateTimeSlots();

/* ---------------- SLOT SELECTION ---------------- */
function selectSlot(btn, time) {
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSlot = time;
    loadRooms();
}

/* ---------------- ROOM LOGIC ---------------- */
const roomGrid = document.getElementById("roomGrid");

function loadRooms() {
    roomGrid.innerHTML = "";
    selectedRoom = null;

    const rooms = ["Room A", "Room B", "Room C", "Room D"];
    
    // In a real app, you would fetch occupied rooms from backend too.
    // For now, we assume all rooms are open if the slot is free.
    
    rooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "room-btn";
        btn.innerText = room;

        btn.onclick = () => selectRoom(btn, room);
        
        roomGrid.appendChild(btn);
    });
}

function selectRoom(btn, room) {
    document.querySelectorAll(".room-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedRoom = room;
}

/* ---------------- GROUP SIZE LOGIC (Fixed) ---------------- */
const groupSizeSelect = document.getElementById("groupSize");
const groupMembersContainer = document.getElementById("groupMembersContainer");

groupSizeSelect.addEventListener("change", () => {
    // Clear existing members inputs
    groupMembersContainer.innerHTML = "";

    const size = parseInt(groupSizeSelect.value);

    if (!size || size < 1) {
        groupMembersContainer.innerHTML = `<p class="subtitle">Select group size to add member details</p>`;
        return;
    }

    for (let i = 1; i <= size; i++) {
        const memberDiv = document.createElement("div");
        memberDiv.className = "member-input-block";
        // Simple styling for spacing
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

/* ---------------- HELPER: GET MEMBERS (Added This!) ---------------- */
function getGroupMembers() {
    const members = [];
    // We grab all inputs with class 'member-name'
    const nameInputs = document.querySelectorAll('.member-name');
    const rollInputs = document.querySelectorAll('.member-roll');

    nameInputs.forEach((input, index) => {
        const name = input.value.trim();
        const roll = rollInputs[index] ? rollInputs[index].value.trim() : "";
        
        if (name) {
            members.push({ name: name, roll_no: roll });
        }
    });
    
    return members;
}

/* ---------------- FINAL SUBMIT ---------------- */
async function bookRoom() {
  // 1. Validation
  if (!selectedSlot || !selectedRoom) {
    alert("Please select both a time slot and a room.");
    return;
  }

  // 2. Prepare Data
  const data = {
    leader_name: document.getElementById("leaderName").value,
    leader_roll_no: document.getElementById("rollNo").value,
    email: document.getElementById("email").value,
    contact: document.getElementById("contactNo").value,
    group_members: getGroupMembers(), // ✅ Now this function exists!
    institute: document.getElementById("institute").value,
    department: document.getElementById("department").value,
    program: document.getElementById("programme").value,
    purpose: document.getElementById("purpose").value,
    room_id: selectedRoom,
    date: document.getElementById("bookingDate").value,
    time_slot: selectedSlot
  };

  // 3. Send to Backend
  try {
    const res = await fetch(`${BACKEND_URL}/confirm-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("🎉 Booking Confirmed!");
      window.location.reload();
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
}
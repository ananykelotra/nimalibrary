let selectedSlot = null;
let selectedRoom = null;
const BACKEND_URL = "https://nimalibrary.onrender.com";

/* ---------------- GROUP SIZE LOGIC ---------------- */
const groupSize = document.getElementById("groupSize");
const groupMembersDiv = document.getElementById("groupMembers");

groupSize.addEventListener("change", () => {
    const size = parseInt(groupSize.value);
    groupMembersDiv.innerHTML = "";

    // Unlock leader fields
    document.getElementById("leaderName").disabled = false;
    document.getElementById("rollNo").disabled = false;
    document.getElementById("email").disabled = false;
    document.getElementById("contactNo").disabled = false;

    // Generate member inputs
    for (let i = 1; i <= size; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Member ${i} Name`;
        input.name = `memberName${i}`;
        input.required = true;
        groupMembersDiv.appendChild(input);
    }
});

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
    slotGrid.innerHTML = "";
    selectedSlot = null;

    const bookedSlots = await fetchBookedSlots(bookingDate.value);

    const now = new Date();
    let startHour = now.getHours() + 1;

    if (bookingDate.value !== bookingDate.min) {
        startHour = 9;
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


bookingDate.addEventListener("change", generateTimeSlots);

/* ---------------- SLOT SELECTION ---------------- */
function selectSlot(btn, time) {
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSlot = time;
    loadRooms();
}

/* ---------------- ROOM LOGIC ---------------- */
const roomGrid = document.getElementById("roomGrid");

// MOCK occupied rooms (Firebase later)
const occupiedRooms = {
    "2026-01-06_16-17": ["Room A"],
    "2026-01-06_17-18": ["Room B"]
};

function loadRooms() {
    roomGrid.innerHTML = "";
    selectedRoom = null;

    const rooms = ["Room A", "Room B", "Room C", "Room D"];
    const key = `${bookingDate.value}_${selectedSlot}`;
    const blocked = occupiedRooms[key] || [];

    rooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "room-btn";
        btn.innerText = room;

        if (blocked.includes(room)) {
            btn.classList.add("room-booked");
            btn.disabled = true;
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

/* ---------------- FINAL SUBMIT ---------------- */
async function bookRoom() {
  // ---- validations ----
  if (!selectedSlot || !selectedRoom) {
    alert("Please select both time slot and room.");
    return;
  }

  const data = {
    leader_name: document.getElementById("leaderName").value,
    leader_roll_no: document.getElementById("rollNo").value,
    email: document.getElementById("email").value,
    contact: document.getElementById("contactNo").value,
    group_members: getGroupMembers(), // helper function
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
      alert(result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
}


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
        // Create member input block
        const memberDiv = document.createElement("div");
        memberDiv.className = "member-input-block";

        memberDiv.innerHTML = `
            <h4>Member ${i}</h4>
            <div class="input-group">
                <i class="fa-solid fa-user input-icon"></i>
                <input type="text" name="memberName${i}" placeholder="Member ${i} Name" required>
            </div>
            <div class="input-group">
                <i class="fa-solid fa-id-card input-icon"></i>
                <input type="text" name="memberRollNo${i}" placeholder="Member ${i} Roll No" required>
            </div>
        `;

        groupMembersContainer.appendChild(memberDiv);
    }
});


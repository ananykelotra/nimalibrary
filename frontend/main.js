let selectedSlot = null;
let selectedRoom = null;
let currentDayBookings = []; 

const BACKEND_URL = "https://nima-backend.vercel.app"; 

/* ---------------- DATE LOGIC ---------------- */
const bookingDate = document.getElementById("bookingDate");

function getLocalDateString(date) {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split("T")[0];
}

const today = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 7);

bookingDate.min = getLocalDateString(today);
bookingDate.max = getLocalDateString(maxDate);
bookingDate.value = bookingDate.min;
bookingDate.addEventListener("change", generateTimeSlots);

/* ---------------- TIME SLOT LOGIC ---------------- */
const slotGrid = document.getElementById("slotGrid");

async function generateTimeSlots() {
    slotGrid.innerHTML = '<p style="color:#666; font-size:14px;">Loading slots...</p>';
    selectedSlot = null;
    selectedRoom = null;
    document.getElementById("roomGrid").innerHTML = '<p class="subtitle">Select a time slot first</p>';

    currentDayBookings = await fetchBookedSlots(bookingDate.value);
    
    slotGrid.innerHTML = ""; 

    const now = new Date();
    let startHour = 9; 

    if (bookingDate.value === getLocalDateString(now)) {
        if (now.getHours() >= 9) {
            startHour = now.getHours() + 1;
        }
    }

    if (startHour >= 18) {
        slotGrid.innerHTML = '<p style="color: red; font-weight: 500;">Library is closed for today.</p>';
        return;
    }

    for (let hour = startHour; hour < 18; hour++) {
        const slot = `${hour}:00-${hour + 1}:00`;
        const btn = document.createElement("button");
        btn.innerText = slot;
        btn.classList.add("slot-btn");
        btn.classList.add("free"); 

        // Check if ALL 13 rooms are booked
        const bookingsForThisSlot = currentDayBookings.filter(b => b.time_slot === slot);
        if (bookingsForThisSlot.length >= 13) {
            btn.classList.remove("free");
            btn.classList.add("booked");
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
        return data.bookings || []; 
    } catch (err) {
        console.error(err);
        return [];
    }
}

generateTimeSlots();

/* ---------------- SLOT SELECTION ---------------- */
function selectSlot(btn, time) {
    document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedSlot = time;
    loadRooms(time);
}

/* ---------------- ROOM LOGIC (UPDATED FLOORS) ---------------- */
const roomGrid = document.getElementById("roomGrid");

function loadRooms(timeSlot) {
    roomGrid.innerHTML = "";
    selectedRoom = null;

    // ✅ NEW ROOM LIST
    const allRooms = [
        // Floor 5
        "501", "502", "503", "504", "505", "506", "507",
        // Floor 6
        "601", "602",
        // Floor 7
        "701", "702",
        // Floor 8
        "801", "802"
    ];
    
    const takenRooms = currentDayBookings
        .filter(booking => booking.time_slot === timeSlot)
        .map(booking => booking.room_id);

    allRooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "room-btn";
        btn.innerText = room;

        // Visual separation for floors (Optional tweak)
        if (room.endsWith("01")) {
            btn.style.marginLeft = "5px"; 
        }

        if (takenRooms.includes(room)) {
            btn.classList.add("room-booked"); 
            btn.disabled = true;
            btn.title = "Booked";
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
        const div = document.createElement("div");
        div.className = "member-input-block";
        div.style.marginTop = "10px"; 
        div.innerHTML = `
            <h4 style="font-size:14px; margin-bottom:5px;">Member ${i}</h4>
            <div class="input-group"><i class="fa-solid fa-user input-icon"></i><input type="text" class="member-name" placeholder="Name" required></div>
            <div class="input-group"><i class="fa-solid fa-id-card input-icon"></i><input type="text" class="member-roll" placeholder="Roll No" required></div>
        `;
        groupMembersContainer.appendChild(div);
    }
});

function getGroupMembers() {
    const members = [];
    const nameInputs = document.querySelectorAll('.member-name');
    const rollInputs = document.querySelectorAll('.member-roll');
    nameInputs.forEach((input, index) => {
        if (input.value.trim()) {
            members.push({ name: input.value.trim(), roll_no: rollInputs[index]?.value.trim() });
        }
    });
    return members;
}

/* ---------------- FINAL SUBMIT ---------------- */
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
      // ✅ SAVE DATA FOR SUCCESS PAGE
      localStorage.setItem("bookingReceipt", JSON.stringify(data));
      window.location.href = "success.html";
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
}
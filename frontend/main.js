let selectedSlot = null;

// ✅ CONFIRM THIS IS YOUR VERCEL BACKEND URL
const BACKEND_URL = "https://nima-backend.vercel.app"; 
const roomsByFloor = {
  "5th Floor": ["D501", "D502", "D503", "D504", "D505", "D506", "D507"],
  "6th Floor": ["D601", "D602"],
  "7th Floor": ["D701", "D702"],
  "8th Floor": ["D801", "D802"]
};

let selectedRoom = null;

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
function selectSlot(slot) {
  selectedSlot = slot;

  // frontend-only assumption: all rooms free
  const allRooms = Object.values(roomsByFloor).flat();
  renderRooms(allRooms);
}

/* ---------------- ROOM LOGIC ---------------- */
const roomGrid = document.getElementById("roomGrid");

function renderRooms(availableRooms) {
  const grid = document.getElementById("roomGrid");
  grid.innerHTML = "";

  Object.entries(roomsByFloor).forEach(([floor, rooms]) => {
    const floorTitle = document.createElement("h5");
    floorTitle.className = "floor-title";
    floorTitle.innerText = floor;

    grid.appendChild(floorTitle);

    rooms.forEach(room => {
      const btn = document.createElement("button");
      btn.className = "room-btn";
      btn.innerText = room;

      if (!availableRooms.includes(room)) {
        btn.classList.add("booked");
        btn.disabled = true;
      } else {
        btn.onclick = () => selectRoom(room, btn);
      }

      grid.appendChild(btn);
    });
  });
}

function selectRoom(room, btn) {
  document.querySelectorAll(".room-btn").forEach(b =>
    b.classList.remove("selected")
  );

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
function bookRoom() {
  if (!selectedSlot || !selectedRoom) {
    alert("Please select date, time slot and room");
    return;
  }

  const bookingData = {
    leader_name: document.getElementById("leaderName").value,
    leader_roll_no: document.getElementById("rollNo").value,
    email: document.getElementById("email").value,
    contact: document.getElementById("contactNo").value,
    group_members: "Temporary", // you can refine later
    institute: document.getElementById("institute").value,
    department: document.getElementById("department").value,
    program: document.getElementById("programme").value,
    purpose: document.getElementById("purpose").value,
    room_id: selectedRoom,
    date: document.getElementById("bookingDate").value,
    time_slot: selectedSlot
  };

  // TEMP: store locally for success page
  localStorage.setItem("bookingData", JSON.stringify(bookingData));

  // ✅ THIS IS THE MISSING PART
  window.location.href = "/frontend/success.html";
}

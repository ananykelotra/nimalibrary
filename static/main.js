let selectedSlot = null;
let selectedRoom = null;

/* ---------------- GROUP SIZE LOGIC ---------------- */
const groupSize = document.getElementById("groupSize");
groupSize.addEventListener("change", () => {
    document.getElementById("leaderName").disabled = false;
    document.getElementById("rollNo").disabled = false;
});

/* ---------------- DATE LOGIC ---------------- */
const bookingDate = document.getElementById("bookingDate");
const today = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 7);

bookingDate.min = today.toISOString().split("T")[0];
bookingDate.max = maxDate.toISOString().split("T")[0];
bookingDate.value = bookingDate.min;

/* ---------------- TIME SLOT LOGIC ---------------- */
const slotGrid = document.getElementById("slotGrid");

function generateTimeSlots() {
    slotGrid.innerHTML = "";
    selectedSlot = null;

    const now = new Date();
    let startHour = now.getHours() + 1;

    if (bookingDate.value !== bookingDate.min) {
        startHour = 9; // full day if future date
    }

    for (let hour = startHour; hour < 18; hour++) {
        const btn = document.createElement("button");
        btn.className = "slot-btn free";
        btn.innerText = `${hour}:00 - ${hour + 1}:00`;

        btn.onclick = () => selectSlot(btn, `${hour}-${hour + 1}`);
        slotGrid.appendChild(btn);
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
function bookRoom() {
    if (!selectedSlot || !selectedRoom) {
        alert("Please select date, time slot and room");
        return;
    }

    const bookingData = {
        leaderName: leaderName.value,
        rollNo: rollNo.value,
        date: bookingDate.value,
        timeSlot: selectedSlot,
        room: selectedRoom
    };

    console.log("Booking Ready:", bookingData);
    alert("Frontend logic complete. Ready for Firebase");
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


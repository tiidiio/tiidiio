const SERVER_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:3000"
    : "https://tiidiio.onrender.com";

const socket = io(SERVER_URL);

// ================= STATE =================
let running = false;
let multiplier = 1;
let bet = 0;
let cashedOut = false;

// ================= UI =================
const btn = document.getElementById("actionBtn");
const multDisplay = document.getElementById("multiplier");
const betInput = document.getElementById("betInput");
const historyBar = document.getElementById("historyBar");
const plane = document.getElementById("plane");

// ================= CONNECT =================
socket.on("connect", () => {
  console.log("✅ CONNECTED TO SERVER");
});

// ================= START ROUND =================
socket.on("start", () => {
  running = true;
  cashedOut = false;
  multiplier = 1;

  btn.innerText = "CASHOUT";
});

// ================= MULTIPLIER =================
socket.on("multiplier", (m) => {
  if (!running) return;

  multiplier = parseFloat(m);

  multDisplay.innerText = multiplier.toFixed(2) + "x";

  // animation avion
  plane.style.transform = `translate(${multiplier * 8}px, -${multiplier * 6}px)`;
});

// ================= CRASH =================
socket.on("crash", (m) => {
  running = false;

  btn.innerText = "MISER";
  multDisplay.innerText = "CRASH 💥 " + m;

  addHistory(m);
});

// ================= BET =================
btn.onclick = () => {
  if (!running) {
    bet = parseFloat(betInput.value);

    if (!bet || bet <= 0) return;

    socket.emit("bet", {
      userId: "u1",
      bet: bet
    });

    return;
  }

  if (running && !cashedOut) {
    cashedOut = true;

    socket.emit("cashout", {
      userId: "u1",
      multiplier
    });

    btn.innerText = "GAIN " + (bet * multiplier).toFixed(2);
  }
};

// ================= HISTORY =================
function addHistory(value) {
  const span = document.createElement("span");
  span.innerText = value.toFixed(2) + "x";

  historyBar.appendChild(span);

  if (historyBar.children.length > 10) {
    historyBar.removeChild(historyBar.firstChild);
  }
}

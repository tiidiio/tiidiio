const socket = io();

// ================= STATE =================
let running = false;
let bet = 0;
let cashedOut = false;
let multiplier = 1;

// ================= ELEMENTS =================
const btn = document.getElementById("actionBtn");
const plane = document.getElementById("plane");
const multDisplay = document.getElementById("multiplier");
const betInput = document.getElementById("betInput");
const historyBar = document.getElementById("historyBar");

// ================= QUICK BET =================
function setBet(value) {
  betInput.value = value;
}
window.setBet = setBet;

// ================= BUTTON =================
btn.onclick = () => {

  // 🎯 MISER
  if (!running) {

    bet = parseFloat(betInput.value);

    if (!bet || bet <= 0) return;

    cashedOut = false;
    btn.innerText = "EN COURS...";

    socket.emit("bet", { bet });

    return;
  }

  // 💰 CASHOUT
  if (running && !cashedOut) {

    cashedOut = true;

    socket.emit("cashout", { multiplier });

    btn.innerText = "GAIN " + (bet * multiplier).toFixed(2);

  }
};

// ================= SOCKET EVENTS =================

// 🚀 ROUND START
socket.on("start", () => {

  running = true;
  cashedOut = false;
  multiplier = 1;

  btn.innerText = "CASHOUT";

  plane.style.transform = "translate(0px,0px)";
});

// 📈 MULTIPLIER LIVE
socket.on("multiplier", (m) => {

  if (!running) return;

  multiplier = parseFloat(m);

  multDisplay.innerText = multiplier.toFixed(2) + "x";

  // ✈️ avion suit progression
  let x = multiplier * 8;
  let y = multiplier * 6;

  plane.style.transform = `translate(${x}px, -${y}px)`;
});

// 💥 CRASH
socket.on("crash", (value) => {

  running = false;

  multDisplay.innerText = "CRASH 💥 " + value;

  btn.innerText = "MISER";

  showCrash();

  addHistory(value);
});

// ================= CRASH EFFECT =================
function showCrash() {

  const boom = document.createElement("div");
  boom.innerText = "💥";
  boom.style.position = "absolute";
  boom.style.top = "50%";
  boom.style.left = "50%";
  boom.style.fontSize = "60px";
  boom.style.transform = "translate(-50%, -50%)";
  boom.style.animation = "boom 0.6s ease-out";

  document.querySelector(".plane-area").appendChild(boom);

  setTimeout(() => boom.remove(), 600);
}

// ================= HISTORY =================
function addHistory(value) {

  const span = document.createElement("span");
  span.innerText = value.toFixed(2) + "x";

  historyBar.appendChild(span);

  if (historyBar.children.length > 10) {
    historyBar.removeChild(historyBar.firstChild);
  }
}

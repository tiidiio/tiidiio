console.log("JS chargé ✔");

const socket = io();

// ================= DOM =================
const multiplierText = document.getElementById("multiplier");
const plane = document.getElementById("plane");
const status = document.getElementById("status");
const btn = document.getElementById("actionBtn");
const betInput = document.getElementById("bet");

// ================= STATE =================
let bet = 0;
let canCashout = false;
let cashed = false;

// ================= SOCKET =================
socket.on("connect", () => {
  console.log("Socket connecté ✔");
});

// recevoir multiplicateur du serveur
socket.on("multiplier", (m) => {

  // afficher multiplier
  multiplierText.innerText = m.toFixed(2) + "x";

  // animation avion simple
  const x = Math.pow(m, 1.2) * 10;
  const y = -Math.pow(m, 1.1) * 4;

  plane.style.transform = `translate(${x}px, ${y}px)`;

  // profit live
  if (canCashout && !cashed) {
    status.innerText = "💸 " + (bet * m).toFixed(2);
  }
});

// crash
socket.on("crash", (point) => {
  status.innerText = "💥 CRASH à " + point.toFixed(2);

  reset();
});

// ================= ACTION =================
function action() {

  // BET
  if (!canCashout) {

    bet = Number(betInput.value);

    if (!bet || bet <= 0) {
      status.innerText = "❌ mise invalide";
      return;
    }

    canCashout = true;
    cashed = false;

    btn.innerText = "CASHOUT";
    status.innerText = "✅ Bet placé";

    return;
  }

  // CASHOUT
  if (canCashout && !cashed) {

    cashed = true;

    const win = bet * parseFloat(multiplierText.innerText);

    status.innerText = "💰 WIN: " + win.toFixed(2);

    btn.innerText = "BET";
  }
}

// ================= RESET =================
function reset() {
  canCashout = false;
  cashed = false;
  bet = 0;

  btn.innerText = "BET";
}

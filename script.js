const socket = io("http://127.0.0.1:3000");

let running = false;
let multiplier = 1;

// UI
const btn = document.getElementById("actionBtn");
const multDisplay = document.getElementById("multiplier");

// CONNECT
socket.on("connect", () => {
  console.log("CONNECTED TO SERVER");
});

// START ROUND
socket.on("start", () => {
  running = true;
  btn.innerText = "CASHOUT";
});

// MULTIPLIER
socket.on("multiplier", (m) => {
  multiplier = Number(m);
  multDisplay.innerText = m + "x";
});

// CRASH
socket.on("crash", (m) => {
  running = false;
  btn.innerText = "MISER";
  multDisplay.innerText = "CRASH 💥 " + m;
});

// BUTTON
btn.onclick = () => {
  if (!running) {
    socket.emit("bet", { userId: "u1", bet: 100 });
    return;
  }

  socket.emit("cashout", {
    userId: "u1",
    multiplier
  });
};

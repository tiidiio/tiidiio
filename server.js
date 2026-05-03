const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// ================= MONGODB =================
mongoose.connect(
  "mongodb+srv://tidianesdiallo_db_usertiidiiouser:koumantou@cluster0.38tbpuz.mongodb.net/tiidiio?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log("✅ MongoDB connecté"))
.catch(err => console.log("❌ DB error", err));

// ================= GAME =================
let m = 1;
let crashPoint = 0;
let startTime = 0;
let running = false;

function startRound() {
  m = 1;
  startTime = Date.now();

  crashPoint = Math.random() * 6 + 2;
  running = true;

  console.log("🎮 Round start | crash =", crashPoint.toFixed(2));

  loop();
}

function loop() {
  if (!running) return;

  const elapsed = (Date.now() - startTime) / 1000;

  m = Math.exp(elapsed * 0.28);

  io.emit("multiplier", m);

  if (m >= crashPoint) {
    running = false;

    io.emit("crash", crashPoint);

    setTimeout(startRound, 2000);
    return;
  }

  setTimeout(loop, 50);
}

io.on("connection", (socket) => {
  console.log("👤 client connecté");
});

server.listen(3000, () => {
  console.log("🚀 JetX PRO READY http://localhost:3000");
});

startRound();

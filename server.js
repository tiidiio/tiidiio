const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/* ================= MONGO ================= */
mongoose.connect(
  "mongodb+srv://tidianesdiallo_db_usertiidiiouser:koumantou@cluster0.38tbpuz.mongodb.net/tiidiio?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log("✅ MongoDB OK"))
.catch(err => console.log("❌ DB error", err));

/* ================= GAME STATE ================= */
let multiplier = 1;
let crashPoint = 0;
let running = false;
let interval = null;

/* ================= ROUND SYSTEM ================= */
function startRound() {

  multiplier = 1;
  running = true;

  // 🎯 crash contrôlé (plus réaliste JetX)
  crashPoint = +(Math.random() * 5 + 1.5).toFixed(2);

  console.log("🎮 ROUND START | crash =", crashPoint);

  interval = setInterval(gameLoop, 50);
}

function gameLoop() {

  if (!running) return;

  // 📈 courbe exponentielle (style Aviator réel)
  multiplier *= 1.02;

  io.emit("multiplier", multiplier.toFixed(2));

  // 💥 CRASH
  if (multiplier >= crashPoint) {

    clearInterval(interval);
    running = false;

    io.emit("crash", crashPoint);

    console.log("💥 CRASH AT", crashPoint);

    setTimeout(startRound, 3000);
  }
}

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("👤 joueur connecté");

  socket.emit("welcome", {
    multiplier,
    running
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 JetX PRO running on port " + PORT);
  startRound();
});

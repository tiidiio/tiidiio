const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  pingInterval: 10000,
  pingTimeout: 5000
});

// ================= SECURITY =================
app.use(helmet());
app.use(express.json());

// basic anti-spam HTTP
app.use(rateLimit({
  windowMs: 1000,
  max: 20
}));

// ================= FRONTEND =================
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/ping", (req, res) => {
  res.send("PONG");
});

// ================= SAFE MEMORY DB =================
const users = new Map();

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      balance: 0,
      bet: 0,
      inGame: false,
      lastAction: 0
    });
  }
  return users.get(id);
}

// ================= ANTI CHEAT HELPERS =================
function validateBet(bet) {
  return typeof bet === "number" && bet > 0 && bet <= 100000;
}

function rateLimitAction(user) {
  const now = Date.now();
  if (now - user.lastAction < 300) return false;
  user.lastAction = now;
  return true;
}

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("👤 CONNECTED:", socket.id);

  socket.on("bet", ({ userId, bet }) => {
    const user = getUser(userId);

    if (!rateLimitAction(user)) return;

    bet = Number(bet);

    if (!validateBet(bet)) {
      socket.emit("error", "Invalid bet");
      return;
    }

    if (user.balance < bet) {
      socket.emit("error", "Insufficient balance");
      return;
    }

    user.balance -= bet;
    user.bet = bet;
    user.inGame = true;

    socket.emit("betAccepted", {
      balance: user.balance
    });
  });

  socket.on("cashout", ({ userId, multiplier }) => {
    const user = getUser(userId);

    if (!user.inGame) return;

    multiplier = Number(multiplier);

    // anti cheat multiplier clamp
    if (multiplier < 1 || multiplier > 10) return;

    const win = user.bet * multiplier;

    user.balance += win;
    user.inGame = false;

    socket.emit("win", {
      amount: win,
      balance: user.balance
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ DISCONNECTED:", socket.id);
  });
});

// ================= CRASH ENGINE (SERVER CONTROLLED) =================
function startRound() {
  let multiplier = 1;

  const crashPoint = +(Math.random() * 5 + 1).toFixed(2);

  console.log("🎮 ROUND START | crash =", crashPoint);

  io.emit("start");

  const interval = setInterval(() => {
    multiplier *= 1.015;

    // clamp (anti exploit)
    if (multiplier > 100) multiplier = 100;

    io.emit("multiplier", multiplier.toFixed(2));

    if (multiplier >= crashPoint) {
      clearInterval(interval);

      io.emit("crash", crashPoint);

      console.log("💥 CRASH AT", crashPoint);

      setTimeout(startRound, 3000);
    }
  }, 50);
}

// ================= GLOBAL SAFETY =================
process.on("uncaughtException", (err) => {
  console.log("❌ CRASH SAFE:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("❌ PROMISE SAFE:", err);
});

// ================= START =================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 SERVER RUNNING ON PORT", PORT);
  startRound();
});

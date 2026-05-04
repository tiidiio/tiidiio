const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// ================= ROUTE TEST =================
app.get("/ping", (req, res) => {
  res.send("PONG");
});

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("👤 FRONTEND CONNECTED");

  socket.on("bet", (data) => {
    console.log("BET RECEIVED:", data);

    socket.emit("betAccepted", {
      balance: 1000
    });
  });

  socket.on("cashout", (data) => {
    console.log("CASHOUT:", data);

    socket.emit("win", {
      amount: data.multiplier * 100
    });
  });
});

// ================= CRASH ENGINE =================
function startRound() {
  let m = 1;

  io.emit("start");

  const interval = setInterval(() => {
    m *= 1.02;

    io.emit("multiplier", m.toFixed(2));

    if (m > 3) {
      clearInterval(interval);

      io.emit("crash", m.toFixed(2));

      setTimeout(startRound, 3000);
    }
  }, 50);
}

// ================= START SERVER =================
server.listen(3000, "0.0.0.0", () => {
  console.log("🚀 SERVER RUNNING ON 3000");
  startRound();
});

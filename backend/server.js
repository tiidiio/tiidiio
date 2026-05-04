const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("JETX OK 🚀");
});

app.get("/ping", (req, res) => {
  res.send("PONG");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("SERVER RUNNING 3000");
});


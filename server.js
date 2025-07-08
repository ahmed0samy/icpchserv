import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://urch.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const client = createClient({
  username: "default",
  password: "8rjiNIk1BIpQkJtANTrvlChawSMUAQkc",
  socket: {
    host: "redis-10642.crce176.me-central-1-1.ec2.redns.redis-cloud.com",
    port: 10642,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

async function startServer() {
  await client.connect();

  io.on("connection", (socket) => {
    const id = socket.id;

    
    socket.on("admin-init", async () => {
      const entries = await client.hGetAll("activeUsers");
      for (const [id, signalStr] of Object.entries(entries)) {
        const signal = JSON.parse(signalStr);
        socket.emit("incoming-stream", { id, signal });
      }
    });

    client.hSet("users", id, Date.now());

    socket.on("user-ready", (signal) => {
      client.hSet("activeUsers", socket.id, JSON.stringify(signal));

      // Broadcast to existing admins
      io.emit("incoming-stream", { id: socket.id, signal });
    });

    socket.on("admin-answer", ({ id: targetId, signal }) => {
      io.to(targetId).emit("admin-accepted", signal);
    });

    socket.on("disconnect", () => {
      client.hDel("users", id);
    });
  });

  server.listen(3001, () => {
    console.log("Signaling server running on http://localhost:3001");
  });
}

startServer();

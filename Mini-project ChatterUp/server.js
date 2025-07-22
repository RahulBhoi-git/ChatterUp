import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { connectUsingMongoose } from "./src/config/db.js";
import { handleSocketConnection } from "./src/socket/socket.handler.js";
import avatarRouter from "./src/features/avatar/avatar.route.js";
import { User } from "./src/features/user/user.schema.js";
import { UserRepository } from "./src/features/user/user.repository.js";

const userRepository=new UserRepository()
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3100", // Update if frontend runs elsewhere
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global in-memory map (key: username)
global.users = {};

// Middlewares
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Avatar access

// Routes
app.use("/api/avatar", avatarRouter);

// Connect to MongoDB and preload users
const PORT = process.env.PORT || 3100;
connectUsingMongoose()
  .then(async () => {
    // Load existing users from DB (username + avatarUrl only)
    const usersFromDB = await User.find();

    usersFromDB.forEach(user => {
      userRepository.addUser(user.socketId,{
        username:user.username,
        avatarUrl:user.avatarUrl
      })
    });

    console.log("Users restored from database");

    // Socket setup
    io.on("connection", (socket) => {
      handleSocketConnection(io, socket);
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });

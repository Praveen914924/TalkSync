const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const Message = require("./models/Message");

const app = express();

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Uploaded Files
// ===============================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// ===============================
// MongoDB
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((error) => {
    console.log("❌ MongoDB Error:", error.message);
  });

// ===============================
// API Routes
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ===============================
// HTTP SERVER
// ===============================

const server = http.createServer(app);

// ===============================
// SOCKET.IO
// ===============================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  // ===============================
  // USER ONLINE
  // ===============================

  socket.on("user_online", (userId) => {
    if (!userId) return;

    onlineUsers.set(userId, socket.id);

    io.emit(
      "online_users",
      Array.from(onlineUsers.keys())
    );

    io.emit("user_online", userId);

    console.log("🟢 User Online:", userId);
  });

  // ===============================
  // SEND MESSAGE
  // ===============================

  socket.on("send_message", async (data) => {
    try {
      if (
        !data ||
        !data.sender ||
        !data.receiver ||
        !data.text
      ) {
        return;
      }

      const savedMessage = await Message.create({
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
      });

      const messageData = {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        receiver: savedMessage.receiver,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };

      io.emit("receive_message", messageData);

      console.log("💬 Message Sent");
    } catch (error) {
      console.error(
        "❌ Message Save Error:",
        error.message
      );
    }
  });

  // ===============================
  // TYPING
  // ===============================

  socket.on("typing", (data) => {
    if (
      !data ||
      !data.senderId ||
      !data.receiverId
    ) {
      return;
    }

    const receiverSocket =
      onlineUsers.get(data.receiverId);

    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", {
        senderId: data.senderId,
        isTyping: data.isTyping,
      });
    }
  });

  // ===============================
  // DISCONNECT
  // ===============================

  socket.on("disconnect", () => {
    let disconnectedUser = null;

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      io.emit(
        "user_offline",
        disconnectedUser
      );

      io.emit(
        "online_users",
        Array.from(onlineUsers.keys())
      );

      console.log(
        "🔴 User Offline:",
        disconnectedUser
      );
    }

    console.log(
      "🔴 Socket Disconnected:",
      socket.id
    );
  });
});

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "TalkSync Backend Running",
  });
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});
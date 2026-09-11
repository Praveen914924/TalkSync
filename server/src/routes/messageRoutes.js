const express = require("express");
const router = express.Router();

const Message = require("../models/Message");

// =====================================================
// GET CHAT MESSAGES
// =====================================================

router.get("/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        {
          sender: user1,
          receiver: user2,
        },
        {
          sender: user2,
          receiver: user1,
        },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);

    res.status(500).json({
      message: "Failed to fetch messages",
    });
  }
});

// =====================================================
// SAVE MESSAGE
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      sender,
      receiver,
      text,
      file,
    } = req.body;

    if (!sender || !receiver) {
      return res.status(400).json({
        message: "Sender and receiver are required",
      });
    }

    if (!text && !file) {
      return res.status(400).json({
        message: "Message or file is required",
      });
    }

    const newMessage = new Message({
      sender,
      receiver,
      text: text || "",
      file: file || null,
      seen: false,
    });

    const savedMessage =
      await newMessage.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(
      "Save Message Error:",
      error
    );

    res.status(500).json({
      message: "Failed to save message",
    });
  }
});

// =====================================================
// MARK MESSAGES AS SEEN
// =====================================================

router.put(
  "/seen/:senderId/:receiverId",
  async (req, res) => {
    try {
      const {
        senderId,
        receiverId,
      } = req.params;

      await Message.updateMany(
        {
          sender: senderId,
          receiver: receiverId,
          seen: false,
        },
        {
          $set: {
            seen: true,
          },
        }
      );

      res.json({
        message: "Messages marked as seen",
      });
    } catch (error) {
      console.error(
        "Mark Seen Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to mark messages as seen",
      });
    }
  }
);

module.exports = router;
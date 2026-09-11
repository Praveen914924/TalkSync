const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Temporary OTP storage
const resetOtps = new Map();

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ===============================
// SEND RESET OTP
// ===============================

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    resetOtps.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "TalkSync Password Reset OTP",
      text: `Your TalkSync password reset OTP is ${otp}. This OTP is valid for 5 minutes.`,
    });

    res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

// ===============================
// RESET PASSWORD
// ===============================

router.post("/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const resetData = resetOtps.get(email);

    if (!resetData) {
      return res.status(400).json({
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (Date.now() > resetData.expiresAt) {
      resetOtps.delete(email);

      return res.status(400).json({
        message: "OTP expired. Please request a new OTP",
      });
    }

    if (resetData.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    resetOtps.delete(email);

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    res.status(500).json({
      message: "Failed to reset password",
    });
  }
});

module.exports = router;
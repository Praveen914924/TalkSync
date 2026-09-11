const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();


// ======================================================
// OTP STORAGE
// ======================================================

const otpStore = new Map();


// ======================================================
// GMAIL SMTP
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});


// ======================================================
// SEND OTP
// ======================================================

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email"
      });
    }

    // Generate 6 digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // OTP expires after 5 minutes
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt,
      verified: false
    });

    // Send email
    await transporter.sendMail({
      from: `"TalkSync" <${process.env.GMAIL_USER}>`,
      to: normalizedEmail,
      subject: "TalkSync - Email Verification OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 30px;
          background: #f5f7fb;
          border-radius: 12px;
        ">

          <h2 style="color: #2563eb;">
            TalkSync Email Verification
          </h2>

          <p>
            Your OTP for creating a TalkSync account is:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #111827;
            background: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for <strong>5 minutes</strong>.
          </p>

          <p style="color: #6b7280;">
            If you did not request this OTP, you can safely ignore this email.
          </p>

          <hr />

          <p style="
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
          ">
            © 2026 TalkSync
          </p>

        </div>
      `
    });

    console.log(`OTP sent to ${normalizedEmail}`);

    res.status(200).json({
      message: "OTP sent successfully"
    });

  } catch (error) {

    console.error("Send OTP Error:", error);

    // Remove OTP if email sending failed
    const email = req.body.email?.trim().toLowerCase();

    if (email) {
      otpStore.delete(email);
    }

    res.status(500).json({
      message: "Failed to send OTP"
    });
  }
});


// ======================================================
// VERIFY OTP
// ======================================================

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const storedData = otpStore.get(normalizedEmail);

    if (!storedData) {
      return res.status(400).json({
        message: "OTP not found. Please request a new OTP."
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {

      otpStore.delete(normalizedEmail);

      return res.status(400).json({
        message: "OTP expired. Please request a new OTP."
      });
    }

    // Check OTP
    if (storedData.otp !== otp.toString().trim()) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // Mark as verified
    storedData.verified = true;

    otpStore.set(normalizedEmail, storedData);

    res.status(200).json({
      message: "Email verified successfully"
    });

  } catch (error) {

    console.error("Verify OTP Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      otp
    } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        message: "Name, email, password and OTP are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check OTP verification
    const storedData = otpStore.get(normalizedEmail);

    if (!storedData) {
      return res.status(400).json({
        message: "Please verify your email first"
      });
    }

    if (!storedData.verified) {
      return res.status(400).json({
        message: "Please verify your OTP first"
      });
    }

    // Check OTP expiry
    if (Date.now() > storedData.expiresAt) {

      otpStore.delete(normalizedEmail);

      return res.status(400).json({
        message: "OTP expired. Please request a new OTP."
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {

      otpStore.delete(normalizedEmail);

      return res.status(409).json({
        message: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // Delete OTP after successful registration
    otpStore.delete(normalizedEmail);

    res.status(201).json({
      message: "User registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error("Register Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error("Login Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ======================================================
// GET ALL USERS
// ======================================================

router.get("/users", async (req, res) => {
  try {

    const users = await User.find()
      .select("-password")
      .sort({
        name: 1
      });

    res.json(users);

  } catch (error) {

    console.error("Get Users Error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("File type not supported"),
      false
    );
  }
};

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================================================
// UPLOAD
// =====================================================

router.post(
  "/",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
        });
      }

      res.status(201).json({
        message:
          "File uploaded successfully",

        file: {
          url: `/uploads/${req.file.filename}`,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error(
        "Upload Error:",
        error
      );

      res.status(500).json({
        message:
          "File upload failed",
      });
    }
  }
);

module.exports = router;
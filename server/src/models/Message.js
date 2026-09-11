const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    file: {
      url: {
        type: String,
        default: null,
      },

      name: {
        type: String,
        default: null,
      },

      type: {
        type: String,
        default: null,
      },

      size: {
        type: Number,
        default: null,
      },
    },

    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
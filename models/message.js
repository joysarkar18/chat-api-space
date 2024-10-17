const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  delivered: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema);

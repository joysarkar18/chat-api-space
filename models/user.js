const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  notificationToken: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);

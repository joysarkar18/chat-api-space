// models/user.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true, // Ensure phone number is unique
  },
  uid: {
    type: String,
    required: true,
    unique: true, // Ensure phone number is unique
  },
  name: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'Hey there! I am using Space Chat.',
  },
  profilePic: {
    type: String,
    default: '', // Default profile picture URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  notificationToken: {
    type: String,
    required: true,
    default:""
  },
});

module.exports = mongoose.model('User', UserSchema);

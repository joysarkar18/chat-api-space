const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const User = require('./models/user');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require('./private.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Express app
const app = express();
app.use(bodyParser.json()); // Parse JSON bodies

// Firebase Authentication Middleware
const authenticateFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract JWT from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  try {
    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded token to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token', error });
  }
};

// User Registration API
app.post('/register', authenticateFirebaseToken, async (req, res) => {
  const { phoneNumber, notificationToken } = req.body;

  if (!phoneNumber || !notificationToken) {
    return res.status(400).json({ message: 'Phone number and notification token are required' });
  }

  try {
    // Check if the user already exists
    let user = await User.findOne({ phoneNumber });

    if (user) {
      // Update existing user's notification token
      user.notificationToken = notificationToken;
    } else {
      // Create a new user
      user = new User({
        phoneNumber,
        notificationToken,
      });
    }

    await user.save();
    res.status(201).json({ status: true, message: 'User registered successfully', user  });
  } catch (error) {
    res.status(500).json({status: false, message: 'Server error', error });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

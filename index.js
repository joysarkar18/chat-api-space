const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const User = require('./models/user');
const http = require('http'); // Import HTTP to create server
const { Server } = require('socket.io'); // Import Socket.IO

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

// Create HTTP server and pass the app instance
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = new Server(server, {
  cors: {
    origin: "*", // Add allowed origins here
    methods: ["GET", "POST"]
  }
});

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

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join specific room (for one-to-one chat)
  socket.on('join', ({ userId, targetUserId }) => {
    const room = getRoomId(userId, targetUserId);
    socket.join(room);
    console.log(`User ${userId} joined room ${room}`);
  });

  // Handle incoming messages
  socket.on('send_message', ({ senderId, receiverId, message }) => {
    const room = getRoomId(senderId, receiverId);
    io.to(room).emit('receive_message', { senderId, message });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to create a room ID for two users
function getRoomId(userId, targetUserId) {
  return [userId, targetUserId].sort().join('_'); // Generate unique room ID for two users
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

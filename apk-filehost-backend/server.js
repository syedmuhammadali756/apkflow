// Force Google DNS for MongoDB Atlas SRV resolution (local only)
try {
  const dns = require('dns');
  if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }
} catch (e) {
  // Ignore DNS errors in serverless environments
}

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const downloadRoutes = require('./routes/download');

// Initialize Express app
const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ========== DATABASE (cached for serverless) ==========
const MONGO_URI = process.env.MONGO_URI;
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  if (!MONGO_URI) {
    console.error('ERROR: MONGO_URI is not defined');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Connect DB BEFORE any route runs
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/d', downloadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'APK FileHost API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'APK FileHost API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      files: '/api/files',
      download: '/d/:fileId'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ========== LOCAL SERVER ==========
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Export for Vercel serverless
module.exports = app;

const express = require('express');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const setupSocket = require('./src/config/socket');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
const { apiLimiter, authLimiter, messageLimiter } = require('./src/middleware/rateLimiter');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = setupSocket(server);
app.set('io', io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// 🔥 UPDATED: Base64 images ke liye limit barha di gayi hai
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serving static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/messages', messageLimiter);

// Routes
app.use('/api/test', require('./src/routes/testRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/conversations', require('./src/routes/conversationRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));

app.get('/', (req, res) => {
  res.send('Chat API is running...');
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
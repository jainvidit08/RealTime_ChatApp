require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const verifyJWT = require('./middleware/verifyJWT');

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);

// Root route redirects to chat, which triggers JWT check, or sends to login
app.get('/', (req, res) => {
  res.redirect('/chat');
});

// Setup WebSockets
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// In-memory store for messages and users
let users = {};
let messages = [];
// Function to sanitize inputs by encoding HTML special characters
function sanitizeInput(input) {
    return input.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
  }
// When a client connects
io.on('connection', (socket) => {
  const userIp = socket.handshake.address;
  console.log(`[${new Date().toLocaleTimeString()}] User connected from IP: ${userIp}, Id: ${socket.id}`);

  // Send chat history to the new client
  socket.emit('load history', messages);

  // When a client sets their nickname
  socket.on('set nickname', (nickname) => {
    nickname = sanitizeInput(nickname);  // Sanitize the nickname
    users[socket.id] = nickname;
    console.log(`ID:${socket.id} IP ${socket.handshake.address} set nickname: ${nickname}`);
    io.emit('user connected', nickname);
  });
  
  // When a client sends a message
  socket.on('chat message', (msg) => {
    const nickname = users[socket.id] || 'Anonymous';
    msg = sanitizeInput(msg);  // Sanitize the message
    const messageData = { nickname, msg, time: new Date().toLocaleTimeString() };
    messages.push(messageData);  // Store message
    io.emit('chat message', messageData);
    console.log(`[${new Date().toLocaleTimeString()}] ID: ${socket.id} ${nickname}: ${msg} (${userIp})`);
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    const nickname = users[socket.id];
    delete users[socket.id]; // Remove the user from the list
    console.log(`[${new Date().toLocaleTimeString()}] ID: ${socket.id}; ${nickname || 'A user'} disconnected with IP: ${userIp}`);
    io.emit('user disconnected', nickname);
  });

  // Handle typing indicator
  socket.on('typing', () => {
    const nickname = users[socket.id];
    socket.broadcast.emit('typing', nickname);
  });

  socket.on('stop typing', () => {
    const nickname = users[socket.id];
    socket.broadcast.emit('stop typing', nickname);
  });
});
// Route to serve the online user list as JSON
app.get('/users-online', (req, res) => {
  const onlineUsers = Object.values(users);
  res.json(onlineUsers);
});

// Start the server
const PORT = 1234;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

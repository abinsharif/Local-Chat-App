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

// When a client connects
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send chat history to the new client
  socket.emit('load history', messages);

  // Listen for nickname submission
  socket.on('set nickname', (nickname) => {
    console.log('Nickname received:', nickname);  // Debugging log
    users[socket.id] = nickname; // Store the user's nickname
    io.emit('user connected', nickname); // Notify others
  });

  // Listen for chat messages from this client
  socket.on('chat message', (msg) => {
    const nickname = users[socket.id] || 'Anonymous'; // Default to 'Anonymous'
    console.log('Message received from', nickname, ':', msg);  // Debugging log

    const messageData = { nickname, msg, time: new Date() };
    messages.push(messageData); // Store message in history
    io.emit('chat message', messageData); // Broadcast the message to all clients
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    const nickname = users[socket.id];
    delete users[socket.id]; // Remove the user from the list
    console.log(`${nickname || 'A user'} disconnected`);
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

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

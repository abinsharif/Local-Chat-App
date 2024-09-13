const socket = io();
    let nickname = '';
    let userColors = {}; // Map to store user colors

    // On form submit, send nickname to server
document.getElementById('nickname-form').addEventListener('submit', (e) => {
    e.preventDefault();
    nickname = document.getElementById('nickname-input').value.trim();
    if (nickname) {
      console.log('Sending nickname to server:', nickname);  // Debugging log
      socket.emit('set nickname', nickname);
      document.getElementById('nickname-section').style.display = 'none';
      document.getElementById('chat-form').style.display = 'block';
    }
  });
  
  // On message submit, send message to server
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const msg = input.value.trim();
    if (msg) {
      console.log('Sending message to server:', msg);  // Debugging log
      socket.emit('chat message', msg);
      input.value = '';
      socket.emit('stop typing'); // Stop typing when message is sent
    }
  });
  

    // Load chat history
    socket.on('load history', (messages) => {
      messages.forEach(({ nickname, msg }) => {
        appendMessage(nickname, msg);
      });
    });

    // Show typing indicator when user is typing
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('input', () => {
      socket.emit('typing');
    });

    messageInput.addEventListener('blur', () => {
      socket.emit('stop typing');
    });

    // When a message is received
    socket.on('chat message', ({ nickname: sender, msg }) => {
      appendMessage(sender, msg);
      if (sender !== nickname) {
        playSound();
      }
    });

    // Typing indicator
    socket.on('typing', (user) => {
      document.getElementById('typing').textContent = `${user} is typing...`;
    });

    socket.on('stop typing', () => {
      document.getElementById('typing').textContent = '';
    });
    // Show a notification when a user joins the chat
socket.on('user connected', (nickname) => {
    showNotification(`${nickname} joined the chat`,"con");
  });
socket.on('user disconnected', (nickname) => {
  showNotification(`${nickname} disconnected from the chat`,"dis");
});
  
  function showNotification(message,type) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.classList.add(type);
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove the notification after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
    // Append messages to the list with colors and formatting
    function appendMessage(sender, message) {
      const messages = document.getElementById('messages');
      const item = document.createElement('li');

      // Assign or use existing color for the sender
      if (!userColors[sender]) {
        const colorIndex = Object.keys(userColors).length % 20 + 1;
        userColors[sender] = `color-${colorIndex}`;
      }

      item.innerHTML = `<span class="nickname ${userColors[sender]}">${sender}</span><span class="message-text">${message}</span>`;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
    }

    // Play sound when new message is received
    function playSound() {
      const sound = document.getElementById('message-sound');
      sound.play();
    }

    // Request notification permission on page load
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
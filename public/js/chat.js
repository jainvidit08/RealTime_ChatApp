// Connect to Socket.IO server
const socket = io();

// Get UI Elements
const roomItems = document.querySelectorAll('.room-item');
const chatWindow = document.getElementById('chat-window');
const emptyChatState = document.getElementById('empty-chat-state');
const currentRoomNameEl = document.getElementById('current-room-name');
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const typingUsersText = document.getElementById('typing-users-text');

let currentRoomId = null;
let typingTimer;            
const TYPING_TIMER_LENGTH = 1500; // 1.5 seconds debounce logic

// 1. Setup online presence
socket.emit('register_user', window.CURRENT_USER.userId);

// 2. Room Switch Logic
roomItems.forEach(item => {
  item.addEventListener('click', async () => {
    roomItems.forEach(r => r.classList.remove('active'));
    item.classList.add('active');
    
    emptyChatState.classList.add('hidden');
    chatWindow.classList.remove('hidden');
    
    const roomId = item.dataset.roomId;
    const roomName = item.dataset.roomName;
    
    if (currentRoomId === roomId) return;
    currentRoomId = roomId;
    currentRoomNameEl.textContent = roomName;
    
    // Unlock input since a room is mounted
    messageInput.removeAttribute('disabled');
    sendBtn.removeAttribute('disabled');
    messageInput.focus();
    
    socket.emit('join_room', { roomId });
    await fetchAndRenderHistory(roomId);
  });
});

// 3. API Call to get messages list
async function fetchAndRenderHistory(roomId) {
  try {
    const response = await fetch(`/chat/messages/${roomId}`);
    const messages = await response.json();
    
    messagesContainer.innerHTML = '';
    
    messages.forEach(msg => {
      appendMessageToUI(msg);
    });
    
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

// 4. Client Sending Messages Logic
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  
  if (content && currentRoomId) {
    socket.emit('send_message', {
      roomId: currentRoomId,
      content: content,
      senderId: window.CURRENT_USER.userId
    });
    
    messageInput.value = '';
    
    // Defeat the typing indicator the moment truth prevails (message sent)
    socket.emit('typing_stop', { roomId: currentRoomId });
    clearTimeout(typingTimer);
  }
});

// 5. Socket Push: React immediately on incoming packet
socket.on('receive_message', (msg) => {
  if (msg.roomId === currentRoomId) {
    appendMessageToUI(msg);
    scrollToBottom();
  }
});

function appendMessageToUI(msg) {
  const isMine = msg.senderId._id === window.CURRENT_USER.userId || msg.senderId === window.CURRENT_USER.userId;
  const username = msg.senderId.username || 'System';
  
  const div = document.createElement('div');
  div.classList.add('message', isMine ? 'message-mine' : 'message-yours');
  
  const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  div.innerHTML = `
    ${!isMine ? `<div class="msg-sender">${username}</div>` : ''}
    <div class="msg-bubble">${msg.content}</div>
    <div class="msg-time">${time}</div>
  `;
  
  messagesContainer.appendChild(div);
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 6. Typings (The core Debounce Requirement)
messageInput.addEventListener('input', () => {
  if (!currentRoomId) return;

  // We immediately bounce an "I'm typing" state 
  socket.emit('typing_start', { roomId: currentRoomId, username: window.CURRENT_USER.username });

  // Clear pending stop intent so that continuous rapid keystrokes extend typing mode
  clearTimeout(typingTimer);

  typingTimer = setTimeout(() => {
    socket.emit('typing_stop', { roomId: currentRoomId });
  }, TYPING_TIMER_LENGTH);
});

// Handle what to do if someone else starts typing
const typingUsers = new Set();
socket.on('user_typing', ({ username, roomId }) => {
  if (roomId === currentRoomId) {
    typingUsers.add(username);
    updateTypingIndicator();
  }
});

socket.on('user_stopped_typing', ({ roomId }) => {
  if (roomId === currentRoomId) {
    typingUsers.clear();
    updateTypingIndicator();
  }
});

function updateTypingIndicator() {
  if (typingUsers.size > 0) {
    const names = Array.from(typingUsers);
    let text = names.length > 2 
      ? 'Multiple people are typing...' 
      : `${names.join(' and ')} ${names.length === 1 ? 'is' : 'are'} typing...`;
      
    typingUsersText.textContent = text;
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
  } else {
    typingIndicator.classList.add('hidden');
  }
}

// 7. Handle Private Chat Searches
const privateChatForm = document.getElementById('private-chat-form');
const searchUsernameInput = document.getElementById('search-username');

if (privateChatForm) {
  privateChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUsername = searchUsernameInput.value.trim();
    if (!targetUsername) return;

    try {
      const response = await fetch('/chat/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername })
      });

      const data = await response.json();

      if (response.ok) {
        // Success: Reload page so the rooms refetch and their name populates nicely
        window.location.reload();
      } else {
        alert(data.error || 'Failed to start chat');
      }
    } catch (err) {
      alert('Error searching for user');
    }
  });
}

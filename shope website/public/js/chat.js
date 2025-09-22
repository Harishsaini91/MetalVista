document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  const fileInput = document.getElementById('file-input');
  const fileForm = document.getElementById('file-form');
  const roomId = document.getElementById('room-id').value;
  
  // Join the room
  socket.emit('join_room', roomId);
  
  // Load chat history
 fetch(`/api/chat/${roomId}/history`)
  .then(res => res.json())
  .then(messages => {
    const currentUserId = document.getElementById('current-user-id').value;
    messages.forEach(message => appendMessage(message, currentUserId)); // <-- Fix here
    scrollToBottom();
  });
  
  // Handle new messages from server
//   socket.on('new_message', (message) => {
//     appendMessage(message);
//     scrollToBottom();
//   });
  

  // Send message
// chatForm.addEventListener('submit', (e) => {
//   e.preventDefault();
//   const message = messageInput.value.trim();
  
//   if (message) {
//     socket.emit('send_message', { roomId, message });
//     messageInput.value = '';
//   }
// });


// chatForm.addEventListener('submit', (e) => {
//   e.preventDefault();
//   const message = messageInput.value.trim();

//   if (message) {
//     const currentUserId = document.getElementById('current-user-id').value;

//     const fakeMessage = {
//       sender: { _id: currentUserId, gmail: 'You' }, // or actual user.email
//       message,
//       timestamp: new Date().toISOString(),
//     };

//     appendMessage(fakeMessage, currentUserId);
//     scrollToBottom();

//     socket.emit('send_message', { roomId, message });
//     messageInput.value = '';
//   }
// });

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();

  if (message) {
    socket.emit('send_message', { roomId, message });
    messageInput.value = '';
  }
});





  // Upload file
  fileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(fileForm);
    formData.append('roomId', roomId);
    
    fetch('/api/chat/upload', {
      method: 'POST',
      body: formData
    })
    .then(() => {
      fileInput.value = '';
    })
    .catch(err => console.error(err));
  });
   
  // Helper functions
//   function appendMessage(message) {
//     const messageElement = document.createElement('div');
//     messageElement.className = `message ${message.sender._id === currentUserId ? 'sent' : 'received'}`;
    
//     if (message.message) {
//       messageElement.innerHTML = `
//         <div class="message-sender">${message.sender.gmail}</div>
//         <div class="message-text">${message.message}</div>
//         <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
//       `;
//     } else if (message.file) {
//       let fileContent = '';
//       const fileUrl = `/images/uploded_image/${message.file}`;
      
//       switch (message.fileType) {
//         case 'image':
//           fileContent = `<img src="${fileUrl}" alt="Uploaded image" class="chat-file">`;
//           break;
//         case 'video':
//           fileContent = `
//             <video controls class="chat-file">
//               <source src="${fileUrl}" type="video/mp4">
//               Your browser does not support the video tag.
//             </video>
//           `;
//           break;
//         case 'document':
//           fileContent = `<a href="${fileUrl}" target="_blank" class="chat-file">Download Document</a>`;
//           break;
//         case 'audio':
//           fileContent = `
//             <audio controls class="chat-file">
//               <source src="${fileUrl}" type="audio/mpeg">
//               Your browser does not support the audio element.
//             </audio>
//           `;
//           break;
//         default:
//           fileContent = `<a href="${fileUrl}" target="_blank" class="chat-file">Download File</a>`;
//       } 
       
//       messageElement.innerHTML = `
//         <div class="message-sender">${message.sender.gmail}</div>
//         ${fileContent}
//         <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
//       `;
//     }
    
//     chatMessages.appendChild(messageElement);
//   }

const shownMessages = new Set();

function appendMessage(message, currentUserId) {

  if (shownMessages.has(message._id)) return;
  shownMessages.add(message._id);

  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');

  const isSent = message.sender._id === currentUserId;
  messageElement.className = `message ${isSent ? 'sent' : 'received'}`;

  const senderDiv = document.createElement('div');
  senderDiv.className = 'message-sender';
  senderDiv.textContent = message.sender.gmail;
  messageElement.appendChild(senderDiv);

  if (message.message) {
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message.message;
    messageElement.appendChild(textDiv);
  } else if (message.file) {
    const fileType = message.fileType;
    const fileUrl = `/images/uploded_image/${message.file}`;
    let fileElement;

    switch (fileType) {
      case 'image':
        fileElement = document.createElement('img');
        fileElement.src = fileUrl;
        fileElement.alt = 'Uploaded image';
        fileElement.className = 'chat-file';
        break;
      case 'video':
        fileElement = document.createElement('video');
        fileElement.controls = true;
        fileElement.className = 'chat-file';
        const videoSource = document.createElement('source');
        videoSource.src = fileUrl;
        videoSource.type = 'video/mp4';
        fileElement.appendChild(videoSource);
        break;
      case 'audio':
        fileElement = document.createElement('audio');
        fileElement.controls = true;
        fileElement.className = 'chat-file';
        const audioSource = document.createElement('source');
        audioSource.src = fileUrl;
        audioSource.type = 'audio/mpeg';
        fileElement.appendChild(audioSource);
        break;
      case 'document':
        fileElement = document.createElement('a');
        fileElement.href = fileUrl;
        fileElement.target = '_blank';
        fileElement.className = 'chat-file';
        fileElement.textContent = 'Download Document';
        break;
      default:
        fileElement = document.createElement('a');
        fileElement.href = fileUrl;
        fileElement.target = '_blank';
        fileElement.className = 'chat-file';
        fileElement.textContent = 'Download File';
        break;
    }

    messageElement.appendChild(fileElement);
  }

  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString();
  messageElement.appendChild(timeDiv);

  chatMessages.appendChild(messageElement);
}


const currentUserId = document.getElementById('current-user-id').value;

socket.on('new_message', (message) => {
  appendMessage(message, currentUserId);
  scrollToBottom();
});

  
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});


// 
 async function leaveGroup(roomId) {
    const res = await fetch(`/api/group/${roomId}/leave`, { method: 'POST' });
    if (res.ok) {
      window.location.href = '/user/chat'; // back to chat list
    }
  }
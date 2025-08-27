const io = require('socket.io-client');

// Test Socket.IO connection
const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Test authentication
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJ0ZXN0MDA3IiwiaWF0IjoxNzM1MzA5NzE5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // This is a test token
  
  socket.emit('authenticate', token);
});

socket.on('authenticated', (data) => {
  console.log('✅ Authenticated:', data);
  
  // Join user room
  socket.emit('join_user_room', { userId: 6 });
});

socket.on('authentication_error', (error) => {
  console.error('❌ Authentication failed:', error);
});

socket.on('user:deposit:approved', (data) => {
  console.log('🎉 Deposit approved notification received:', data);
});

socket.on('user:deposit:rejected', (data) => {
  console.log('❌ Deposit rejected notification received:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

console.log('🔌 Testing Socket.IO connection...');

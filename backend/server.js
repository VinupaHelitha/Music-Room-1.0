import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import musicRoutes from './routes/music.js';
import lyricsRoutes from './routes/lyrics.js';
import { initializeDatabase, getDatabase } from './db/init.js';
import { authenticateToken } from './middleware/auth.js';
import { verifyEmailTransporter } from './services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emailVerification = await verifyEmailTransporter();
if (!emailVerification.success) {
  console.error('Email transporter could not be verified:', emailVerification.error);
  console.error('Email delivery is disabled. Verification codes will be logged to console.');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistPath));
}

// Initialize database
await initializeDatabase();

const roomState = {};
const getRoomState = (roomId) => {
  if (!roomState[roomId]) {
    roomState[roomId] = {
      currentSong: null,
      isPlaying: false,
      allowAudio: true,
      lyrics: null,
      queue: []
    };
  }
  return roomState[roomId];
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', authenticateToken, roomRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/lyrics', lyricsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    const state = getRoomState(roomId);
    socket.emit('room-state', {
      currentSong: state.currentSong,
      isPlaying: state.isPlaying,
      allowAudio: state.allowAudio,
      lyrics: state.lyrics,
      queue: state.queue
    });

    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
    socket.to(roomId).emit('user-left', { userId: socket.id });
  });

  socket.on('play-song', (data) => {
    const { roomId, song } = data;
    const state = getRoomState(roomId);
    state.currentSong = song;
    state.isPlaying = true;
    io.to(roomId).emit('song-playing', song);
    io.to(roomId).emit('player-state', { isPlaying: true, currentSong: song });
  });

  socket.on('pause-song', (roomId) => {
    const state = getRoomState(roomId);
    state.isPlaying = false;
    io.to(roomId).emit('song-paused');
    io.to(roomId).emit('player-state', { isPlaying: false });
  });

  socket.on('toggle-audio', (data) => {
    const { roomId, allowAudio } = data;
    const state = getRoomState(roomId);
    state.allowAudio = allowAudio;
    io.to(roomId).emit('audio-toggled', allowAudio);
  });

  socket.on('enqueue-song', (data) => {
    const { roomId, song } = data;
    const state = getRoomState(roomId);
    state.queue = [...state.queue, song];
    io.to(roomId).emit('queue-updated', state.queue);
  });

  socket.on('reorder-queue', (data) => {
    const { roomId, queue } = data;
    const state = getRoomState(roomId);
    state.queue = queue;
    io.to(roomId).emit('queue-updated', queue);
  });

  socket.on('remove-queue-item', (data) => {
    const { roomId, index } = data;
    const state = getRoomState(roomId);
    state.queue = state.queue.filter((_, i) => i !== index);
    io.to(roomId).emit('queue-updated', state.queue);
  });

  socket.on('play-next', (roomId) => {
    const state = getRoomState(roomId);
    const nextSong = state.queue.shift();
    if (nextSong) {
      state.currentSong = nextSong;
      state.isPlaying = true;
      io.to(roomId).emit('queue-updated', state.queue);
      io.to(roomId).emit('song-playing', nextSong);
      io.to(roomId).emit('player-state', { isPlaying: true, currentSong: nextSong });
    }
  });

  socket.on('update-lyrics', (data) => {
    const { roomId, lyrics } = data;
    const state = getRoomState(roomId);
    state.lyrics = lyrics;
    io.to(roomId).emit('lyrics-updated', lyrics);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🎵 Music Room Backend running on http://localhost:${PORT}`);
});

export { io };

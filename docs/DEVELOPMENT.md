# Development Guide

This guide explains the architecture and how to extend Music Room.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React App)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pages: Login, Register, Dashboard, Room        │  │
│  │  Components: LyricsDisplay, MusicPlayer         │  │
│  │  Store: authStore, roomStore (Zustand)         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┬┘
                            │
         HTTP (REST) + WebSocket (Socket.io)
                            │
┌────────────────────────────────────────────────────────┴┐
│              Node.js/Express Server                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Routes:                                         │  │
│  │  - /api/auth (login, register)                 │  │
│  │  - /api/rooms (CRUD operations)                │  │
│  │  - /api/music (search)                         │  │
│  │  - /api/lyrics (fetch lyrics)                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  WebSocket Events:                             │  │
│  │  - join-room, leave-room                       │  │
│  │  - play-song, pause-song                       │  │
│  │  - lyrics-updated, user-joined                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware:                                   │  │
│  │  - Authentication (JWT)                        │  │
│  │  - CORS                                        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┬┘
                            │
           External APIs
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    Spotify API       LyricsOVH API      YouTube API
```

## Code Flow

### 1. User Registration

```
User Input (email, password, name)
    ↓
RegisterPage.jsx → axios.post('/api/auth/register')
    ↓
backend: POST /api/auth/register
    ↓
auth.js: Validate → Hash Password → Save to DB
    ↓
Generate JWT Token
    ↓
Return token + user data
    ↓
Frontend: Store in localStorage + authStore
    ↓
Navigate to Dashboard
```

### 2. Creating a Room

```
User clicks "Create Room"
    ↓
DashboardPage: Form input (name, public, audio)
    ↓
POST /api/rooms/create
    ↓
Backend: Verify auth → Create room in DB
    ↓
Return room ID
    ↓
Frontend: Update roomStore → Add to rooms list
    ↓
Display in rooms grid
```

### 3. Joining Room & Real-time Sync

```
User clicks "Enter Room"
    ↓
RoomPage.jsx loaded with roomId param
    ↓
Socket.io connects: io('http://localhost:5000')
    ↓
socket.emit('join-room', roomId)
    ↓
Backend: Server.js receives event → Adds user to room
    ↓
Other users notified via: socket.to(roomId).emit('user-joined')
    ↓
Room displays member list updated
```

### 4. Playing a Song & Lyrics Sync

```
User clicks "Play" on song
    ↓
handlePlaySong() → socket.emit('play-song', song)
    ↓
Backend: Receives event → Broadcasts to room
    ↓
io.to(roomId).emit('song-playing', song)
    ↓
All clients receive 'song-playing' event
    ↓
RoomPage: setCurrentSong(song)
    ↓
Fetch lyrics: GET /api/lyrics/search?artist=X&song=Y
    ↓
Backend: Query LyricsOVH API
    ↓
Return lyrics
    ↓
Frontend: Display in LyricsDisplay component
    ↓
socket.emit('lyrics-updated', lyrics)
    ↓
All room members see synchronized lyrics
```

## Key Components Explained

### Frontend State (Zustand Stores)

#### authStore.js
```javascript
- token: JWT token
- user: User object {id, email, name}
- login(): Store auth data
- logout(): Clear auth data
```

#### roomStore.js
```javascript
- rooms: Array of room objects
- currentRoom: Currently viewing room
- currentSong: Now playing song
- lyrics: Current lyrics
- members: List of room members
- setters for all above
```

### Backend File Structure

#### server.js
- Express app initialization
- Socket.io setup
- Route mounting
- Database initialization

#### routes/auth.js
- POST /register - Create new user
- POST /login - Authenticate user

#### routes/rooms.js
- POST /create - Create room
- GET /:roomId - Get room details
- GET /user/my-rooms - User's rooms
- POST /:roomId/join - Join room
- POST /:roomId/leave - Leave room

#### routes/music.js
- GET /search/spotify - Spotify search
- GET /search/youtube - YouTube search
- GET /room/:roomId/current - Current song

#### routes/lyrics.js
- GET / - Get lyrics for song
- GET /search - Search with fallback

#### middleware/auth.js
- authenticateToken() - Verify JWT
- generateToken() - Create JWT

#### db/init.js
- Initialize SQLite database
- Create all tables
- Define schema

## Adding New Features

### Example: Add Chat System

#### 1. Backend (add to routes/chat.js)
```javascript
router.post('/send', (req, res) => {
  const { roomId, message } = req.body;
  const userId = req.user.userId;
  
  db.prepare(`
    INSERT INTO room_messages (room_id, user_id, message, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(roomId, userId, message);
  
  io.to(roomId).emit('message', { userId, message, timestamp: Date.now() });
  res.json({ status: 'sent' });
});
```

#### 2. Frontend (add to RoomPage.jsx)
```javascript
const [messages, setMessages] = useState([]);

useEffect(() => {
  socket.on('message', (msg) => {
    setMessages(prev => [...prev, msg]);
  });
}, []);

const sendMessage = (text) => {
  axios.post('/api/chat/send', { roomId, message: text });
};
```

#### 3. Database (add to db/init.js)
```sql
CREATE TABLE room_messages (
  id INTEGER PRIMARY KEY,
  room_id TEXT,
  user_id TEXT,
  message TEXT,
  created_at DATETIME,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Example: Add User Profiles

#### 1. Add Profile Page
```javascript
// Create src/pages/ProfilePage.jsx
// Show user info, preferences, room history
```

#### 2. Add Profile Route
```javascript
// Add to App.jsx routes
<Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
```

#### 3. Add Backend Endpoint
```javascript
// Add to routes/auth.js
router.get('/profile/:userId', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json(user);
});
```

## Debugging

### Frontend Debugging
- Use browser DevTools (F12)
- Check Console for errors
- Use React DevTools extension
- Check Network tab for API calls

### Backend Debugging
```javascript
// Add console.logs
console.log('User:', req.user);
console.log('Room:', room);
console.log('Event received:', data);
```

### Database Debugging
```bash
# View database file (use SQLite viewer)
# Or use SQLite CLI
sqlite3 music_room.db
> SELECT * FROM users;
> SELECT * FROM rooms;
```

## Performance Optimization

### Frontend
- Use React.memo() for expensive components
- Code splitting with React.lazy()
- Optimize re-renders with proper state management
- Cache API responses

### Backend
- Index frequently queried columns in database
- Use connection pooling for database
- Cache API responses (LyricsOVH)
- Optimize WebSocket message size

## Testing Strategy

### Unit Tests
```javascript
// Test auth functions
// Test password hashing
// Test JWT generation
```

### Integration Tests
```javascript
// Test full auth flow
// Test room creation
// Test WebSocket events
```

### E2E Tests
```javascript
// Test user signup to room join
// Test music search and play
// Test lyrics display
```

## Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Change JWT_SECRET to strong random value
- [ ] Set FRONTEND_URL correctly
- [ ] Add Spotify API credentials
- [ ] Configure database for production
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Add rate limiting
- [ ] Set up logging
- [ ] Configure backup strategy

## Useful Commands

```bash
# Backend
npm run dev          # Development with nodemon
npm start           # Production
npm test            # Run tests

# Frontend
npm run dev         # Development
npm run build       # Production build
npm run preview     # Preview build
npm run lint        # Run linter

# Database
sqlite3 music_room.db    # Open database CLI
```

## Resources

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Socket.io Docs](https://socket.io/)
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [Spotify API Docs](https://developer.spotify.com/documentation/web-api)

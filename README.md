# 🎵 Music Room - Share Music & Lyrics with Friends

A collaborative web application where users can create rooms, share music from Spotify/YouTube Music, and display synchronized lyrics to everyone in the room.

## Features

✨ **Core Features:**
- **User Authentication** - Email/password signup and login with JWT tokens
- **Music Rooms** - Create public/private rooms to share music
- **Real-time Sync** - HTTP polling + WebSockets for real-time updates
- **Lyrics Display** - Synchronized lyrics from LyricsOVH API
- **Audio Control** - Room creators can enable/disable audio playback
- **Room Members** - Track who's in each room
- **Music Search** - Search for songs from Spotify/YouTube Music

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **Socket.io** - Real-time bidirectional communication
- **SQLite** - Lightweight database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Zustand** - State management
- **Socket.io Client** - Real-time connection
- **React Router** - Routing
- **Axios** - HTTP client

### APIs & Services
- **Spotify Web API** - Song search and metadata
- **LyricsOVH API** - Free lyrics fetching
- **YouTube Music** - Optional music source

## Project Structure

```
music-room/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json
│   ├── .env.example           # Environment variables template
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── rooms.js           # Room management
│   │   ├── music.js           # Music search
│   │   └── lyrics.js          # Lyrics fetching
│   └── db/
│       └── init.js            # Database initialization
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx           # Entry point
        ├── App.jsx            # Main component
        ├── store/
        │   ├── authStore.js   # Auth state
        │   └── roomStore.js   # Room state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── RoomPage.jsx
        └── components/
            ├── ProtectedRoute.jsx
            ├── LyricsDisplay.jsx
            └── MusicPlayer.jsx
```

## Setup & Installation

### Prerequisites
- Node.js 16+ installed
- npm or yarn
- Git

### 1. Clone Repository

```bash
cd "d:\VS code music room project"
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your API keys
# Generate a strong JWT_SECRET

# Start backend (development)
npm run dev

# Or start production
npm start
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health Check: http://localhost:5000/health

## Configuration

### Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Spotify API (get from https://developer.spotify.com)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback

# JWT Secret (generate strong random string)
JWT_SECRET=your_very_secret_jwt_key_change_this_in_production

# Database
DATABASE_URL=./music_room.db

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## How It Works

### User Flow

1. **Register/Login** - User creates account or logs in
2. **Create Room** - User creates a new music room
   - Can make it public or private
   - Can enable/disable audio playback
3. **Search Music** - Search for songs from Spotify
4. **Share Song** - Select a song to play in room
5. **Sync Lyrics** - Lyrics automatically fetch and display for all members
6. **Real-time Updates** - All room members see updates in real-time via WebSockets

### Room Features

- **Public Rooms** - Anyone can join
- **Private Rooms** - Only invited members can join
- **Audio Control** - Creator can choose if audio plays
  - When enabled, only room creator's audio plays
  - Other members see synchronized lyrics
- **Members List** - See who's in the room
- **Song Queue** - Search and queue songs

### Lyrics Synchronization

1. User plays a song
2. Backend fetches lyrics from LyricsOVH API
3. Lyrics sent to all room members via WebSocket
4. Displayed in real-time for everyone

## API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
```

### Rooms
```
POST /api/rooms/create - Create new room
GET /api/rooms/:roomId - Get room details
GET /api/rooms/user/my-rooms - Get user's rooms
POST /api/rooms/:roomId/join - Join room
POST /api/rooms/:roomId/leave - Leave room
```

### Music
```
GET /api/music/search/spotify - Search Spotify
GET /api/music/search/youtube - Search YouTube Music
GET /api/music/room/:roomId/current - Get current playing song
```

### Lyrics
```
GET /api/lyrics?artist=X&song=Y - Get lyrics
GET /api/lyrics/search?artist=X&song=Y - Search with fallback
```

## WebSocket Events

### Server → Client
- `song-playing` - Song started playing
- `song-paused` - Song paused
- `lyrics-updated` - Lyrics updated
- `user-joined` - User joined room
- `user-left` - User left room

### Client → Server
- `join-room` - Join a room
- `leave-room` - Leave a room
- `play-song` - Play a song
- `pause-song` - Pause song
- `update-lyrics` - Update lyrics

## Database Schema

### users
- id (TEXT) - UUID
- email (TEXT) - Unique email
- password (TEXT) - Hashed password
- name (TEXT) - User name
- created_at (DATETIME)

### rooms
- id (TEXT) - UUID
- name (TEXT) - Room name
- creator_id (TEXT) - Creator user ID
- is_public (BOOLEAN) - Public/private
- allow_audio (BOOLEAN) - Audio enabled
- current_song (JSON) - Current song data
- is_playing (BOOLEAN) - Playing status
- created_at (DATETIME)

### room_members
- id (INTEGER) - Auto increment
- room_id (TEXT) - Room ID
- user_id (TEXT) - User ID
- joined_at (DATETIME)

### room_songs
- id (INTEGER) - Auto increment
- room_id (TEXT) - Room ID
- title (TEXT) - Song title
- artist (TEXT) - Artist name
- album (TEXT) - Album name
- duration (INTEGER) - Duration in seconds
- source (TEXT) - Music source (spotify/youtube)
- source_id (TEXT) - ID from source service
- added_by (TEXT) - User who added song
- played_at (DATETIME)
- created_at (DATETIME)

### user_music_accounts
- id (INTEGER) - Auto increment
- user_id (TEXT) - User ID
- service (TEXT) - Service (spotify/youtube)
- account_id (TEXT) - Account ID
- access_token (TEXT) - Access token
- refresh_token (TEXT) - Refresh token
- is_premium (BOOLEAN) - Premium account
- created_at (DATETIME)

## Future Enhancements

- [ ] Spotify OAuth integration
- [ ] YouTube Music API integration
- [ ] User profiles & avatars
- [ ] Room invitations
- [ ] Chat system
- [ ] Playlist support
- [ ] Mobile app (React Native)
- [ ] Docker deployment
- [ ] Advanced lyrics sync (line-by-line timing)
- [ ] User preferences (theme, language)
- [ ] Room history

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env
```

### CORS Errors
- Ensure FRONTEND_URL in .env matches your frontend URL
- Check that backend CORS is configured correctly

### Database Issues
```bash
# Reset database (backup first!)
rm music_room.db
# Restart backend to recreate
```

### WebSocket Connection Failed
- Ensure backend is running on correct port
- Check firewall settings
- Verify Socket.io middleware configuration

## Testing

```bash
# Backend tests (to be implemented)
npm run test

# Frontend tests (to be implemented)
npm run test
```

## Deployment

### Heroku
```bash
# Create Heroku app
heroku create music-room-app

# Set environment variables
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### Docker
```bash
# Build and run
docker-compose up
```

### Vercel (Frontend)
```bash
npm run build
# Deploy build/ folder to Vercel
```

## License

MIT License - Feel free to use this project for personal or commercial use.

## Support

For issues, feature requests, or questions:
1. Check existing issues
2. Create new issue with detailed description
3. Contact: support@musicroom.local

---

**Made with ❤️ for music lovers everywhere 🎵**

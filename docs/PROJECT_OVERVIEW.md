# Music Room - Project Overview

## 🎵 What is Music Room?

Music Room is a collaborative web application that allows users to create virtual "rooms" where they can:
- **Share music** from Spotify and YouTube Music
- **Display synchronized lyrics** to all room members
- **Control playback** with options to enable/disable audio
- **Collaborate in real-time** with instant updates via WebSockets
- **Manage rooms** (create, join, leave, invite)

Perfect for:
- Study groups wanting background music + lyrics
- Music lovers hosting listening parties
- Bands sharing new songs with collaborators
- Friends jamming together remotely
- Artists showcasing new work to a room

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                │
│  Dashboard → Create/Browse Rooms → Enter Room          │
│  Real-time sync with WebSockets                         │
└────────────────────────────────────────────────────────┬┘
                            ↕ (HTTP + WebSocket)
┌────────────────────────────────────────────────────────┬┘
│               BACKEND (Node.js + Express)              │
│  Authentication, Room Management, Music Search         │
│  Real-time Events, Database Management                 │
└────────────────────────────────────────────────────────┬┘
                            ↕
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     SQLite DB         Spotify API         LyricsOVH API
     (Local)           (Song Search)       (Lyrics)
```

## 📁 Project Structure

```
d:\VS code music room project\
│
├── README.md                 # Main documentation
├── docker-compose.yml        # Docker setup
├── .gitignore               # Git ignore rules
├── start.bat                # Windows quick start
├── start.sh                 # Linux/Mac quick start
│
├── backend/                 # Node.js + Express Server
│   ├── server.js           # Main server entry
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── Dockerfile          # Docker configuration
│   │
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   │
│   ├── routes/
│   │   ├── auth.js         # Login/Register
│   │   ├── rooms.js        # Room operations
│   │   ├── music.js        # Music search
│   │   └── lyrics.js       # Lyrics fetching
│   │
│   └── db/
│       └── init.js         # Database setup
│
├── frontend/               # React + Vite App
│   ├── index.html         # HTML entry point
│   ├── package.json       # Dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── Dockerfile         # Docker configuration
│   │
│   └── src/
│       ├── main.jsx       # React entry
│       ├── App.jsx        # Main component
│       ├── App.css        # Global styles
│       │
│       ├── store/
│       │   ├── authStore.js     # Auth state (Zustand)
│       │   └── roomStore.js     # Room state (Zustand)
│       │
│       ├── pages/
│       │   ├── LoginPage.jsx          # Login UI
│       │   ├── RegisterPage.jsx       # Signup UI
│       │   ├── DashboardPage.jsx      # Rooms list
│       │   └── RoomPage.jsx           # Music player
│       │
│       └── components/
│           ├── ProtectedRoute.jsx     # Auth guard
│           ├── LyricsDisplay.jsx      # Lyrics UI
│           └── MusicPlayer.jsx        # Player controls
│
└── docs/                   # Documentation
    ├── SETUP.md           # Quick start guide
    ├── DEVELOPMENT.md     # Dev guide
    └── API_INTEGRATION.md # API setup guide
```

## 🚀 Quick Start

### Option 1: Windows Quick Start
```powershell
cd "d:\VS code music room project"
.\start.bat
```

### Option 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Edit .env with API keys
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Option 3: Docker
```bash
cd "d:\VS code music room project"
docker-compose up
```

Then open: **http://localhost:3000**

## 💻 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI library |
| | Vite | Build tool |
| | Zustand | State management |
| | Socket.io Client | Real-time |
| | Axios | HTTP requests |
| **Backend** | Node.js | JavaScript runtime |
| | Express | Web framework |
| | Socket.io | WebSocket server |
| | JWT | Authentication |
| | bcryptjs | Password hashing |
| **Database** | SQLite | Local database |
| **APIs** | Spotify Web API | Song search |
| | LyricsOVH | Lyrics fetching |
| | YouTube API | YouTube search |

## 🎯 Core Features

### 1. User Management
- ✅ Email/password signup
- ✅ Secure JWT authentication
- ✅ Password hashing with bcryptjs
- 🔲 OAuth integration (Spotify)

### 2. Room Management
- ✅ Create rooms
- ✅ Public/private rooms
- ✅ Join/leave functionality
- ✅ Member tracking
- 🔲 Room invitations
- 🔲 Room history

### 3. Music Features
- ✅ Spotify song search
- ✅ Real-time playback control
- ✅ Song queuing
- 🔲 YouTube Music support
- 🔲 Playlist support

### 4. Lyrics
- ✅ Auto-fetch lyrics
- ✅ Synchronized display
- ✅ Multiple sources
- 🔲 Line-by-line timing
- 🔲 Lyrics editing

### 5. Real-time Features
- ✅ WebSocket events
- ✅ Live member updates
- ✅ Instant sync
- ✅ HTTP polling fallback
- 🔲 Chat system

## 📊 Database Schema

### Users Table
```sql
- id (UUID)
- email (unique)
- password (hashed)
- name
- created_at
```

### Rooms Table
```sql
- id (UUID)
- name
- creator_id → users.id
- is_public (boolean)
- allow_audio (boolean)
- current_song (JSON)
- is_playing (boolean)
- created_at
```

### Room Members Table
```sql
- id (auto)
- room_id → rooms.id
- user_id → users.id
- joined_at
```

### Room Songs Table
```sql
- id (auto)
- room_id → rooms.id
- title, artist, album
- duration, source (spotify/youtube)
- added_by → users.id
- played_at, created_at
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs with salt rounds
- **Protected Routes** - Frontend route guards
- **CORS Configuration** - Restricted cross-origin access
- **SQL Injection Protection** - Parameterized queries
- **Rate Limiting** - Coming soon

## 🌐 API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login |
| POST | /api/rooms/create | ✅ | Create room |
| GET | /api/rooms/:id | ✅ | Get room details |
| GET | /api/rooms/user/my-rooms | ✅ | User's rooms |
| POST | /api/rooms/:id/join | ✅ | Join room |
| GET | /api/music/search/spotify | ❌ | Search songs |
| GET | /api/lyrics?artist=X&song=Y | ❌ | Get lyrics |

## 🔄 Data Flow Example

**User searches and plays a song:**

```
1. User types "Never Gonna Give You Up" in search
   ↓
2. Frontend: POST /api/music/search/spotify?q=Never...
   ↓
3. Backend: Query Spotify API
   ↓
4. Spotify API returns song metadata
   ↓
5. Frontend displays search results
   ↓
6. User clicks "Play"
   ↓
7. Frontend: socket.emit('play-song', {roomId, song})
   ↓
8. Backend receives event, broadcasts to room
   ↓
9. All clients receive 'song-playing' event
   ↓
10. All clients: Fetch GET /api/lyrics?artist=Rick&song=Never...
    ↓
11. Backend queries LyricsOVH API
    ↓
12. Lyrics fetched and sent to all clients
    ↓
13. Lyrics display in real-time for all members ✨
```

## 📈 Performance Considerations

- **Caching** - Song search results cached
- **Lazy Loading** - Route-based code splitting
- **Database Indexing** - Optimized queries
- **WebSocket** - Efficient real-time updates
- **CDN Ready** - Frontend optimized for static hosting

## 🔜 Planned Features

### Phase 2
- [ ] Spotify OAuth login
- [ ] YouTube Music integration
- [ ] In-room chat
- [ ] User profiles
- [ ] Room invitations

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Playlist management
- [ ] Advanced lyrics sync
- [ ] User preferences
- [ ] Analytics

### Phase 4
- [ ] Social features
- [ ] Monetization options
- [ ] Enterprise features
- [ ] Mobile optimized UX

## 📚 Documentation

| Document | Content |
|----------|---------|
| [README.md](../README.md) | Full documentation |
| [SETUP.md](SETUP.md) | Installation guide |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Developer guide |
| [API_INTEGRATION.md](API_INTEGRATION.md) | API setup guide |

## 🛠️ Development Workflow

1. **Setup** - Run `npm install` in both folders
2. **Configure** - Edit `backend/.env`
3. **Run** - Start both servers
4. **Develop** - Make changes (hot reload)
5. **Test** - Use browser DevTools
6. **Deploy** - Build and push to production

## 🚢 Deployment Options

| Platform | Guide | Time |
|----------|-------|------|
| **Heroku** | Docker push | 5 min |
| **Vercel** | Git push | 3 min |
| **AWS** | EC2 + RDS | 30 min |
| **Docker** | docker-compose | 2 min |
| **Self-hosted** | Linux + Nginx | 1 hour |

## 📞 Support & Community

- 📖 Read the [documentation](../README.md)
- 🐛 Report issues on GitHub
- 💬 Discuss in community forum
- 📧 Email support: support@musicroom.local

## 📝 License

MIT License - Free for personal and commercial use

---

## 🎉 Ready to Start?

1. Run `start.bat` (Windows) or `start.sh` (Linux/Mac)
2. Open http://localhost:3000
3. Create an account
4. Create your first music room
5. Invite friends and start sharing! 🎵

**Enjoy sharing music and lyrics with Music Room!** ✨

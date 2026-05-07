# Music Room - Quick Start Guide

## ✅ Works Out of the Box

The app is **fully functional right now** without any configuration! We use free APIs that don't require authentication:

1. **iTunes Search** - Search songs (no key needed)
2. **Lyrics.ov** - Display lyrics (no key needed)
3. **Room Codes** - Share rooms with 6-digit access codes

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd backend
npm run dev
```
The backend runs on `http://localhost:5000`

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend runs on `http://localhost:3000`

### 3. Open in Browser
Go to `http://localhost:3000` and create an account!

## 📝 Using the App

### Create a Room
1. Click **New Room** on Dashboard
2. Enter room name, choose settings
3. Click **Create**

### Share with Friends
1. In your room, click **🔐 Code** button
2. Click **Copy** to copy the 6-digit access code
3. Share the code with friends!

### Search & Play Music
1. Type song name in search box
2. Results from iTunes, Spotify, Genius appear
3. Click **▶** to play for everyone

### See Synchronized Lyrics
Lyrics auto-load and display for everyone in real-time!

## 🔧 Optional: Enhanced Features

### Add Spotify Search
Spotify gives better quality previews and more metadata.

1. Go to https://developer.spotify.com/dashboard
2. Log in (create free account if needed)
3. Click **Create an App**
4. Accept the terms and give it a name like "Music Room"
5. Copy the **Client ID** and **Client Secret**
6. Paste into `.env` file:
   ```
   SPOTIFY_CLIENT_ID=xxxxx
   SPOTIFY_CLIENT_SECRET=yyyyy
   ```
7. Restart backend - now searches include Spotify!

### Add Genius Search
Genius has the best lyrics database and song information.

1. Go to https://genius.com/api-clients
2. Create a free account
3. Create a new API Client
4. Generate Access Token
5. Copy the token to `.env`:
   ```
   GENIUS_ACCESS_TOKEN=xxxxx
   ```
6. Restart backend - Genius search now enabled!

## 🎵 Song Search Priority

When you search, results come from **multiple sources**:
- ✨ **Spotify** (if configured) - Best quality, has previews
- 🎧 **iTunes** (always free) - Huge catalog
- 📖 **Genius** (if configured) - Best lyrics

**Duplicates are automatically filtered out** so you see each unique song once.

## 🏠 Room Settings

When creating a room, you can choose:

- **Room Name** - What to call it
- **Public/Private** - Public shows in listings, Private is invite-only
- **Allow Audio** - If checked, room host can play music clips to everyone

## 🤝 Invite Friends

### Option 1: Share Room Code (Easiest)
- Click **🔐 Code** in room
- Share the 6-digit number
- They go to Dashboard → **Join by Code** and paste it

### Option 2: Direct Link (Coming Soon)
Shareable room links for easy access

## 🛠️ Troubleshooting

**Search returns no results?**
- Make sure you're searching exact song names or artist names
- Try a different search term
- iTunes always works (it's free!)

**Lyrics not showing?**
- Some songs don't have lyrics available
- Try a more famous song
- Make sure song is playing

**Can't connect to room?**
- Check backend is running on port 5000
- Check frontend can reach backend (open Dev Tools console for errors)
- Try refreshing the page

**API key not working?**
- Make sure you put it in `.env` file (not `.env.example`)
- Restart the backend after adding keys
- Check the token/ID is copied exactly without spaces

## 📚 API Limits (All Free Tiers!)

| Service | Rate Limit | Auth Needed |
|---------|-----------|------------|
| iTunes Search | Unlimited | ❌ No |
| Lyrics.ov | Unlimited | ❌ No |
| Spotify | 180K/6 months | ✅ Free Account |
| Genius | Unlimited | ✅ Free Token |

## 💡 Tips & Tricks

- **Browse room members** - See who's listening in real-time
- **Room info panel** - Shows type, audio status, and room code
- **Song thumbnails** - Album art appears in search results
- **Synchronized playback** - Everyone sees same song/lyrics
- **Host controls** - Room creator can play/pause for everyone

## 🎯 Next Steps

1. **Search and play music** - Try different queries
2. **Create another room** - Test multi-room functionality
3. **Configure APIs** - Add Spotify/Genius for better results
4. **Invite friends** - Share room code and jam together!

## ❓ Questions?

Check the docs folder:
- `SETUP.md` - Detailed installation guide
- `DEVELOPMENT.md` - Architecture & development info
- `API_INTEGRATION.md` - Complete API documentation
- `DEPLOYMENT.md` - How to deploy to production

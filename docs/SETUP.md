# Getting Started with Music Room

This guide will help you set up and run the Music Room application locally.

## Quick Start (5 minutes)

### Step 1: Install Dependencies

Open PowerShell and navigate to the project:

```powershell
cd "d:\VS code music room project\backend"
npm install

cd ..\frontend
npm install
```

### Step 2: Configure Backend

```powershell
cd ..\backend

# Copy environment file
Copy-Item .env.example .env

# Edit .env and add these at minimum:
# PORT=5000
# JWT_SECRET=your_random_secret_here_minimum_32_characters
```

### Step 3: Start Backend

```powershell
cd backend
npm run dev
# Should see: 🎵 Music Room Backend running on http://localhost:5000
```

### Step 4: Start Frontend (in another terminal)

```powershell
cd frontend
npm run dev
# Should see: VITE v... ready in XXX ms
```

### Step 5: Open Browser

Navigate to: http://localhost:3000

## First Time Usage

1. **Register**: Create an account with email & password
2. **Create Room**: Click "Create Room" on dashboard
3. **Enter Room**: Click "Enter Room" to join
4. **Search Music**: Use search bar to find songs
5. **Play Song**: Click Play button to share with room
6. **View Lyrics**: Lyrics auto-display for all members

## Spotify Integration (Optional)

To enable Spotify search:

1. Go to https://developer.spotify.com/
2. Create a new app in Developer Dashboard
3. Copy Client ID and Client Secret
4. Add to `.env`:
   ```
   SPOTIFY_CLIENT_ID=your_id
   SPOTIFY_CLIENT_SECRET=your_secret
   ```
5. Restart backend

## Common Issues & Fixes

### "Cannot find module" errors
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

### Port 5000/3000 already in use
```powershell
# Change port in .env
PORT=5001

# Or kill process using port
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### WebSocket connection errors
- Ensure backend is running
- Check firewall allows localhost connections
- Try restarting both frontend and backend

### Database errors
```powershell
# Remove old database file
Remove-Item music_room.db
# Restart backend to recreate database
```

## Development Tips

- **Backend Auto-reload**: Uses nodemon, changes auto-detected
- **Frontend Hot Reload**: Vite hot-reloads on file changes
- **Database**: SQLite file stored as `music_room.db` in backend folder
- **Logs**: Check terminal for error messages

## Project Structure

```
d:\VS code music room project\
├── backend/
│   ├── server.js (main server)
│   ├── package.json
│   ├── .env (your config)
│   ├── routes/ (API endpoints)
│   ├── middleware/ (auth)
│   └── db/ (database setup)
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── pages/ (main pages)
        ├── components/ (reusable)
        └── store/ (state management)
```

## Next Steps

1. **Customize**: Edit room names, add more features
2. **Connect APIs**: Add Spotify, YouTube Music credentials
3. **Test**: Create rooms, add friends, test sync
4. **Deploy**: Use Heroku, Vercel, or your own server

## Need Help?

- Check browser console (F12) for errors
- Check backend terminal for API errors
- Review .env configuration
- Ensure all ports are available

Happy music sharing! 🎵

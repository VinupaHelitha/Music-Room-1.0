# Spotify & YouTube Music Integration Guide

This guide explains how to add Spotify and YouTube Music integration to Music Room.

## Spotify Integration

### Step 1: Register for Spotify Developer

1. Go to https://developer.spotify.com/
2. Click "Log In" (create account if needed)
3. Accept the terms and create an app
4. You'll receive:
   - Client ID
   - Client Secret

### Step 2: Configure Backend

Add to `.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
```

### Step 3: Implement Spotify Search

Create `backend/services/spotify.js`:

```javascript
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

export async function searchSongs(query) {
  try {
    // Get access token
    const data = await spotifyApi.clientCredentialsFlow();
    spotifyApi.setAccessToken(data.body.access_token);
    
    // Search for songs
    const results = await spotifyApi.searchTracks(query, { limit: 10 });
    
    return results.body.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      imageUrl: track.album.images[0]?.url,
      duration: track.duration_ms / 1000,
      source: 'spotify',
      preview_url: track.preview_url
    }));
  } catch (error) {
    console.error('Spotify search error:', error);
    return [];
  }
}

export async function authenticateUser(code) {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    return {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in
    };
  } catch (error) {
    console.error('Spotify auth error:', error);
    return null;
  }
}
```

### Step 4: Update Music Routes

Modify `backend/routes/music.js`:

```javascript
import express from 'express';
import { searchSongs } from '../services/spotify.js';

const router = express.Router();

router.get('/search/spotify', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchSongs(q);
    res.json({
      source: 'spotify',
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
```

### Step 5: Store User's Spotify Account

```javascript
// In routes/auth.js - after login
if (spotifyCode) {
  const spotifyAuth = await authenticateUser(spotifyCode);
  db.prepare(`
    INSERT OR REPLACE INTO user_music_accounts 
    (user_id, service, account_id, access_token, refresh_token, is_premium)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    'spotify',
    profile.id,
    spotifyAuth.accessToken,
    spotifyAuth.refreshToken,
    profile.product === 'premium'
  );
}
```

## YouTube Music Integration

### Step 1: Get YouTube API Key

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable YouTube Data API v3
4. Create API key (Server key)
5. Add to `.env`:
   ```env
   YOUTUBE_API_KEY=your_api_key
   ```

### Step 2: Create YouTube Service

Create `backend/services/youtube.js`:

```javascript
import axios from 'axios';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

export async function searchYouTube(query) {
  try {
    const response = await axios.get(`${YOUTUBE_API}/search`, {
      params: {
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults: 10,
        key: process.env.YOUTUBE_API_KEY
      }
    });
    
    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

export async function getVideoDetails(videoId) {
  try {
    const response = await axios.get(`${YOUTUBE_API}/videos`, {
      params: {
        id: videoId,
        part: 'contentDetails,snippet',
        key: process.env.YOUTUBE_API_KEY
      }
    });
    
    const video = response.data.items[0];
    return {
      id: video.id,
      title: video.snippet.title,
      duration: parseDuration(video.contentDetails.duration),
      description: video.snippet.description
    };
  } catch (error) {
    console.error('Get video details error:', error);
    return null;
  }
}

function parseDuration(duration) {
  // Convert ISO 8601 duration to seconds
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}
```

### Step 3: Add YouTube Search Route

```javascript
// In routes/music.js
import { searchYouTube } from '../services/youtube.js';

router.get('/search/youtube', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchYouTube(q);
    res.json({
      source: 'youtube',
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});
```

## Lyrics Integration

### LyricsOVH (Free, No Auth Required)

Already integrated! Just uses:
```
GET https://api.lyrics.ovh/v1/{artist}/{song}
```

### Optional: Genius API

1. Get API key from https://genius.com/api-clients
2. Add to `.env`: `GENIUS_ACCESS_TOKEN=your_token`
3. Create `backend/services/lyrics.js`:

```javascript
import axios from 'axios';

export async function getLyricsGenius(artist, song) {
  try {
    const response = await axios.get('https://api.genius.com/search', {
      params: {
        q: `${artist} ${song}`,
        access_token: process.env.GENIUS_ACCESS_TOKEN
      }
    });
    
    const hit = response.data.response.hits[0];
    if (!hit) return null;
    
    return {
      artist,
      song,
      url: hit.result.url,
      thumbnail: hit.result.song_art_image_thumbnail_url
    };
  } catch (error) {
    console.error('Genius error:', error);
    return null;
  }
}
```

## Testing the Integration

### Test Spotify Search

```bash
curl "http://localhost:5000/api/music/search/spotify?q=never%20gonna%20give%20you%20up"
```

Expected response:
```json
{
  "source": "spotify",
  "results": [
    {
      "id": "...",
      "title": "Never Gonna Give You Up",
      "artist": "Rick Astley",
      "duration": 213,
      "preview_url": "https://..."
    }
  ]
}
```

### Test YouTube Search

```bash
curl "http://localhost:5000/api/music/search/youtube?q=never%20gonna%20give%20you%20up"
```

### Test Lyrics

```bash
curl "http://localhost:5000/api/lyrics?artist=Rick%20Astley&song=Never%20Gonna%20Give%20You%20Up"
```

## User Account Management

### Store Multiple Music Accounts

Users can connect both Spotify and YouTube Music:

```javascript
// Schema already includes user_music_accounts table

// Connect account
db.prepare(`
  INSERT INTO user_music_accounts 
  (user_id, service, account_id, access_token, is_premium)
  VALUES (?, ?, ?, ?, ?)
`).run(userId, 'spotify', spotifyId, accessToken, isPremium);

// Get user's accounts
const accounts = db.prepare(
  'SELECT * FROM user_music_accounts WHERE user_id = ?'
).all(userId);
```

## Frontend Integration

### Search Component Updates

```javascript
// In RoomPage.jsx or search component
const [source, setSource] = useState('spotify');

const handleSearch = async (query) => {
  const endpoint = source === 'spotify' 
    ? '/api/music/search/spotify' 
    : '/api/music/search/youtube';
  
  const response = await axios.get(endpoint, {
    params: { q: query }
  });
  
  setSearchResults(response.data.results);
};

// In JSX
<select value={source} onChange={(e) => setSource(e.target.value)}>
  <option value="spotify">Spotify</option>
  <option value="youtube">YouTube Music</option>
</select>
```

## Rate Limiting

Add to prevent API quota exhaustion:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.get('/search/spotify', limiter, async (req, res) => {
  // ...
});
```

## Caching Results

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute TTL

router.get('/search/spotify', async (req, res) => {
  const { q } = req.query;
  const cacheKey = `spotify:${q}`;
  
  // Check cache
  let results = cache.get(cacheKey);
  
  if (!results) {
    results = await searchSongs(q);
    cache.set(cacheKey, results);
  }
  
  res.json({ source: 'spotify', results });
});
```

## Troubleshooting

### "Invalid Spotify Client ID"
- Verify credentials in .env
- Check app is active in Spotify Developer Dashboard

### "YouTube quota exceeded"
- Reduce search frequency
- Implement caching
- Upgrade API quota

### Lyrics not found
- Song might be misspelled
- Try different search terms
- LyricsOVH may not have all songs

### CORS errors with external APIs
- Use backend as proxy (recommended)
- Don't call APIs directly from frontend

## Best Practices

1. **Never expose API keys in frontend**
   - Always proxy through backend
   
2. **Cache API responses**
   - Reduce quota usage
   - Improve performance

3. **Handle API failures gracefully**
   - Fallback to other sources
   - Show user-friendly errors

4. **Rate limit searches**
   - Prevent abuse
   - Manage API quotas

5. **Store user preferences**
   - Remember which service user prefers
   - Use connected accounts

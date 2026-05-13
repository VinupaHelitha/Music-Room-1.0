import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const APP_URL = (process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const SPOTIFY_CALLBACK = `${APP_URL}/api/connect/spotify/callback`;
const YOUTUBE_CALLBACK = `${APP_URL}/api/connect/youtube/callback`;

// ─── Spotify OAuth ────────────────────────────────────────────────────────────

router.get('/spotify', (req, res) => {
  if (!process.env.SPOTIFY_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/oauth-callback?service=spotify&status=not-configured`);
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: 'user-read-recently-played user-top-read user-library-read playlist-read-private',
    redirect_uri: SPOTIFY_CALLBACK,
    state: req.query.token || ''
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

router.get('/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/oauth-callback?service=spotify&status=error`);
  }
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: SPOTIFY_CALLBACK }).toString(),
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token } = tokenRes.data;

    // Profile lookup is optional — don't fail the whole flow if it errors
    let spotifyId = 'unknown';
    let isPremium = false;
    try {
      const profileRes = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      spotifyId = profileRes.data.id || 'unknown';
      isPremium = profileRes.data.product === 'premium';
    } catch (profileErr) {
      console.warn('Could not fetch Spotify profile (non-fatal):', profileErr.message);
    }

    const db = getDatabase();
    await db.query(
      `INSERT INTO user_music_accounts (user_id, service, account_id, access_token, refresh_token, is_premium)
       VALUES ($1, 'spotify', $2, $3, $4, $5)
       ON CONFLICT (user_id, service) DO UPDATE
         SET account_id = $2, access_token = $3, refresh_token = $4, is_premium = $5`,
      [userId, spotifyId, access_token, refresh_token, isPremium]
    );
    res.redirect(`${FRONTEND_URL}/oauth-callback?service=spotify&status=success`);
  } catch (err) {
    console.error('Spotify callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/oauth-callback?service=spotify&status=error`);
  }
});

// ─── YouTube / Google OAuth ───────────────────────────────────────────────────

router.get('/youtube', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/oauth-callback?service=youtube&status=not-configured`);
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    redirect_uri: YOUTUBE_CALLBACK,
    access_type: 'offline',
    prompt: 'consent',
    state: req.query.token || ''
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/youtube/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/oauth-callback?service=youtube&status=error`);
  }
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: YOUTUBE_CALLBACK,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token } = tokenRes.data;

    // Channel lookup is optional — tokens are what matter, channel ID is just metadata
    let channelId = 'unknown';
    try {
      const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'id', mine: true },
        headers: { Authorization: `Bearer ${access_token}` }
      });
      channelId = channelRes.data.items?.[0]?.id || 'unknown';
    } catch (chErr) {
      console.warn('Could not fetch YouTube channel ID (non-fatal):', chErr.message);
    }

    const db = getDatabase();
    await db.query(
      `INSERT INTO user_music_accounts (user_id, service, account_id, access_token, refresh_token)
       VALUES ($1, 'youtube', $2, $3, $4)
       ON CONFLICT (user_id, service) DO UPDATE
         SET account_id = $2, access_token = $3, refresh_token = $4`,
      [userId, channelId, access_token, refresh_token]
    );
    res.redirect(`${FRONTEND_URL}/oauth-callback?service=youtube&status=success`);
  } catch (err) {
    console.error('YouTube callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/oauth-callback?service=youtube&status=error`);
  }
});

// ─── Authenticated data routes ────────────────────────────────────────────────

router.get('/status', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT service, account_id, is_premium FROM user_music_accounts WHERE user_id = $1',
      [req.user.userId]
    );
    const connected = {};
    result.rows.forEach(row => {
      connected[row.service] = { accountId: row.account_id, isPremium: row.is_premium };
    });
    res.json(connected);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch connection status' });
  }
});

// Search Spotify using connected account token (falls back to client credentials)
router.get('/spotify/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  let accessToken = null;

  // Try connected account token first
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT access_token FROM user_music_accounts WHERE user_id = $1 AND service = $2',
      [req.user.userId, 'spotify']
    );
    if (result.rows[0]) accessToken = result.rows[0].access_token;
  } catch (e) {}

  // Fall back to client credentials
  if (!accessToken && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      const tokenRes = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      accessToken = tokenRes.data.access_token;
    } catch (e) {}
  }

  if (!accessToken) return res.status(503).json({ error: 'Spotify not available' });

  try {
    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      params: { q, type: 'track', limit: 15 },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const results = searchRes.data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      thumbnail: track.album.images[0]?.url,
      duration: Math.floor(track.duration_ms / 1000),
      preview_url: track.preview_url,
      source: 'spotify'
    }));
    res.json({ results });
  } catch (err) {
    console.error('Spotify search error:', err.message);
    res.status(500).json({ error: 'Spotify search failed' });
  }
});

router.get('/spotify/recently-played', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT access_token FROM user_music_accounts WHERE user_id = $1 AND service = $2',
      [req.user.userId, 'spotify']
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Spotify not connected' });

    const spotifyRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
      params: { limit: 20 },
      headers: { Authorization: `Bearer ${result.rows[0].access_token}` }
    });
    const tracks = spotifyRes.data.items.map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      thumbnail: item.track.album.images[0]?.url,
      source: 'spotify'
    }));
    res.json(tracks);
  } catch (err) {
    console.error('Spotify recently-played error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recently played. Try reconnecting Spotify.' });
  }
});

router.get('/youtube/liked-videos', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.query(
      'SELECT access_token FROM user_music_accounts WHERE user_id = $1 AND service = $2',
      [req.user.userId, 'youtube']
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'YouTube not connected' });

    const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet', myRating: 'like', maxResults: 20 },
      headers: { Authorization: `Bearer ${result.rows[0].access_token}` }
    });
    const videos = ytRes.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      source: 'youtube',
      preview_url: `https://www.youtube.com/watch?v=${item.id}`
    }));
    res.json(videos);
  } catch (err) {
    console.error('YouTube liked-videos error:', err.message);
    res.status(500).json({ error: 'Failed to fetch liked videos. Try reconnecting YouTube.' });
  }
});

router.delete('/:service', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    await db.query(
      'DELETE FROM user_music_accounts WHERE user_id = $1 AND service = $2',
      [req.user.userId, req.params.service]
    );
    res.json({ message: `Disconnected ${req.params.service}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect service' });
  }
});

export default router;

import express from 'express';
import axios from 'axios';
import { searchAllSources, searchSpotifySongs, searchiTunesSongs, searchGeniusSongs, searchYouTubeAudio } from '../services/musicSearch.js';

const router = express.Router();

// Universal search - searches all sources
router.get('/search', async (req, res) => {
  try {
    const { q, source } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query required' });
    }

    let results = [];

    if (!source || source === 'all') {
      results = await searchAllSources(q);
    } else if (source === 'spotify') {
      results = await searchSpotifySongs(q);
    } else if (source === 'itunes') {
      results = await searchiTunesSongs(q);
    } else if (source === 'genius') {
      results = await searchGeniusSongs(q);
    }

    res.json({
      source: source || 'all',
      query: q,
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search Spotify specifically
router.get('/search/spotify', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchSpotifySongs(q);
    res.json({ source: 'spotify', results });
  } catch (error) {
    res.status(500).json({ error: 'Spotify search failed' });
  }
});

// Search iTunes (free, no key needed)
router.get('/search/itunes', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchiTunesSongs(q);
    res.json({ source: 'itunes', results });
  } catch (error) {
    res.status(500).json({ error: 'iTunes search failed' });
  }
});

// Search Genius
router.get('/search/genius', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchGeniusSongs(q);
    res.json({ source: 'genius', results });
  } catch (error) {
    res.status(500).json({ error: 'Genius search failed' });
  }
});

// Search YouTube
router.get('/search/youtube', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchYouTubeAudio(q);
    res.json({ source: 'youtube', results });
  } catch (error) {
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

// Get currently playing song in a room
router.get('/room/:roomId/current', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    res.json({
      roomId,
      currentSong: null,
      isPlaying: false,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current song' });
  }
});

export default router;

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get lyrics for a song
router.get('/', async (req, res) => {
  try {
    const { artist, song } = req.query;

    if (!artist || !song) {
      return res.status(400).json({ error: 'Artist and song name required' });
    }

    // Use LyricsOVH API (free, no auth required)
    const response = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`
    );

    if (response.data && response.data.lyrics) {
      res.json({
        artist,
        song,
        lyrics: response.data.lyrics,
        source: 'lyrics.ovh'
      });
    } else {
      res.status(404).json({ error: 'Lyrics not found' });
    }
  } catch (error) {
    console.error('Lyrics search error:', error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

// Get lyrics from multiple sources with fallback
router.get('/search', async (req, res) => {
  try {
    const { artist, song } = req.query;

    if (!artist || !song) {
      return res.status(400).json({ error: 'Artist and song name required' });
    }

    let lyrics = null;
    let source = null;

    // Try LyricsOVH first
    try {
      const response = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`,
        { timeout: 5000 }
      );
      if (response.data && response.data.lyrics) {
        lyrics = response.data.lyrics;
        source = 'lyrics.ovh';
      }
    } catch (err) {
      console.log('LyricsOVH failed, trying fallback');
    }

    if (!lyrics) {
      return res.status(404).json({ error: 'Lyrics not found' });
    }

    res.json({
      artist,
      song,
      lyrics,
      source
    });
  } catch (error) {
    console.error('Lyrics search error:', error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

export default router;

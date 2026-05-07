import axios from 'axios';
import * as yt from 'yt-search';

// Search YouTube for full-length audio
export async function searchYouTubeAudio(query) {
  try {
    const results = await yt(query);
    
    if (!results || !results.videos) {
      return [];
    }

    return results.videos.slice(0, 10).map(video => ({
      id: video.videoId,
      title: video.title,
      artist: video.author.name,
      thumbnail: video.image,
      duration: video.seconds || 0,
      preview_url: `https://www.youtube.com/watch?v=${video.videoId}`,
      source: 'youtube',
      url: video.url
    }));
  } catch (error) {
    console.error('YouTube search error:', error.message);
    return [];
  }
}

// Search using Genius API (free tier available)
export async function searchGeniusSongs(query) {
  try {
    const geniusToken = process.env.GENIUS_ACCESS_TOKEN;
    if (!geniusToken) {
      return [];
    }

    const response = await axios.get('https://api.genius.com/search', {
      params: {
        q: query,
        access_token: geniusToken
      },
      timeout: 5000
    });

    return response.data.response.hits.slice(0, 10).map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url,
      thumbnail: hit.result.song_art_image_thumbnail_url,
      source: 'genius',
      duration: null
    }));
  } catch (error) {
    console.error('Genius search error:', error.message);
    return [];
  }
}

// Search using Spotify API (free tier available, need credentials)
export async function searchSpotifySongs(query) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return [];
    }

    // Get access token using client credentials flow
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Search for tracks
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 5000
    });

    return searchResponse.data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      thumbnail: track.album.images[0]?.url,
      duration: Math.floor(track.duration_ms / 1000),
      preview_url: track.preview_url,
      source: 'spotify'
    }));
  } catch (error) {
    console.error('Spotify search error:', error.message);
    return [];
  }
}

// Search iTunes (completely free, no API key needed)
export async function searchiTunesSongs(query) {
  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        limit: 10,
        entity: 'song'
      },
      timeout: 5000
    });

    return response.data.results.map(track => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      thumbnail: track.artworkUrl100?.replace('100x100', '500x500'),
      duration: Math.floor(track.trackTimeMillis / 1000),
      preview_url: track.previewUrl,
      source: 'itunes'
    }));
  } catch (error) {
    console.error('iTunes search error:', error.message);
    return [];
  }
}

// Universal search - try all sources
export async function searchAllSources(query) {
  const [genius, spotify, itunes, youtube] = await Promise.all([
    searchGeniusSongs(query),
    searchSpotifySongs(query),
    searchiTunesSongs(query),
    searchYouTubeAudio(query)
  ]);

  // Combine: prioritize full-length sources (YouTube, iTunes) over preview-only (Spotify)
  const all = [...youtube, ...itunes, ...genius, ...spotify];
  
  // Remove duplicates based on title + artist
  const seen = new Set();
  return all.filter(song => {
    const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

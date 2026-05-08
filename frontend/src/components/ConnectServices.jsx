import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './ConnectServices.css';

export default function ConnectServices({ onPlaySong }) {
  const { token } = useAuthStore();
  const [connected, setConnected] = useState({});
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [youtubeTracks, setYoutubeTracks] = useState([]);
  const [activeTab, setActiveTab] = useState('spotify');
  const [trackError, setTrackError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/connect/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnected(res.data);
    } catch (e) {}
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (connected.spotify) {
      setTrackError('');
      axios.get('/api/connect/spotify/recently-played', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => setSpotifyTracks(r.data)).catch(e => {
        setTrackError(e.response?.data?.error || 'Failed to load Spotify tracks');
        setSpotifyTracks([]);
      });
    }
  }, [connected.spotify, token]);

  useEffect(() => {
    if (connected.youtube) {
      setTrackError('');
      axios.get('/api/connect/youtube/liked-videos', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => setYoutubeTracks(r.data)).catch(e => {
        setTrackError(e.response?.data?.error || 'Failed to load YouTube videos');
        setYoutubeTracks([]);
      });
    }
  }, [connected.youtube, token]);

  const openOAuth = (service) => {
    const popup = window.open(
      `/api/connect/${service}?token=${token}`,
      `connect-${service}`,
      'width=520,height=680,scrollbars=yes,resizable=yes'
    );

    const handler = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'oauth-callback' || e.data.service !== service) return;
      window.removeEventListener('message', handler);
      clearInterval(pollClosed);
      if (e.data.status === 'success') {
        fetchStatus();
      } else if (e.data.status === 'not-configured') {
        setTrackError(`${service === 'spotify' ? 'Spotify' : 'YouTube'} OAuth is not configured. Set the required API keys in Railway.`);
      } else {
        setTrackError('Connection failed. Please try again.');
      }
    };
    window.addEventListener('message', handler);

    const pollClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollClosed);
        window.removeEventListener('message', handler);
      }
    }, 1000);
  };

  const disconnect = async (service) => {
    try {
      await axios.delete(`/api/connect/${service}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnected(prev => { const n = { ...prev }; delete n[service]; return n; });
      if (service === 'spotify') setSpotifyTracks([]);
      if (service === 'youtube') setYoutubeTracks([]);
      setTrackError('');
    } catch (e) {}
  };

  const tracks = activeTab === 'spotify' ? spotifyTracks : youtubeTracks;
  const isConnected = activeTab === 'spotify' ? !!connected.spotify : !!connected.youtube;
  const serviceName = activeTab === 'spotify' ? 'Spotify' : 'YouTube';

  return (
    <div className="connect-services card">
      <h3>🔗 Connect Services</h3>

      <div className="service-tabs">
        <button
          className={`service-tab ${activeTab === 'spotify' ? 'active' : ''}`}
          onClick={() => { setActiveTab('spotify'); setTrackError(''); }}
        >
          🟢 Spotify
        </button>
        <button
          className={`service-tab ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => { setActiveTab('youtube'); setTrackError(''); }}
        >
          🔴 YouTube
        </button>
      </div>

      {trackError && <p className="connect-error">{trackError}</p>}

      {isConnected ? (
        <div className="service-section">
          <div className="connected-badge">
            <span>✅ {serviceName} Connected
              {activeTab === 'spotify' && connected.spotify?.isPremium && (
                <span className="premium-tag"> Premium</span>
              )}
            </span>
            <button className="btn-link" onClick={() => disconnect(activeTab)}>Disconnect</button>
          </div>
          <p className="section-label">
            {activeTab === 'spotify' ? 'Recently Played' : 'Liked Videos'}
          </p>
          <div className="service-tracks">
            {tracks.length === 0 ? (
              <p className="empty">No tracks found.</p>
            ) : (
              tracks.map((t, i) => (
                <div key={i} className="service-track-item" onClick={() => onPlaySong(t)}>
                  {t.thumbnail && <img src={t.thumbnail} alt="" className="track-thumb" />}
                  <div className="track-info">
                    <p className="track-title">{t.title}</p>
                    <p className="track-artist">{t.artist}</p>
                  </div>
                  <button className="btn-success btn-sm play-btn">▶</button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="connect-prompt">
          <p>
            {activeTab === 'spotify'
              ? 'Connect your Spotify account to access recently played tracks and playlists.'
              : 'Connect your YouTube account to access liked videos. Songs play in full length.'}
          </p>
          <button
            className={activeTab === 'spotify' ? 'btn-spotify' : 'btn-youtube'}
            onClick={() => openOAuth(activeTab)}
          >
            {activeTab === 'spotify' ? '🟢 Connect Spotify' : '🔴 Connect YouTube'}
          </button>
        </div>
      )}
    </div>
  );
}

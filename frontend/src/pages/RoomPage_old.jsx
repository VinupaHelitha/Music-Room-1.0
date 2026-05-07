import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import LyricsDisplay from '../components/LyricsDisplay';
import MusicPlayer from '../components/MusicPlayer';
import './RoomPage.css';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const {
    currentRoom,
    setCurrentRoom,
    currentSong,
    setCurrentSong,
    lyrics,
    setLyrics,
    members,
    setMembers
  } = useRoomStore();

  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('song-playing', (song) => {
      setCurrentSong(song);
      fetchLyrics(song.artist, song.title);
    });

    newSocket.on('song-paused', () => {
      setCurrentSong(null);
    });

    newSocket.on('lyrics-updated', (lyricsData) => {
      setLyrics(lyricsData);
    });

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, token]);

  // Fetch room details
  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentRoom(response.data);
    } catch (err) {
      setError('Failed to fetch room details');
    }
  };

  const fetchLyrics = async (artist, song) => {
    try {
      const response = await axios.get('/api/lyrics/search', {
        params: { artist, song }
      });
      setLyrics(response.data);
    } catch (err) {
      console.error('Failed to fetch lyrics:', err);
    }
  };

  const handleSearchSongs = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Try Spotify first
      const response = await axios.get('/api/music/search/spotify', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data.results);
    } catch (err) {
      setError('Failed to search songs');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (socket) {
      socket.emit('play-song', { roomId, song });
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', roomId);
      socket.disconnect();
    }
    navigate('/dashboard');
  };

  return (
    <div className="room-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🎵 {currentRoom?.name || 'Music Room'}</h1>
          <button className="btn-secondary" onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      </nav>

      <div className="room-container">
        <div className="room-main">
          <div className="now-playing">
            <h2>Now Playing</h2>
            {currentSong ? (
              <div className="song-display card">
                <h3>{currentSong.title}</h3>
                <p>{currentSong.artist}</p>
                {currentRoom?.allow_audio && (
                  <MusicPlayer song={currentSong} roomId={roomId} socket={socket} />
                )}
              </div>
            ) : (
              <div className="card empty-song">
                <p>No song playing yet</p>
              </div>
            )}
          </div>

          <div className="lyrics-section">
            <h2>Lyrics</h2>
            {lyrics ? (
              <LyricsDisplay lyrics={lyrics} />
            ) : (
              <div className="card empty-lyrics">
                <p>Lyrics will appear here when a song is playing</p>
              </div>
            )}
          </div>
        </div>

        <div className="room-sidebar">
          <div className="search-section card">
            <h3>Search & Queue</h3>
            <form onSubmit={handleSearchSongs}>
              <div className="form-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for songs..."
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>Results ({searchResults.length})</h4>
                {searchResults.map((song, idx) => (
                  <div key={idx} className="song-item">
                    <div>
                      <p className="song-title">{song.title}</p>
                      <p className="song-artist">{song.artist}</p>
                    </div>
                    <button
                      className="btn-success"
                      onClick={() => handlePlaySong(song)}
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="members-section card">
            <h3>Room Members ({members.length})</h3>
            <div className="members-list">
              {members.length === 0 ? (
                <p className="empty">No members yet</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="member-item">
                    👤 {member.name}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="info-section card">
            <h3>Room Info</h3>
            <div className="info-item">
              <span>Type:</span>
              <strong>{currentRoom?.is_public ? 'Public' : 'Private'}</strong>
            </div>
            <div className="info-item">
              <span>Audio:</span>
              <strong>{currentRoom?.allow_audio ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div className="info-item">
              <span>You:</span>
              <strong>{user?.name}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

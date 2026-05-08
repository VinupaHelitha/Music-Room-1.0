import { useState, useEffect, useRef } from 'react';
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
    setMembers,
    isPlaying,
    setIsPlaying
  } = useRoomStore();

  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [queue, setQueue] = useState([]);
  const [roomAudioEnabled, setRoomAudioEnabled] = useState(true);
  const [karaokeFilter, setKaraokeFilter] = useState('all');
  const [audioMuted, setAudioMuted] = useState(false);
  const [activeLyricLine, setActiveLyricLine] = useState(0);
  const [lyricsLines, setLyricsLines] = useState([]);
  const audioRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  useEffect(() => {
    if (currentRoom?.room_code) {
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/join/${currentRoom.room_code}`);
    }
  }, [currentRoom?.room_code]);

  useEffect(() => {
    if (lyrics?.lyrics) {
      setLyricsLines(lyrics.lyrics.split('\n'));
    } else {
      setLyricsLines([]);
      setActiveLyricLine(0);
    }
  }, [lyrics]);

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('room-state', (state) => {
      setQueue(state.queue || []);
      setRoomAudioEnabled(state.allowAudio ?? true);
      setCurrentSong(state.currentSong);
      setIsPlaying(state.isPlaying);
      if (state.lyrics) {
        setLyrics(state.lyrics);
      }
    });

    newSocket.on('song-playing', (song) => {
      setCurrentSong(song);
      setIsPlaying(true);
      fetchLyrics(song.artist, song.title);
    });

    newSocket.on('player-state', (state) => {
      if (state.currentSong) setCurrentSong(state.currentSong);
      if (typeof state.isPlaying === 'boolean') setIsPlaying(state.isPlaying);
    });

    newSocket.on('song-paused', () => {
      setIsPlaying(false);
    });

    newSocket.on('audio-toggled', (allowAudio) => {
      setRoomAudioEnabled(allowAudio);
    });

    newSocket.on('queue-updated', (updatedQueue) => {
      setQueue(updatedQueue || []);
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
  }, [roomId, token, setCurrentSong, setIsPlaying, setLyrics]);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentRoom(response.data);
      setRoomAudioEnabled(response.data.allow_audio === 1 || response.data.allow_audio === true);
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

    const query = searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setError('');

    try {
      const filterQuery =
        karaokeFilter === 'karaoke'
          ? `${query} karaoke`
          : karaokeFilter === 'instrumental'
          ? `${query} instrumental`
          : query;

      const response = await axios.get('/api/music/search', {
        params: { q: filterQuery, source: 'all' }
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
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleEnqueueSong = (song) => {
    if (socket) {
      socket.emit('enqueue-song', { roomId, song });
    }
  };

  const handlePlayQueueItem = (song, index) => {
    if (socket) {
      socket.emit('play-song', { roomId, song });
      const updated = queue.filter((_, i) => i !== index);
      setQueue(updated);
      socket.emit('reorder-queue', { roomId, queue: updated });
    }
  };

  const handleRemoveQueueItem = (index) => {
    if (socket) {
      socket.emit('remove-queue-item', { roomId, index });
    }
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...queue];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setQueue(updated);
    setDragIndex(null);

    if (socket) {
      socket.emit('reorder-queue', { roomId, queue: updated });
    }
  };

  const handleToggleRoomAudio = async () => {
    const newValue = !roomAudioEnabled;
    setRoomAudioEnabled(newValue);

    try {
      await axios.post(
        `/api/rooms/${roomId}/toggle-audio`,
        { allowAudio: newValue },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error('Failed to update audio setting', err);
    }

    if (socket) {
      socket.emit('toggle-audio', { roomId, allowAudio: newValue });
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', roomId);
      socket.disconnect();
    }
    navigate('/dashboard');
  };

  const copyRoomCode = () => {
    if (currentRoom?.room_code) {
      navigator.clipboard.writeText(currentRoom.room_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  const handleTimeUpdate = (time, duration) => {
    if (!lyricsLines.length || duration === 0) return;
    // Only map time against non-empty lines so blank verse-break lines don't waste sync time
    const contentIndices = lyricsLines.reduce((acc, line, i) => {
      if (line.trim()) acc.push(i);
      return acc;
    }, []);
    if (!contentIndices.length) return;
    const pos = Math.min(
      Math.floor((time / duration) * contentIndices.length),
      contentIndices.length - 1
    );
    setActiveLyricLine(contentIndices[pos]);
  };

  const handleSongEnded = () => {
    if (socket) {
      socket.emit('play-next', roomId);
    }
    setIsPlaying(false);
  };

  const handleLineSelect = (index) => {
    setActiveLyricLine(index);
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = (index / lyricsLines.length) * audioRef.current.duration;
  };

  return (
    <div className="room-page">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🎵 {currentRoom?.name || 'Music Room'}</h1>
          <div className="room-code-display">
            <button
              className="btn-secondary btn-sm"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? '✕ Hide' : '🔐 Code'} {showCode && `: ${currentRoom?.room_code}`}
            </button>
            {showCode && (
              <button className="btn-primary btn-sm" onClick={copyRoomCode}>
                {copiedCode ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <button className="btn-secondary" onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      </nav>

      <div className="room-container">
        <div className="room-main">
          <div className="now-playing">
            <div className="now-playing-header">
              <h2>Now Playing</h2>
              <button className="btn-secondary btn-sm" onClick={handleToggleRoomAudio}>
                {roomAudioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
              </button>
            </div>

            {currentSong ? (
              <div className="song-display card">
                <h3>{currentSong.title}</h3>
                <p>{currentSong.artist}</p>
                <MusicPlayer
                  song={currentSong}
                  roomId={roomId}
                  socket={socket}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  muted={!roomAudioEnabled || audioMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(duration) => setTimeout(() => handleTimeUpdate(audioRef.current?.currentTime || 0, duration), 0)}
                  audioRef={audioRef}
                  toggleMute={() => setAudioMuted((prev) => !prev)}
                  audioMuted={audioMuted}
                  onSongEnded={handleSongEnded}
                />
              </div>
            ) : (
              <div className="card empty-song">
                <p>No song playing yet. Search and play a song below!</p>
              </div>
            )}
          </div>

          <div className="lyrics-section">
            <h2>Lyrics</h2>
            {lyrics ? (
              <LyricsDisplay
                lyrics={lyrics}
                activeLineIndex={activeLyricLine}
                onLineSelect={handleLineSelect}
              />
            ) : (
              <div className="card empty-lyrics">
                <p>Lyrics will appear here when a song is playing</p>
              </div>
            )}
          </div>
        </div>

        <div className="room-sidebar">
          <div className="search-section card">
            <h3>🔍 Search Music</h3>
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
              <div className="form-group select-group">
                <label htmlFor="search-filter">Filter</label>
                <select
                  id="search-filter"
                  value={karaokeFilter}
                  onChange={(e) => setKaraokeFilter(e.target.value)}
                >
                  <option value="all">All songs</option>
                  <option value="karaoke">Karaoke</option>
                  <option value="instrumental">Instrumental</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            <p className="search-info">
              💡 Use the filter to find karaoke or instrumental versions.
            </p>

            {error && <div className="error-message">{error}</div>}

            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>Results ({searchResults.length})</h4>
                {searchResults.map((song, idx) => (
                  <div key={idx} className="song-item">
                    {song.thumbnail && (
                      <img src={song.thumbnail} alt={song.title} className="song-thumbnail" />
                    )}
                    <div className="song-info">
                      <p className="song-title">{song.title}</p>
                      <p className="song-artist">{song.artist}</p>
                      <p className="song-source">{song.source}</p>
                    </div>
                    <div className="song-actions">
                      <button
                        className="btn-success btn-sm"
                        onClick={() => handlePlaySong(song)}
                      >
                        ▶
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleEnqueueSong(song)}
                      >
                        + Queue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="queue-section card">
            <h3>🎶 Next in Queue</h3>
            {queue.length === 0 ? (
              <p className="empty">Queue is empty. Add songs from search.</p>
            ) : (
              <div className="queue-list">
                {queue.map((song, idx) => (
                  <div
                    key={`${song.id || song.title}-${idx}`}
                    className={`queue-item ${idx === activeLyricLine ? 'active-queue' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                  >
                    <div className="queue-item-info">
                      <strong>{idx + 1}.</strong>
                      <div>
                        <p>{song.title}</p>
                        <p>{song.artist}</p>
                      </div>
                    </div>
                    <div className="queue-actions">
                      <button className="btn-primary btn-sm" onClick={() => handlePlayQueueItem(song, idx)}>
                        ▶
                      </button>
                      <button className="btn-secondary btn-sm" onClick={() => handleRemoveQueueItem(idx)}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="members-section card">
            <h3>👥 Room Members</h3>
            <div className="members-list">
              <div className="member-item">
                👤 {user?.name} (You)
              </div>
              {members.length === 0 ? (
                <p className="empty">Waiting for others...</p>
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
            <h3>ℹ️ Room Info</h3>
            <div className="info-item">
              <span>Type:</span>
              <strong>{currentRoom?.is_public ? '🌍 Public' : '🔒 Private'}</strong>
            </div>
            <div className="info-item">
              <span>Audio:</span>
              <strong>{roomAudioEnabled ? '🔊 Enabled' : '🔇 Disabled'}</strong>
            </div>
            <div className="info-item">
              <span>Room Code:</span>
              <strong>{currentRoom?.room_code}</strong>
            </div>
            {currentRoom?.creator_id === user?.id && (
              <div className="info-item info-creator">
                👑 You are the host
              </div>
            )}

            <div className="share-link-section">
              <h4>📤 Share Room Link</h4>
              <div className="share-link-input">
                <input type="text" value={shareLink} readOnly />
                <button className="btn-primary btn-sm" onClick={copyShareLink}>
                  {copiedShareLink ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

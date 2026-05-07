import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import './DashboardPage.css';

export default function DashboardPage() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowAudio, setAllowAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const { rooms, setRooms } = useRoomStore();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms/user/my-rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (err) {
      setError('Failed to fetch rooms');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/rooms/create',
        { roomName, isPublic, allowAudio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms([...rooms, response.data]);
      setRoomName('');
      setIsPublic(false);
      setAllowAudio(false);
      setShowCreateRoom(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🎵 Music Room</h1>
          <div className="navbar-actions">
            <span className="user-info">Welcome, {user?.name}!</span>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <h2>Your Music Rooms</h2>
          <button
            className="btn-primary"
            onClick={() => setShowCreateRoom(!showCreateRoom)}
          >
            {showCreateRoom ? '✕ Close' : '+ Create Room'}
          </button>
        </div>

        {showCreateRoom && (
          <div className="card create-room-form">
            <h3>Create New Music Room</h3>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Late Night Vibes"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={loading}
                  />
                  Make room public
                </label>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={allowAudio}
                    onChange={(e) => setAllowAudio(e.target.checked)}
                    disabled={loading}
                  />
                  Allow audio playback (only if you're streaming)
                </label>
              </div>

              <button type="submit" className="btn-success" disabled={loading}>
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        <div className="rooms-grid">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms yet. Create your first room to get started!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="room-card card">
                <h3>{room.name}</h3>
                <div className="room-info">
                  <span className="badge">
                    {room.is_public ? '🌍 Public' : '🔒 Private'}
                  </span>
                  <span className="badge">
                    {room.allow_audio ? '🔊 Audio' : '📝 Lyrics Only'}
                  </span>
                </div>
                <p className="room-created">
                  Created: {new Date(room.created_at).toLocaleDateString()}
                </p>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  Enter Room
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

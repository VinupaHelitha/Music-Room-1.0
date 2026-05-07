import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

export default function JoinRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const joinRoom = async () => {
      try {
        // Fetch room by code
        const response = await axios.get(`/api/rooms/code/${roomCode}`);
        setRoom(response.data);

        // Join the room
        await axios.post(
          `/api/rooms/${response.data.id}/join`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Redirect to room
        navigate(`/room/${response.data.id}`);
      } catch (err) {
        setError('Failed to join room. Room may not exist or is private.');
        setLoading(false);
      }
    };

    joinRoom();
  }, [roomCode, token, navigate]);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <p>Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1>Oops!</h1>
          <p className="error">{error}</p>
          <button onClick={() => navigate('/dashboard')}>Go Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return null;
}

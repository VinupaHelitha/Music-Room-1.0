import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleSendCode = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post('/api/auth/delete-account-request', { email });
      setCodeSent(true);
      setMessage('A deletion code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send deletion code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post('/api/auth/delete-account', { email, code });
      logout();
      setMessage('Your account has been deleted. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎵 Music Room</h1>
        <h2>Delete Your Account</h2>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <p className="instruction-text">
          Enter the email associated with your account. We'll send a one-time code to confirm deletion.
        </p>

        <form onSubmit={handleDeleteAccount}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Deletion Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              disabled={loading || !codeSent}
              className="code-input"
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSendCode}
            disabled={loading || !email}
          >
            {loading && !codeSent ? 'Sending code...' : 'Send Deletion Code'}
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !codeSent || code.length < 6}
          >
            {loading && codeSent ? 'Deleting account...' : 'Delete Account'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Remembered your password? <Link to="/login">Login here</Link>
          </p>
          <p>
            Need to create a new account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

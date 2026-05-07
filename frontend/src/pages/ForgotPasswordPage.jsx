import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email Input, 2: Code Verification, 3: New Password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess('If this email exists, we\'ve sent a reset code. Check your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password', {
        email,
        code: resetCode,
        newPassword
      });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🎵 Music Room</h1>
          <h2>Forgot Password?</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <p className="instruction-text">
              We'll send a 6-digit reset code to your email address.
            </p>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Remember your password? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 & 3: Code + Password Reset
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎵 Music Room</h1>
        <h2>Reset Your Password</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleResetSubmit}>
          <div className="form-group">
            <label>Reset Code</label>
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              disabled={loading}
              className="code-input"
            />
            <p className="instruction-text">Enter the 6-digit code sent to your email</p>
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            <button 
              type="button" 
              className="link-button"
              onClick={() => {
                setStep(1);
                setResetCode('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              Start Over
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

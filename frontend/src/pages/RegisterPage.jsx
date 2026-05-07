import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Registration, 2: Email Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password
      });
      
      // Move to verification step
      setStep(2);
      setError('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-email', {
        email,
        code: verificationCode
      });
      
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🎵 Music Room</h1>
          <h2>Create Your Account</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
              <label>Password</label>
              <div className="password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
            <p>
              Need to delete your account? <Link to="/delete-account">Delete account</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Email Verification
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎵 Music Room</h1>
        <h2>Verify Your Email</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="verification-info">
          <p>We've sent a 6-digit verification code to:</p>
          <p className="email-display">{email}</p>
          <p className="code-info">Check your email and enter the code below. The code expires in 15 minutes.</p>
        </div>

        <form onSubmit={handleVerificationSubmit}>
          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              disabled={loading}
              className="code-input"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            <button 
              type="button" 
              className="link-button"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back to Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

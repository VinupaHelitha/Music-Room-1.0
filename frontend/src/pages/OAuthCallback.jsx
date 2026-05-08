import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const service = params.get('service');
  const status = params.get('status');

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'oauth-callback', service, status }, window.location.origin);
      window.close();
    }
  }, [service, status]);

  const messages = {
    success: '✅ Connected! This window will close automatically.',
    error: '❌ Connection failed. Please try again.',
    'not-configured': '⚠️ This service is not configured yet. Ask your admin to set the API keys.'
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'
    }}>
      <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>🎵 Music Room</h2>
      <p style={{ fontSize: '16px', textAlign: 'center', padding: '0 20px' }}>
        {messages[status] || 'Processing...'}
      </p>
      {!window.opener && (
        <p style={{ marginTop: '20px', fontSize: '13px', opacity: 0.8 }}>
          You can close this window.
        </p>
      )}
    </div>
  );
}

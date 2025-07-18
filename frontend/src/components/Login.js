import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Login failed.'
      );
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .login-card {
            padding: 16px !important;
            border-radius: 10px !important;
            min-width: 0 !important;
            box-shadow: 0 2px 8px rgba(70,111,166,0.08) !important;
          }
          .login-card h2 {
            font-size: 1.3rem !important;
          }
          .login-card input {
            font-size: 15px !important;
            padding: 8px !important;
          }
          .login-card button {
            font-size: 15px !important;
            padding: 10px 0 !important;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fa' }}>
        <form onSubmit={handleSubmit} className="login-card" style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', minWidth: 320, maxWidth: '100%', width: '100%' }}>
          <h2 style={{ marginBottom: 24 }}>Login</h2>
          <div style={{ marginBottom: 16 }}>
            <label>Email:<br />
              <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Password:<br />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            </label>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', background: '#6b8bbd', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;

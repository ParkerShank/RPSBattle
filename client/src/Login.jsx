import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameSocket } from './hooks/useGameSocket';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setAuthToken, authenticated } = useGameSocket();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://18.189.1.63:3001/api/login', { //, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('[LOGIN_RESPONSE]', data);
      setMessage(data.message);

      if (response.ok && data.user && data.token) {
        console.log('[LOGIN] Saving token to localStorage');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        setAuthToken(data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      setMessage('Error connecting to server.', error);
    }
  };

  const statusClass = message
    ? message.toLowerCase().includes('success')
      ? 'status status-success'
      : 'status status-error'
    : 'status status-muted';

  return (
    <main className="page">
      <section className="panel center">
        <h1>Menu</h1>
        <p className="subtitle">Sign in and jump into real-time matches.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          <button className="btn btn-primary" type="submit">Login</button>
        </form>

        <p className={statusClass}>{message || 'Use your account credentials to continue.'}</p>

        <p style={{ marginTop: '0.85rem' }}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>

        <div className="menu">
          {authenticated ? (
            <>
              <Link className="btn btn-secondary" to="/testing">Queue</Link>
              <Link className="btn btn-secondary" to="/dashboard">Dashboard</Link>
            </>
          ) : (
            <Link className="btn btn-secondary" to="/register">Register</Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default Login;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameSocket } from './hooks/useGameSocket';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { authenticated } = useGameSocket();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('[REGISTER] Error:', error);
      setMessage('Error connecting to server.');
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
        <h1>Create Account</h1>
        <p className="subtitle">Set up your profile and join the bracket.</p>

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
            autoComplete="new-password"
            required
          />

          <button className="btn btn-primary" type="submit">Register</button>
        </form>

        <p className={statusClass}>{message || 'A strong password helps keep your stats safe.'}</p>

        <p style={{ marginTop: '0.85rem' }}>
          Already have an account? <Link to="/">Login here</Link>
        </p>

        <div className="menu">
          {authenticated ? (
            <Link className="btn btn-secondary" to="/testing">Queue</Link>
          ) : (
            <Link className="btn btn-secondary" to="/">Login</Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default Register;

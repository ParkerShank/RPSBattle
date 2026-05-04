import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');

    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <main className="page">
      <section className="panel center">
        <h1>Player Dashboard</h1>

        {user ? (
          <>
            <p className="subtitle">Welcome back, {user.username}. Ready for your next match?</p>
            <div className="menu">
              <Link className="btn btn-primary" to="/testing">Join Matchmaking Queue</Link>
              <button className="btn btn-danger" type="button" onClick={handleLogout}>Logout</button>
            </div>
          </>
        ) : (
          <p className="status status-muted">Loading your profile...</p>
        )}

        {!user && (
          <div className="menu">
            <Link className="btn btn-secondary" to="/">Login</Link>
            <Link className="btn btn-secondary" to="/register">Register</Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default Dashboard;
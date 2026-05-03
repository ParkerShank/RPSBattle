import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>Dashboard</h1>

      {user ? (
        <>
          <p>Welcome, {user.username}! You are logged in.</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Link to="/testing">
          <button type="button">Testing</button>
        </Link>
        <Link to="/"><button type="button">Login</button></Link>
      </div>
    </div>
  );
}

export default Dashboard;
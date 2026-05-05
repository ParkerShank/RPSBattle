import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useGameSocket } from './hooks/useGameSocket';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentMatch, resetCurrentMatch } = useGameSocket();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (currentMatch && !currentMatch.inProgress) {
      resetCurrentMatch();
    }

    fetchUserProfile(userData.username);
    fetchRecentGames(userData.id);
  }, [navigate, currentMatch, resetCurrentMatch]);

  const fetchUserProfile = async (username) => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/${encodeURIComponent(username)}`);
      if (response.ok) {
        const refreshedUser = await response.json();
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchRecentGames = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/user/${userId}/recent-games`);
      if (response.ok) {
        const games = await response.json();
        setRecentGames(games);
      } else {
        console.error('Failed to fetch recent games');
      }
    } catch (error) {
      console.error('Error fetching recent games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResultBadgeColor = (result) => {
    if (result === 'win') return '#4CAF50';
    if (result === 'loss') return '#f44336';
    return '#FF9800';
  };

  const getResultText = (result) => {
    if (result === 'win') return 'WIN';
    if (result === 'loss') return 'LOSS';
    return 'TIE';
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>Dashboard</h1>

      {user ? (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h2>Welcome, {user.username}!</h2>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <p><strong>Wins:</strong> {user.wins}</p>
              </div>
              <div>
                <p><strong>Losses:</strong> {user.losses}</p>
              </div>
              <div>
                <p><strong>Ties:</strong> {user.ties}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2>Recent Games (Last 15)</h2>
            {loading ? (
              <p>Loading games...</p>
            ) : recentGames.length === 0 ? (
              <p>No games played yet. Start playing to see your game history!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #333' }}>Date</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #333' }}>Opponent</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #333' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGames.map((game) => (
                      <tr key={game.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{formatDate(game.finished_at)}</td>
                        <td style={{ padding: '10px' }}>{game.opponent}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            backgroundColor: getResultBadgeColor(game.result),
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                          }}>
                            {getResultText(game.result)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
            <Link to="/testing">
              <button type="button" style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Find a Match
              </button>
            </Link>
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Dashboard;
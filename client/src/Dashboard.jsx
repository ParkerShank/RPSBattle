import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      const response = await fetch(`http://3.141.165.85:3000/api/user/${encodeURIComponent(username)}`);
      if (response.ok) {
        const refreshedUser = await response.json();
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchRecentGames = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://3.141.165.85:3000/api/user/${userId}/recent-games`);
      if (response.ok) {
        const games = await response.json();
        setRecentGames(games);
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

  const getBadgeClass = (result) => {
    if (result === 'win') return 'badge badge-win';
    if (result === 'loss') return 'badge badge-loss';
    return 'badge badge-tie';
  };

  const getResultText = (result) => {
    if (result === 'win') return 'WIN';
    if (result === 'loss') return 'LOSS';
    return 'TIE';
  };

  return (
    <main className="page">
      <section className="panel center">
        <h1>Player Dashboard</h1>

        {user ? (
          <>
            <p className="subtitle">Welcome back, {user.username}</p>

            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-number stat-number-win">{user.wins ?? 0}</div>
                <div className="stat-label">Wins</div>
              </div>
              <div className="stat-item">
                <div className="stat-number stat-number-loss">{user.losses ?? 0}</div>
                <div className="stat-label">Losses</div>
              </div>
              <div className="stat-item">
                <div className="stat-number stat-number-tie">{user.ties ?? 0}</div>
                <div className="stat-label">Ties</div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', textAlign: 'left' }}>Recent Games</h2>

            {loading ? (
              <div className="searching-dots" style={{ margin: '1rem 0' }}>
                <span /><span /><span />
              </div>
            ) : recentGames.length === 0 ? (
              <p className="status status-muted">No games yet — find a match to get started!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="game-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opponent</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGames.map((game) => (
                      <tr key={game.id}>
                        <td>{formatDate(game.finished_at)}</td>
                        <td>{game.opponent}</td>
                        <td>
                          <span className={getBadgeClass(game.result)}>
                            {getResultText(game.result)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="menu">
              <Link to="/testing" className="btn btn-primary">Find a Match</Link>
              <button type="button" onClick={handleLogout} className="btn btn-danger">Logout</button>
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </section>
    </main>
  );
}

export default Dashboard;

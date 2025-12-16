import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/common/PrivateRoute';
import api from '../services/api';

const Library = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchLibrary();
    }
  }, [isAuthenticated]);

  const fetchLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/library');
      const payload = res?.data;

      const data =
        payload?.data?.games ||
        payload?.games ||
        (Array.isArray(payload) ? payload : []);

      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Library fetch error:', err);
      setError('Failed to load library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <Navbar />
      <main style={styles.container}>
        <h1 style={styles.title}>My Library</h1>
        
        {loading && (
          <div style={styles.message}>Loading your library...</div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {!loading && !error && games.length === 0 && (
          <div style={styles.message}>
            <p>Your library is empty.</p>
            <p style={styles.subMessage}>Games you purchase will appear here.</p>
            <button
              style={styles.browseButton}
              onClick={() => navigate('/browse')}
            >
              Browse Games
            </button>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div style={styles.gamesGrid}>
            {games.map((game) => (
              <div
                key={game.app_id}
                style={styles.gameCard}
                onClick={() => navigate(`/game/${game.app_id}`)}
              >
                <div style={styles.gameImage}>
                  <img
                    src={game.header_image || '/placeholder-game.jpg'}
                    alt={game.name}
                    style={styles.image}
                  />
                </div>
                <div style={styles.gameInfo}>
                  <h3 style={styles.gameName}>{game.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </PrivateRoute>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#1a1a1a',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  gameCard: {
    background: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  gameImage: {
    position: 'relative',
    width: '100%',
    paddingTop: '75%',
    background: '#f0f0f0',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  gameInfo: {
    padding: '12px',
  },
  gameName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  message: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
    fontSize: '1.1rem',
  },
  subMessage: {
    fontSize: '0.9rem',
    color: '#999',
    marginTop: '8px',
  },
  browseButton: {
    marginTop: '24px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  error: {
    textAlign: 'center',
    padding: '24px',
    color: '#dc2626',
    background: '#fee2e2',
    borderRadius: '8px',
    marginBottom: '24px',
  },
};

export default Library;


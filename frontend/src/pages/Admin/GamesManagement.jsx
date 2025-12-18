import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';
import api from '../../services/api';
import EditGameModal from './EditGameModal';

const GamesManagement = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const handleView = async (appId) => {
  try {
    const res = await api.get(`/admin/games/${appId}`);
    setSelectedGame(res.data.data);
    setShowEdit(true);
  } catch (err) {
    alert('Failed to load game detail');
  }
};


  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getAllGames();
        setGames(response.data?.games || []);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load games';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return 'Free';
    return `$${num.toFixed(2)}`;
  };

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Games Management</h1>
              <p style={styles.subtitle}>View and manage all games</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div style={styles.message}>Loading games...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : games.length === 0 ? (
            <div style={styles.message}>No games found.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>App ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Discount</th>
                    <th style={styles.th}>Final Price</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.app_id}>
                      <td style={styles.td}>#{game.app_id}</td>
                      <td style={styles.td}>{game.name || '—'}</td>
                      <td style={styles.td}>
                        {game.discount_percent > 0
                          ? formatPrice(game.price_final / (1 - game.discount_percent / 100))
                          : formatPrice(game.price_final)}
                      </td>
                      <td style={styles.td}>
                        {game.discount_percent > 0 ? (
                          <span style={styles.discountBadge}>
                            -{game.discount_percent}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={styles.td}>
                        <strong>{formatPrice(game.price_final)}</strong>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewButton}
                          onClick={() => handleView(game.app_id)}                
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
  
      {showEdit && selectedGame && (
        <EditGameModal
          game={selectedGame}
          onClose={() => setShowEdit(false)}
          onSave={async (appId, data) => {
            await adminService.updateGame(appId, data);
            setGames(prev =>
              prev.map(g => g.app_id === appId ? { ...g, ...data } : g)
            );
          }}
        />
      )}

    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fb',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#111827',
    fontSize: '14px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
  },
  discountBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#ef4444',
  },
  viewButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #3b82f6',
    background: '#fff',
    color: '#3b82f6',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '12px',
    transition: 'background 0.2s',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#6b7280',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#ef4444',
    background: '#fef2f2',
    borderRadius: '8px',
  },
};

export default GamesManagement;


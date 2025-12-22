import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { gameService } from '../services/gameService';
import { useWishlist } from '../context/WishlistContext';

const SearchGames = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query || query.trim() === '') {
      setGames([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await gameService.searchGames(query, {
        limit: 50,
        offset: 0
      });
      const gamesData = response.data?.games || response.games || [];
      setGames(gamesData);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search games. Please try again.');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      performSearch(searchQuery.trim());
    }
  };

  const isInWishlist = (appId) => {
    return wishlist.some(item => item.app_id === appId);
  };

  const toggleWishlist = (e, game) => {
    e.stopPropagation();
    if (isInWishlist(game.app_id)) {
      removeFromWishlist(game.app_id);
    } else {
      addToWishlist(game);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <main style={styles.container}>
        <div style={styles.searchSection}>
          <h1 style={styles.title}>Search Games</h1>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for games..."
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              🔍 Search
            </button>
          </form>
        </div>

        {loading && (
          <div style={styles.message}>Searching...</div>
        )}

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {!loading && !error && searchParams.get('q') && (
          <>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Search Results for "{searchParams.get('q')}"</h2>
              <span style={styles.count}>{games.length} {games.length === 1 ? 'game' : 'games'} found</span>
            </div>

            {games.length === 0 ? (
              <div style={styles.message}>No games found. Try a different search term.</div>
            ) : (
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
                        onError={(e) => {
                          e.target.src = '/placeholder-game.jpg';
                        }}
                      />
                      <button
                        style={styles.wishlistButton}
                        onClick={(e) => toggleWishlist(e, game)}
                        title={isInWishlist(game.app_id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {isInWishlist(game.app_id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div style={styles.gameInfo}>
                      <h3 style={styles.gameName}>{game.name}</h3>
                      <div style={styles.gamePrice}>
                        {game.discount_percent > 0 ? (
                          <>
                            <span style={styles.originalPrice}>
                              ${parseFloat(game.price_final / (1 - game.discount_percent / 100)).toFixed(2)}
                            </span>
                            <span style={styles.discount}>-{game.discount_percent}%</span>
                          </>
                        ) : null}
                        <span style={styles.finalPrice}>
                          {formatPrice(game.price_final)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && !searchParams.get('q') && (
          <div style={styles.message}>Enter a search term to find games</div>
        )}
      </main>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '100%',
    margin: 0,
    padding: '28px 64px 48px',
    fontFamily: "'Manrope', sans-serif",
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
  },
  searchSection: {
    marginBottom: '32px',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '1rem',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fff',
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #215122, #748772)',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 10px 18px rgba(33, 81, 34, 0.2)',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  resultsTitle: {
    margin: 0,
    fontSize: '1.3rem',
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  count: {
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '0.9rem',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  gameCard: {
    background: '#fff',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    boxShadow: '0 10px 22px rgba(33, 81, 34, 0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  gameImage: {
    position: 'relative',
    width: '100%',
    paddingTop: '75%',
    background: '#f7f4ef',
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
  wishlistButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(33, 81, 34, 0.15)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, transform 0.2s',
  },
  gameInfo: {
    padding: '12px',
  },
  gameName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1c231f',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  gamePrice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  originalPrice: {
    fontSize: '0.85rem',
    color: 'rgba(33, 81, 34, 0.5)',
    textDecoration: 'line-through',
  },
  discount: {
    fontSize: '0.85rem',
    background: '#e02e35',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '999px',
    fontWeight: '600',
  },
  finalPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#215122',
  },
  message: {
    textAlign: 'center',
    padding: '48px',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '1.1rem',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  error: {
    textAlign: 'center',
    padding: '24px',
    color: '#8b1d22',
    background: 'rgba(224, 46, 53, 0.12)',
    borderRadius: '12px',
    border: '1px solid rgba(224, 46, 53, 0.3)',
    marginBottom: '24px',
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default SearchGames;


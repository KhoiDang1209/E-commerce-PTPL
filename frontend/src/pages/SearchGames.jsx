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
              <h2>Search Results for "{searchParams.get('q')}"</h2>
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  searchSection: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a1a1a',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchInputFocus: {
    borderColor: '#3b82f6',
  },
  searchButton: {
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
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  count: {
    color: '#666',
    fontSize: '0.9rem',
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
  gameCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
  wishlistButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  gameInfo: {
    padding: '12px',
  },
  gameName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1a1a1a',
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
    color: '#999',
    textDecoration: 'line-through',
  },
  discount: {
    fontSize: '0.85rem',
    background: '#10b981',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  finalPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  message: {
    textAlign: 'center',
    padding: '48px',
    color: '#666',
    fontSize: '1.1rem',
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

export default SearchGames;


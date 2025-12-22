import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { gameService } from '../services/gameService';
import GameCarousel from '../components/GameCarousel';
import '../styles/Cart.css';

const Cart = () => {
  const { cart, loading, removeFromCart } = useCart();
  const navigate = useNavigate();

  const cartData = cart?.cart || cart || {};
  const items = cartData?.items || [];
  const [couponCode, setCouponCode] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState(new Set());
  const [hasUserSelection, setHasUserSelection] = useState(false);
  const [relatedGames, setRelatedGames] = useState([]);
  const [loadingRelatedGames, setLoadingRelatedGames] = useState(false);

  useEffect(() => {
    setSelectedAppIds((prev) => {
      const next = new Set();
      if (!hasUserSelection) {
        items.forEach((item) => next.add(item.app_id));
        return next;
      }
      items.forEach((item) => {
        if (prev.has(item.app_id)) {
          next.add(item.app_id);
        }
      });
      return next;
    });
  }, [items, hasUserSelection]);

  const handleRemove = async (appId) => {
    try {
      await removeFromCart(appId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Free';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const selectedItems = items.filter((item) => selectedAppIds.has(item.app_id));
  const selectedTotal = selectedItems.reduce((sum, item) => {
    const price = Number(item.price_final);
    return sum + (Number.isNaN(price) ? 0 : price);
  }, 0);
  const selectedCount = selectedItems.length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  // Fetch related games based on cart items
  useEffect(() => {
    if (!items || items.length === 0) {
      setRelatedGames([]);
      return;
    }

    let cancelled = false;

    const fetchRelatedGames = async () => {
      setLoadingRelatedGames(true);
      try {
        // Get the first cart item's app_id and fetch its details to get genres
        const firstItem = items[0];
        if (!firstItem?.app_id) {
          setRelatedGames([]);
          return;
        }

        // Fetch game details to get genres
        const gameRes = await gameService.getGameById(firstItem.app_id);
        const gameData = gameRes?.data?.game || gameRes?.game || gameRes?.data || gameRes;
        const genresData = gameData?.genres_json || gameData?.genres || [];
        
        let genreId = null;
        if (Array.isArray(genresData) && genresData.length > 0) {
          const firstGenre = genresData[0];
          genreId = typeof firstGenre === 'object' && firstGenre?.id ? firstGenre.id : null;
        }

        if (!genreId) {
          // Fallback: get recommended games if no genre available
          const recRes = await gameService.getRecommendedGames();
          const gamesList = recRes?.data?.games || recRes?.games || [];
          const cartAppIds = new Set(items.map((item) => item.app_id));
          const filtered = gamesList
            .filter((g) => g.app_id && !cartAppIds.has(g.app_id))
            .slice(0, 15);
          
          if (!cancelled) {
            setRelatedGames(filtered);
          }
          return;
        }

        // Fetch games by genre
        const res = await gameService.getGamesByGenre(genreId, {
          limit: 30,
          offset: 0,
          sortBy: 'recommendations_total',
          order: 'DESC',
        });

        const gamesList = res?.data?.games || res?.games || [];
        const cartAppIds = new Set(items.map((item) => item.app_id));
        
        // Filter out cart items and normalize results
        const filtered = gamesList
          .filter((g) => g.app_id && !cartAppIds.has(g.app_id))
          .slice(0, 15)
          .map((g) => ({
            ...g,
            app_id: g.app_id,
            name: g.name || g.title,
            header_image: g.header_image || g.image || g.thumbnail,
          }));

        if (!cancelled) {
          setRelatedGames(filtered);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching related games for cart:', err);
          setRelatedGames([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRelatedGames(false);
        }
      }
    };

    fetchRelatedGames();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <>
      <Navbar />
      <main className="cart-page">
        <div className="cart-shell">
          <div className="cart-header">
            <div>
              <h1 className="cart-title">Shopping Cart</h1>
              <p className="cart-subtitle">Curate your library before checkout.</p>
            </div>
            <button
              className="cart-accent"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              ←
            </button>
          </div>

          {loading ? (
            <div className="cart-message">Loading cart...</div>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-text">Your cart is empty</p>
              <button className="cart-browse" onClick={() => navigate('/')}>
                Browse Games
              </button>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                <div className="cart-selectall">
                  <label className="cart-checkbox">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        setHasUserSelection(true);
                        setSelectedAppIds(
                          e.target.checked
                            ? new Set(items.map((item) => item.app_id))
                            : new Set()
                        );
                      }}
                    />
                    <span>Select all</span>
                  </label>
                  <span className="cart-selectall-meta">
                    {selectedCount}/{items.length} selected
                  </span>
                </div>

                {items.map((item) => (
                  <div key={item.app_id} className="cart-item">
                    <label className="cart-item-check">
                      <input
                        type="checkbox"
                        checked={selectedAppIds.has(item.app_id)}
                        onChange={() => {
                          setHasUserSelection(true);
                          setSelectedAppIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.app_id)) {
                              next.delete(item.app_id);
                            } else {
                              next.add(item.app_id);
                            }
                            return next;
                          });
                        }}
                      />
                    </label>
                    <button
                      className="cart-thumb"
                      type="button"
                      onClick={() => navigate(`/game/${item.app_id}`)}
                    >
                      <img
                        src={item.header_image || '/placeholder-game.jpg'}
                        alt={item.name}
                        className="cart-thumb-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-game.jpg';
                        }}
                      />
                    </button>
                    <div className="cart-info">
                      <button
                        className="cart-name"
                        type="button"
                        onClick={() => navigate(`/game/${item.app_id}`)}
                      >
                        {item.name}
                      </button>
                      <div className="cart-price">
                        {item.discount_percent > 0 && (
                          <>
                            <span className="cart-price-original">
                              ${parseFloat(
                                item.price_org ||
                                  item.price_final / (1 - item.discount_percent / 100)
                              ).toFixed(2)}
                            </span>
                            <span className="cart-discount">-{item.discount_percent}%</span>
                          </>
                        )}
                        <span className="cart-price-final">
                          {formatPrice(item.price_final)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => handleRemove(item.app_id)}
                      title="Remove from cart"
                      type="button"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-summary-card">
                  <h2 className="cart-summary-title">Order Summary</h2>
                  <div className="cart-summary-row">
                    <span>Items ({selectedCount}/{items.length}):</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="cart-coupon">
                    <label className="cart-coupon-label">Coupon code</label>
                    <input
                      className="cart-coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon (optional)"
                    />
                  </div>

                  <div className="cart-divider"></div>
                  <div className="cart-total">
                    <span className="cart-total-label">Total:</span>
                    <span className="cart-total-price">{formatPrice(selectedTotal)}</span>
                  </div>
                  <button
                    className="cart-checkout"
                    disabled={selectedCount === 0}
                    onClick={() => {
                      navigate('/checkout', {
                        state: {
                          cart: { items: selectedItems, total_price: selectedTotal },
                          couponCode: couponCode.trim() || '',
                          selectedAppIds: selectedItems.map((item) => item.app_id),
                        },
                      });
                    }}
                  >
                    Proceed to Checkout
                  </button>
                  {items.length > 0 && selectedCount === 0 && (
                    <div className="cart-selection-note">
                      Select at least one game to checkout.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* You may also like section */}
          {relatedGames.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <GameCarousel
                games={relatedGames}
                title="You may also like"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Cart;

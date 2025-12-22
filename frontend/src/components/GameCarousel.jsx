import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './GameCarousel.css';

const GameCarousel = ({ games, title = 'You may also like', onToggleWishlist }) => {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const scrollByCards = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector('[data-carousel-card]');
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = 12; // gap between cards
    const scrollAmount = cardWidth + gap;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const wishlistIds = React.useMemo(() => {
    const set = new Set();
    const list = Array.isArray(wishlist) ? wishlist : [];
    list.forEach((w) => {
      const id = w.appId || w.app_id || w.id;
      if (id !== undefined && id !== null) {
        set.add(String(id));
        set.add(Number(id));
      }
    });
    return set;
  }, [wishlist]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    return '';
  };

  const extractPrices = (g) => {
    const originalRaw = g.original_price ?? g.price_org ?? g.price ?? g.list_price;
    const finalRaw = g.final_price ?? g.price_final ?? g.discount_price ?? g.price_after_discount ?? g.price;

    const apiPercent = Number(g.discount_percent) > 0 ? Number(g.discount_percent) : 0;
    const computedPercent =
      originalRaw && finalRaw && Number(originalRaw) > 0
        ? Math.round(((Number(originalRaw) - Number(finalRaw)) / Number(originalRaw)) * 100)
        : 0;
    const discountPercent = apiPercent || computedPercent || 0;

    const hasDiscount =
      discountPercent > 0 ||
      (finalRaw !== undefined && originalRaw !== undefined && Number(finalRaw) < Number(originalRaw));

    return {
      hasDiscount: Boolean(hasDiscount),
      discountPrice: hasDiscount ? formatPrice(finalRaw) : '',
      originalPrice: hasDiscount ? formatPrice(originalRaw) : formatPrice(originalRaw ?? finalRaw),
      base: formatPrice(finalRaw ?? originalRaw),
      discountPercent,
    };
  };

  const handleToggleWishlist = async (appId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (onToggleWishlist) {
      onToggleWishlist(appId);
    } else {
      // Fallback to direct wishlist context methods
      try {
        const itemInWishlist = wishlist?.some(item => item.app_id === appId || item.appId === appId);
        if (itemInWishlist) {
          await removeFromWishlist(appId);
        } else {
          await addToWishlist(appId);
        }
      } catch (err) {
        console.error('Error toggling wishlist:', err);
      }
    }
  };

  if (!games || games.length === 0) return null;

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>{title}</h2>
      <div style={styles.carouselWrapper}>
        <button
          style={{ ...styles.arrowButton, left: 0 }}
          onClick={() => scrollByCards('left')}
          aria-label="Scroll left"
        >
          ‹
        </button>
        <div ref={carouselRef} className="carousel-hide-scrollbar" style={styles.carousel}>
          {games.map((g) => {
          const appId = g.app_id || g.appId || g.id;
          const { discountPrice, originalPrice, hasDiscount, base } = extractPrices(g);
          const isInWishlist = wishlistIds.has(String(appId)) || wishlistIds.has(Number(appId));

          return (
            <Link key={appId} to={`/game/${appId}`} style={styles.cardLink} data-carousel-card>
              <div style={styles.card}>
                <div style={styles.cardImageWrap}>
                  {appId && (
                    <button
                      style={styles.heartButton}
                      aria-label="toggle wishlist"
                      onClick={(e) => handleToggleWishlist(appId, e)}
                    >
                      <span style={isInWishlist ? styles.heartIconActive : styles.heartIcon}>
                        ♥
                      </span>
                    </button>
                  )}
                  <img
                    src={g.header_image || g.image || g.thumbnail || '/placeholder-game.jpg'}
                    alt={g.name || g.title || 'Game'}
                    style={styles.cardImage}
                    onError={(e) => {
                      e.target.src = '/placeholder-game.jpg';
                    }}
                  />
                  {hasDiscount && discountPrice && (
                    <div style={styles.priceBadge}>{discountPrice}</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTitle}>{g.name || g.title || 'Untitled'}</div>
                  <div style={styles.cardPriceRow}>
                    <span style={styles.priceCurrent}>
                      {hasDiscount ? discountPrice : base || originalPrice || '—'}
                    </span>
                    {hasDiscount && originalPrice && (
                      <span style={styles.priceOriginal}>{originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
        <button
          style={{ ...styles.arrowButton, right: 0 }}
          onClick={() => scrollByCards('right')}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </section>
  );
};

const styles = {
  section: {
    marginTop: '32px',
    marginBottom: '32px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    fontFamily: "'Fraunces', serif",
  },
  carouselWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  carousel: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
    paddingLeft: '48px',
    paddingRight: '48px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    flex: 1,
  },
  arrowButton: {
    position: 'absolute',
    zIndex: 10,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#111827',
    fontWeight: 700,
    transition: 'all 0.2s ease',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    flex: '0 0 180px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(17,24,39,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    height: '100px',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  heartButton: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 3,
    boxShadow: '0 4px 8px rgba(17,24,39,0.1)',
  },
  heartIcon: {
    color: '#9ca3af',
    fontSize: '16px',
  },
  heartIconActive: {
    color: '#ef4444',
    fontSize: '16px',
  },
  priceBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#ef4444',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
  },
  cardBody: {
    padding: '10px',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#0f172a',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardPriceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  priceCurrent: {
    color: '#059669',
    fontWeight: 700,
    fontSize: '12px',
  },
  priceOriginal: {
    color: '#9ca3af',
    textDecoration: 'line-through',
    fontSize: '11px',
    fontWeight: 400,
  },
};

export default GameCarousel;

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();

  const normalized = useMemo(() => {
    return (wishlist || []).map((g, idx) => ({
      id: g.id || g.app_id || g.appId || idx,
      appId: g.app_id || g.appId || g.id,
      title: g.title || g.name || 'Untitled',
      image: g.image || g.header_image || g.thumbnail || '',
      price:
        g.final_price ||
        g.price_final ||
        g.discount_price ||
        g.price_after_discount ||
        g.price ||
        '',
      original: g.original_price || g.price_org || '',
    }));
  }, [wishlist]);

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (!Number.isNaN(num)) return `$${num.toFixed(2)}`;
    const str = String(val).trim();
    if (!str) return '';
    return str.startsWith('$') ? str : `$${str}`;
  };

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>Wishlist</h1>
        </div>
        {loading ? (
          <div style={styles.badge}>Loading...</div>
        ) : normalized.length === 0 ? (
          <div style={styles.badge}>Your wishlist is empty</div>
        ) : (
          <div style={styles.list}>
            {normalized.map((g) => (
              <div key={g.id} style={styles.card}>
                <div style={styles.imageContainer}>
                  <img src={g.image} alt={g.title} style={styles.image} />
                </div>
                <div style={styles.cardContent}>
                  <Link to={g.appId ? `/game/${g.appId}` : '#'} style={styles.cardLink}>
                    <div style={styles.cardTitle}>{g.title}</div>
                  </Link>
                  <div style={styles.priceRow}>
                    <span style={styles.priceCurrent}>{formatPrice(g.price) || 'N/A'}</span>
                    {g.original && formatPrice(g.original) !== formatPrice(g.price) && (
                      <span style={styles.priceOriginal}>{formatPrice(g.original)}</span>
                    )}
                  </div>
                </div>
                <button
                  style={styles.removeBtn}
                  onClick={() => removeFromWishlist(g.appId)}
                  aria-label="remove from wishlist"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Wishlist;

const styles = {
  page: {
    padding: '16px 22px',
    background: '#f8f9fb',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#0f172a',
  },
  badge: {
    color: '#6b7280',
    fontSize: '14px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '12px',
    gap: '16px',
  },
  imageContainer: {
    width: '120px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  removeBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    padding: '8px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
    flexShrink: 0,
    fontSize: '14px',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#0f172a',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  priceCurrent: {
    color: '#16a34a',
    fontWeight: 700,
  },
  priceOriginal: {
    color: '#9ca3af',
    textDecoration: 'line-through',
    fontSize: '13px',
  },
};

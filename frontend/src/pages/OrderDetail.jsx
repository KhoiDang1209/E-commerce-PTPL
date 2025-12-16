import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ordersService } from '../services/ordersService';
import { useAuth } from '../context/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await ordersService.getOrderById(id);
        const data = res?.data?.order || res?.order || null;
        setOrder(data);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load order';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={styles.container}>
          <div style={styles.card}>
            <div style={styles.message}>Loading order...</div>
          </div>
        </main>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>Order Details</h1>
            <div style={styles.error}>{error || 'Order not found'}</div>
            <button style={styles.primaryButton} onClick={() => navigate(isAdmin ? '/admin/orders' : '/orders')}>
              Back to Orders
            </button>
          </div>
        </main>
      </>
    );
  }

  const hasDiscount = Number(order.discount_order) > 0;
  const subtotal = hasDiscount
    ? Number(order.total_price) + Number(order.discount_order)
    : Number(order.total_price);

  const billing = order.billing_address;

  return (
    <>
      <Navbar />
      <main style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Order #{order.id}</h1>
              <div style={styles.meta}>
                <span>Status: {order.order_status}</span>
              </div>
            </div>
          </div>

          <div style={styles.grid}>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Items</h2>
              <div style={styles.itemsList}>
                {(order.items || []).map((item) => (
                  <div key={item.app_id} style={styles.itemRow}>
                    <div style={styles.itemLeft}>
                      <div style={styles.itemImageWrapper}>
                        <img
                          src={item.header_image || '/placeholder-game.jpg'}
                          alt={item.name}
                          style={styles.itemImage}
                          onError={(e) => {
                            e.target.src = '/placeholder-game.jpg';
                          }}
                        />
                      </div>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemName}>{item.name}</div>
                      </div>
                    </div>
                    <div style={styles.itemPrice}>
                      {formatPrice(item.unit_price_paid || item.price_final)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>User & Billing</h2>
              <div style={styles.userBlock}>
                <div style={styles.userTitle}>User</div>
                <div style={styles.userLine}>
                  <span>Username:</span>
                  <span>{order?.username || '—'}</span>
                </div>
                <div style={styles.userLine}>
                  <span>Email:</span>
                  <span>{order?.email || '—'}</span>
                </div>
              </div>

              <div style={styles.userBlock}>
                <div style={styles.userTitle}>Billing Address</div>
                {billing ? (
                  <>
                    <div style={styles.userLine}>
                      <span>Name:</span>
                      <span>{billing.full_name}</span>
                    </div>
                    <div style={styles.userLine}>
                      <span>Address:</span>
                      <span>{billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}</span>
                    </div>
                    <div style={styles.userLine}>
                      <span>City:</span>
                      <span>{billing.city}</span>
                    </div>
                    <div style={styles.userLine}>
                      <span>Country:</span>
                      <span>{billing.country}</span>
                    </div>
                  </>
                ) : (
                  <div style={styles.helper}>No billing address associated with this order.</div>
                )}
              </div>

              <div style={styles.userBlock}>
                <div style={styles.userTitle}>Summary</div>
                <div style={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {hasDiscount && (
                  <div style={styles.summaryRow}>
                    <span>Discount ({order.discount_code || 'coupon'})</span>
                    <span style={styles.discountAmount}>- {formatPrice(order.discount_order)}</span>
                  </div>
                )}
                <div style={styles.divider} />
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalValue}>{formatPrice(order.total_price)}</span>
                </div>
              </div>
            </section>
          </div>

          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={() => navigate(isAdmin ? '/admin/orders' : '/orders')}>
              Back to Orders
            </button>
            <button style={styles.secondaryButton} onClick={() => navigate(isAdmin ? '/admin' : '/')}>
              {isAdmin ? 'Back to Dashboard' : 'Back to Store'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    margin: 0,
  },
  meta: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: '16px',
  },
  section: {
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: '10px',
    color: '#0f172a',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  itemImageWrapper: {
    width: '72px',
    height: '54px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: '#f3f4f6',
    flexShrink: 0,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  itemName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#111827',
  },
  itemPrice: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#111827',
  },
  userBlock: {
    marginBottom: '14px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e5e7eb',
  },
  userTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    marginBottom: '6px',
  },
  userLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#374151',
    marginBottom: '4px',
  },
  helper: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#4b5563',
    marginBottom: '4px',
  },
  divider: {
    height: 1,
    background: '#e5e7eb',
    margin: '10px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  totalLabel: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  totalValue: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#111827',
  },
  discountAmount: {
    color: '#dc2626',
    fontWeight: 600,
  },
  actions: {
    marginTop: '18px',
    display: 'flex',
    gap: '10px',
  },
  primaryButton: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default OrderDetail;


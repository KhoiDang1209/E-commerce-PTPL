import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ordersService } from '../services/ordersService';
import { useAuth } from '../context/AuthContext';
import '../styles/OrderDetail.css';

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
        <main className="order-detail-page">
          <div className="order-detail-shell">
            <div className="order-detail-card">
              <div className="order-detail-message">Loading order...</div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="order-detail-page">
          <div className="order-detail-shell">
            <div className="order-detail-card">
              <h1 className="order-detail-title">Order Details</h1>
              <div className="order-detail-error">{error || 'Order not found'}</div>
              <div className="order-detail-actions">
                <button className="order-detail-primary-button" onClick={() => navigate(isAdmin ? '/admin/orders' : '/orders')}>
                  Back to Orders
                </button>
              </div>
            </div>
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
      <main className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-detail-card">
            <div className="order-detail-header">
              <div>
                <h1 className="order-detail-title">Order #{order.id}</h1>
                <div className="order-detail-meta">
                  Status: {order.order_status}
                </div>
              </div>
              <button
                className="order-detail-accent"
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

            <div className="order-detail-grid">
              <section className="order-detail-section">
                <h2 className="order-detail-section-title">Items</h2>
                <div className="order-detail-items-list">
                  {(order.items || []).map((item) => (
                    <div key={item.app_id} className="order-detail-item-row">
                      <div className="order-detail-item-left">
                        <div className="order-detail-item-image-wrapper">
                          <img
                            src={item.header_image || '/placeholder-game.jpg'}
                            alt={item.name}
                            className="order-detail-item-image"
                            onError={(e) => {
                              e.target.src = '/placeholder-game.jpg';
                            }}
                          />
                        </div>
                        <div className="order-detail-item-info">
                          <div className="order-detail-item-name">{item.name}</div>
                        </div>
                      </div>
                      <div className="order-detail-item-price">
                        {formatPrice(item.unit_price_paid || item.price_final)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="order-detail-section">
                <h2 className="order-detail-section-title">User & Billing</h2>
                <div className="order-detail-user-block">
                  <div className="order-detail-user-title">User</div>
                  <div className="order-detail-user-line">
                    <span>Username:</span>
                    <span>{order?.username || '—'}</span>
                  </div>
                  <div className="order-detail-user-line">
                    <span>Email:</span>
                    <span>{order?.email || '—'}</span>
                  </div>
                </div>

                <div className="order-detail-user-block">
                  <div className="order-detail-user-title">Billing Address</div>
                  {billing ? (
                    <>
                      <div className="order-detail-user-line">
                        <span>Name:</span>
                        <span>{billing.full_name}</span>
                      </div>
                      <div className="order-detail-user-line">
                        <span>Address:</span>
                        <span>{billing.line1}{billing.line2 ? `, ${billing.line2}` : ''}</span>
                      </div>
                      <div className="order-detail-user-line">
                        <span>City:</span>
                        <span>{billing.city}</span>
                      </div>
                      <div className="order-detail-user-line">
                        <span>Country:</span>
                        <span>{billing.country}</span>
                      </div>
                    </>
                  ) : (
                    <div className="order-detail-helper">No billing address associated with this order.</div>
                  )}
                </div>

                <div className="order-detail-user-block">
                  <div className="order-detail-user-title">Summary</div>
                  <div className="order-detail-summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="order-detail-summary-row">
                      <span>Discount ({order.discount_code || 'coupon'})</span>
                      <span className="order-detail-discount-amount">- {formatPrice(order.discount_order)}</span>
                    </div>
                  )}
                  <div className="order-detail-summary-divider" />
                  <div className="order-detail-total-row">
                    <span className="order-detail-total-label">Total</span>
                    <span className="order-detail-total-value">{formatPrice(order.total_price)}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="order-detail-actions">
              <button className="order-detail-primary-button" onClick={() => navigate(isAdmin ? '/admin/orders' : '/orders')}>
                Back to Orders
              </button>
              <button className="order-detail-secondary-button" onClick={() => navigate(isAdmin ? '/admin' : '/')}>
                {isAdmin ? 'Back to Dashboard' : 'Back to Store'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default OrderDetail;


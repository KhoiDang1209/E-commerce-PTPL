import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';
import { userService } from '../services/userService';
import { paymentService } from '../services/paymentService';
import '../styles/Checkout.css';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkout } = useCart();

  const cartSnapshot = location.state?.cart || {};
  const initialItems = cartSnapshot.items || [];
  const initialTotal = cartSnapshot.total_price || 0;
  const initialCoupon = location.state?.couponCode || '';
  const selectedAppIds = location.state?.selectedAppIds || [];

  const [items] = useState(initialItems);
  const [subtotal] = useState(initialTotal);
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [billingAddressId, setBillingAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  
  const couponValidationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!items.length) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Fetch billing addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const response = await userService.getBillingAddresses();
        const addresses = response.data?.addresses || response.addresses || [];
        setBillingAddresses(addresses);
      } catch (err) {
        console.error('Failed to load billing addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  // Validate coupon when code changes (debounced)
  useEffect(() => {
    if (couponValidationTimeoutRef.current) {
      clearTimeout(couponValidationTimeoutRef.current);
    }

    if (!couponCode.trim()) {
      setCouponDiscount(0);
      setCouponError('');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    couponValidationTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await cartService.validateCoupon(couponCode.trim(), subtotal);
        const validation = response.data || response;
        
        if (validation.valid) {
          setCouponDiscount(Number(validation.discount) || 0);
          setCouponError('');
        } else {
          setCouponDiscount(0);
          setCouponError(validation.message || 'Invalid coupon');
        }
      } catch (err) {
        setCouponDiscount(0);
        setCouponError('Failed to validate coupon');
      } finally {
        setValidatingCoupon(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (couponValidationTimeoutRef.current) {
        clearTimeout(couponValidationTimeoutRef.current);
      }
    };
  }, [couponCode, subtotal]);

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '$0.00';
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (!confirmChecked) {
      setMessage('Please confirm the order details.');
      return;
    }
    if (!paymentMethod) {
      setMessage('Please choose a payment method.');
      return;
    }

    try {
      setPlacing(true);
      setMessage('');

      // 1) Create order (pending)
      const appIdsForCheckout = selectedAppIds.length
        ? selectedAppIds
        : items.map((item) => item.app_id);
      const orderResponse = await checkout({
        couponCode: couponCode.trim() || null,
        billingAddressId: billingAddressId || null,
        appIds: appIdsForCheckout,
      });
      const createdOrder =
        orderResponse?.data?.order ||
        orderResponse?.order ||
        orderResponse;

      if (!createdOrder?.id) {
        throw new Error('Order not created');
      }

      setPlacedOrder(createdOrder);

      // 2) Create payment for the order
      const paymentResponse = await paymentService.createPayment({
        orderId: createdOrder.id,
        paymentMethod,
      });
      const payment =
        paymentResponse?.data?.payment ||
        paymentResponse?.payment ||
        paymentResponse;

      const paymentStatus = payment?.payment_status || 'initiated';
      setMessage(`Order placed. Payment ${paymentStatus}.`);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to place order';
      setMessage(msg);
    } finally {
      setPlacing(false);
    }
  };

  const orderForDisplay = placedOrder || null;
  // Use real-time discount if order not placed yet, otherwise use order discount
  const currentDiscount = orderForDisplay 
    ? Number(orderForDisplay.discount_order) || 0
    : couponDiscount;
  const hasDiscount = currentDiscount > 0;
  const subtotalDisplay = Number(subtotal);
  const totalPrice = subtotalDisplay - currentDiscount;

  return (
    <>
      <Navbar />
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-card">
            <div className="checkout-header">
              <div>
                <h1 className="checkout-title">Checkout</h1>
                {orderForDisplay && (
                  <p className="checkout-order-id">Order #{orderForDisplay.id} — {orderForDisplay.order_status}</p>
                )}
              </div>
              <button
                className="checkout-accent"
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

            <div className="checkout-grid">
              <section className="checkout-section">
                <h2 className="checkout-section-title">Order Items</h2>
                <div className="checkout-items-list">
                  {(orderForDisplay?.items || items).map((item) => (
                    <div key={item.app_id} className="checkout-item-row">
                      <div className="checkout-item-left">
                        <div className="checkout-item-image-wrapper">
                          <img
                            src={item.header_image || '/placeholder-game.jpg'}
                            alt={item.name}
                            className="checkout-item-image"
                            onError={(e) => {
                              e.target.src = '/placeholder-game.jpg';
                            }}
                          />
                        </div>
                        <div className="checkout-item-info">
                          <div className="checkout-item-name">{item.name}</div>
                        </div>
                      </div>
                      <div className="checkout-item-price">
                        {formatPrice(item.price_final || item.unit_price_paid)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="checkout-section">
                <h2 className="checkout-section-title">Details</h2>

                <div className="checkout-field-group">
                  <label className="checkout-label">Coupon</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon (optional)"
                    className={`checkout-input ${couponError ? 'error' : ''}`}
                  />
                  {validatingCoupon && (
                    <div className="checkout-helper">Validating...</div>
                  )}
                  {couponError && (
                    <div className="checkout-helper error">{couponError}</div>
                  )}
                  {hasDiscount && !couponError && !validatingCoupon && (
                    <div className="checkout-helper success">
                      Coupon applied! Discount: {formatPrice(couponDiscount)}
                    </div>
                  )}
                </div>

                <div className="checkout-field-group">
                  <label className="checkout-label">Billing Address</label>
                  {loadingAddresses ? (
                    <div className="checkout-helper">Loading addresses...</div>
                  ) : billingAddresses.length > 0 ? (
                    <select
                      value={billingAddressId}
                      onChange={(e) => setBillingAddressId(e.target.value)}
                      className="checkout-input"
                    >
                      <option value="">Select billing address (optional)</option>
                      {billingAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.full_name} - {addr.line1}, {addr.city}, {addr.country}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <div className="checkout-helper">No saved addresses. You can add one in your profile.</div>
                      <input
                        type="text"
                        value={billingAddressId}
                        onChange={(e) => setBillingAddressId(e.target.value)}
                        placeholder="Billing address ID (optional)"
                        className="checkout-input"
                      />
                    </>
                  )}
                </div>

                <div className="checkout-field-group">
                  <label className="checkout-label">Payment Method</label>
                  <div className="checkout-radio-row">
                    <label className="checkout-radio-label">
                      <input
                        type="radio"
                        name="payment"
                        value="visa"
                        checked={paymentMethod === 'visa'}
                        onChange={() => setPaymentMethod('visa')}
                      />
                      <span>Visa</span>
                    </label>
                    <label className="checkout-radio-label">
                      <input
                        type="radio"
                        name="payment"
                        value="qr"
                        checked={paymentMethod === 'qr'}
                        onChange={() => setPaymentMethod('qr')}
                      />
                      <span>QR Code</span>
                    </label>
                  </div>
                </div>

                <div className="checkout-field-group">
                  <label className="checkout-label">Order Summary</label>
                  <div className="checkout-summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotalDisplay)}</span>
                  </div>
                  {hasDiscount && (
                    <div className="checkout-summary-row">
                      <span>Discount ({orderForDisplay?.discount_code || couponCode || 'coupon'})</span>
                      <span className="checkout-discount-amount">- {formatPrice(currentDiscount)}</span>
                    </div>
                  )}
                  <div className="checkout-summary-divider" />
                  <div className="checkout-total-row">
                    <span className="checkout-total-label">Total</span>
                    <span className="checkout-total-value">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="checkout-field-group">
                  <label className="checkout-checkbox-label">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                    />
                    <span>I confirm my order details are correct.</span>
                  </label>
                </div>

                <button
                  className="checkout-primary-button"
                  disabled={placing || !items.length}
                  onClick={handlePlaceOrder}
                >
                  {placing ? 'Placing order...' : 'Place Order'}
                </button>

                {message && (
                  <div
                    className={`checkout-message ${
                      message.toLowerCase().includes('fail') ||
                      message.toLowerCase().includes('error') ||
                      message.toLowerCase().includes('invalid') ||
                      message.toLowerCase().includes('empty')
                        ? 'error'
                        : 'success'
                    }`}
                  >
                    {message}
                  </div>
                )}
              </section>
            </div>

            {orderForDisplay && (
              <div className="checkout-actions">
                <button
                  className="checkout-primary-button"
                  onClick={() => navigate('/orders')}
                >
                  View Orders
                </button>
                <button
                  className="checkout-secondary-button"
                  onClick={() => navigate('/')}
                >
                  Back to Store
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Checkout;

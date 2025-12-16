import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';

const PendingPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getPendingPayments();
        setPayments(response.data?.payments || []);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load pending payments';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      setUpdating({ ...updating, [paymentId]: true });
      await adminService.updatePaymentStatus(paymentId, newStatus);
      
      // Refresh payments list
      const response = await adminService.getPendingPayments();
      setPayments(response.data?.payments || []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to update payment status';
      alert(msg);
    } finally {
      setUpdating({ ...updating, [paymentId]: false });
    }
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const paymentStatusOptions = [
    { value: 'authorized', label: 'Authorized', color: '#10b981' },
    { value: 'captured', label: 'Captured', color: '#10b981' },
    { value: 'failed', label: 'Failed', color: '#ef4444' },
    { value: 'canceled', label: 'Canceled', color: '#ef4444' },
    { value: 'refunded', label: 'Refunded', color: '#8b5cf6' },
  ];

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Pending Payments</h1>
              <p style={styles.subtitle}>Manage payment status for initiated payments</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div style={styles.message}>Loading pending payments...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : payments.length === 0 ? (
            <div style={styles.message}>No pending payments found.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Payment ID</th>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Payment Method</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Order Status</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td style={styles.td}>#{payment.id}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.linkButton}
                          onClick={() => navigate(`/orders/${payment.order_id}`)}
                        >
                          #{payment.order_id}
                        </button>
                      </td>
                      <td style={styles.td}>{payment.user_username || '—'}</td>
                      <td style={styles.td}>{payment.user_email || '—'}</td>
                      <td style={styles.td}>{payment.payment_name || '—'}</td>
                      <td style={styles.td}>{formatPrice(payment.payment_price)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              payment.order_status === 'paid'
                                ? '#10b981'
                                : payment.order_status === 'canceled'
                                ? '#ef4444'
                                : '#f59e0b',
                          }}
                        >
                          {payment.order_status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(payment.payment_created).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={payment.payment_status}
                          onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                          disabled={updating[payment.id]}
                        >
                          <option value="initiated">Initiated</option>
                          {paymentStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {updating[payment.id] && (
                          <span style={styles.updating}>Updating...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
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
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    fontSize: '12px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  linkButton: {
    padding: 0,
    border: 'none',
    background: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
  updating: {
    fontSize: '11px',
    color: '#6b7280',
    marginLeft: '8px',
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

export default PendingPayments;


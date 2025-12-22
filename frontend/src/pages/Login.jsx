import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ identifier: email, password });
      const role = res?.data?.user?.role || res?.user?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setError(apiError || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>
            Email or Username
            <input
              style={styles.input}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="you@example.com or yourusername"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="********"
            />
          </label>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>New here?</span>{' '}
          <Link to="/register" style={styles.link}>
            Create an account
          </Link>
        </div>
        <div style={styles.sideAccent} aria-hidden="true" />
      </div>
    </main>
  );
};

export default Login;

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    padding: '32px 16px 48px',
    color: '#1f2937',
    fontFamily: "'Manrope', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    border: '1px solid rgba(33, 81, 34, 0.14)',
    borderRadius: '18px',
    padding: '28px',
    boxShadow: '0 24px 50px rgba(33, 81, 34, 0.18)',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    marginBottom: '18px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
    color: '#324035',
  },
  input: {
    height: '44px',
    borderRadius: '10px',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    background: '#ffffff',
    color: '#1c231f',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'none',
  },
  button: {
    height: '46px',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, #215122, #748772)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    boxShadow: '0 12px 22px rgba(33, 81, 34, 0.25)',
  },
  error: {
    background: 'rgba(224, 46, 53, 0.12)',
    color: '#8b1d22',
    border: '1px solid rgba(224, 46, 53, 0.3)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
  },
  footer: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#324035',
  },
  link: {
    color: '#215122',
    textDecoration: 'none',
    fontWeight: 600,
  },
  sideAccent: {
    position: 'absolute',
    right: '-40px',
    top: '20%',
    width: '120px',
    height: '120px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, rgba(33, 81, 34, 0.2), rgba(224, 46, 53, 0.18))',
    transform: 'rotate(12deg)',
    pointerEvents: 'none',
  },
};

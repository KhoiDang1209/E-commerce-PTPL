import React, { useEffect, useState } from 'react';
import api from '../../services/api';
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  background: '#fff',
  padding: '24px',
  borderRadius: '12px',
  width: '700px',
  maxHeight: '85vh',
  overflowY: 'auto',
};

const sectionStyle = {
  marginBottom: '16px',
};

const EditGameModal = ({ game, onClose, onSave }) => {
  const [allGenres, setAllGenres] = useState([]);

  const [form, setForm] = useState({
    name: '',
    price_final: '',
    discount_percent: '',
    release_date: '',
    platforms: [],
    header_image: '',
    background: '',
    description: '',
    genres: [],
  });

  /* =========================
     Load game detail vào form
     ========================= */
  useEffect(() => {
    if (!game) return;

    setForm({
      name: game.name || '',
      price_final: game.price_final || '',
      discount_percent: game.discount_percent || 0,
      release_date: game.release_date
        ? game.release_date.slice(0, 10)
        : '',
      platforms: [
        game.platforms_windows && 'windows',
        game.platforms_mac && 'mac',
        game.platforms_linux && 'linux',
      ].filter(Boolean),
      header_image: game.header_image || '',
      background: game.background || '',
      description: game.detailed_description || '',
      genres: Array.isArray(game.genres)
        ? game.genres.map(g => g.id)
        : [],
    });
  }, [game]);


  /* =========================
     Load all genres
     ========================= */
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/reference/genres');
        const genres = res.data?.data?.genres || [];
        setAllGenres(genres);
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
  }, []);

  /* =========================
     Handlers
     ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePlatform = (platform) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleGenre = (genreId) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  /* =========================
     Submit update
     ========================= */
  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      price_final: Number(form.price_final),
      discount_percent: Number(form.discount_percent),
      release_date: form.release_date || null,

      platforms_windows: form.platforms.includes('windows'),
      platforms_mac: form.platforms.includes('mac'),
      platforms_linux: form.platforms.includes('linux'),

      description: {
        detailed_description: form.description,
        header_image: form.header_image,
        background: form.background,
      },

      genres: form.genres,
    };

    try {
      await onSave(game.app_id, payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update game');
    }
  };

  /* =========================
     Render
     ========================= */
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Edit Game #{game.app_id}</h2>

        {/* Basic Info */}
        <div style={sectionStyle}>
          <label>Game Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        <div style={sectionStyle}>
          <label>Price</label>
          <input
            type="number"
            name="price_final"
            value={form.price_final}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        <div style={sectionStyle}>
          <label>Discount (%)</label>
          <input
            type="number"
            name="discount_percent"
            value={form.discount_percent}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        <div style={sectionStyle}>
          <label>Release Date</label>
          <input
            type="date"
            name="release_date"
            value={form.release_date}
            onChange={handleChange}
          />
        </div>

        {/* Platforms */}
        <div style={sectionStyle}>
          <label>Platforms</label>
          <div>
            {['windows', 'mac', 'linux'].map(p => (
              <label key={p} style={{ marginRight: 12 }}>
                <input
                  type="checkbox"
                  checked={form.platforms.includes(p)}
                  onChange={() => togglePlatform(p)}
                />{' '}
                {p}
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <label>Header Image URL</label>
          <input
            name="header_image"
            value={form.header_image}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        <div style={sectionStyle}>
          <label>Background Image URL</label>
          <input
            name="background"
            value={form.background}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        {/* Genres */}
        <div style={sectionStyle}>
          <label>Genres</label>
          <div>
            {allGenres.map(g => (
              <label key={g.id} style={{ display: 'inline-block', marginRight: 12 }}>
                <input
                  type="checkbox"
                  checked={form.genres.includes(g.id)}
                  onChange={() => toggleGenre(g.id)}
                />{' '}
                {g.name}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditGameModal;

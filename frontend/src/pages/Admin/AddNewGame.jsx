import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';

const AddNewGame = () => {
  const [form, setForm] = useState({
    name: '',
    price_final: '',
    discount_percent: 0,
    release_date: '',
    platforms: [],
    publishers: '',
    developers: '',
    categories: '',
    genres: '',
    languages: '',
    description: '',
    header_image: '',
    background: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        platforms: checked
          ? [...prev.platforms, value]
          : prev.platforms.filter((p) => p !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      price_final: Number(form.price_final),
      price_org: Number(form.price_final),
      discount_percent: Number(form.discount_percent),
      release_date: form.release_date || null,

      platforms_windows: form.platforms.includes('windows'),
      platforms_mac: form.platforms.includes('mac'),
      platforms_linux: form.platforms.includes('linux'),

      publishers: form.publishers.split(',').map(s => Number(s.trim())),
      developers: form.developers.split(',').map(s => Number(s.trim())),
      categories: form.categories.split(',').map(s => Number(s.trim())),
      genres: form.genres.split(',').map(s => Number(s.trim())),
      languages: form.languages.split(',').map(s => Number(s.trim())),

      description: {
        detailed_description: form.description,
        header_image: form.header_image,
        background: form.background,
      },
    };

    try {
      await api.post('/admin/games', payload);
      alert('Game created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create game');
    }
  };

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1>Add New Game</h1>

          <input name="name" placeholder="Game name" onChange={handleChange} required />

          <input
            name="price_final"
            type="number"
            placeholder="Price"
            onChange={handleChange}
            required
          />

          <input
            name="discount_percent"
            type="number"
            placeholder="Discount %"
            onChange={handleChange}
          />

          <input
            name="release_date"
            type="date"
            onChange={handleChange}
          />

          {/* Platforms */}
          <div style={styles.checkboxGroup}>
            <label><input type="checkbox" value="windows" onChange={handleChange} /> Windows</label>
            <label><input type="checkbox" value="mac" onChange={handleChange} /> Mac</label>
            <label><input type="checkbox" value="linux" onChange={handleChange} /> Linux</label>
          </div>

          {/* IDs */}
          <input name="publishers" placeholder="Publisher IDs (1,2)" onChange={handleChange} />
          <input name="developers" placeholder="Developer IDs (1,2)" onChange={handleChange} />
          <input name="categories" placeholder="Category IDs (1,2)" onChange={handleChange} />
          <input name="genres" placeholder="Genre IDs (1,2)" onChange={handleChange} />
          <input name="languages" placeholder="Language IDs (1,2)" onChange={handleChange} />

          {/* Images */}
          <input
            name="header_image"
            placeholder="Header image URL"
            onChange={handleChange}
          />

          <input
            name="background"
            placeholder="Background image URL"
            onChange={handleChange}
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Detailed description"
            rows={4}
            onChange={handleChange}
          />

          <button type="submit">Create Game</button>
        </form>
      </main>
    </>
  );
};

export default AddNewGame;

const styles = {
  page: {
    padding: '24px',
    background: '#f8f9fb',
    minHeight: '100vh',
  },
  card: {
    background: '#fff',
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRadius: '12px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '12px',
  },
};

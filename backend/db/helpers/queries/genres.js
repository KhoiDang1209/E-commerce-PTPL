// backend/db/helpers/queries/genres.js
const { query, queryOne } = require('../queryUtils');

/**
 * Genre queries
 */

const genresQueries = {
  /**
   * Get all genres
   * @returns {Promise<Array>} Array of genres
   */
  getAllGenres: async () => {
    const queryText = 'SELECT * FROM genres ORDER BY name';
    return await query(queryText);
  },

  /**
   * Get genre by ID
   * @param {number} genreId - Genre ID
   * @returns {Promise<Object|null>} Genre object or null
   */
  getGenreById: async (genreId) => {
    const queryText = 'SELECT * FROM genres WHERE id = $1';
    return await queryOne(queryText, [genreId]);
  },

  /**
   * Get genre by name
   * @param {string} name - Genre name
   * @returns {Promise<Object|null>} Genre object or null
   */
  getGenreByName: async (name) => {
    const queryText = 'SELECT * FROM genres WHERE name = $1';
    return await queryOne(queryText, [name]);
  },

  /**
   * Create genre
   * @param {string} name - Genre name
   * @returns {Promise<Object>} Created genre
   */
  createGenre: async (name) => {
    const queryText = `
      INSERT INTO genres (name)
      VALUES ($1)
      RETURNING *
    `;
    return await queryOne(queryText, [name]);
  },

  /**
   * Get genres for a game
   * @param {number} appId - Game app_id
   * @returns {Promise<Array>} Array of genres
   */
  getGenresByGame: async (appId) => {
    const queryText = `
      SELECT g.*
      FROM genres g
      INNER JOIN game_genres gg ON g.id = gg.genre_id
      WHERE gg.app_id = $1
      ORDER BY g.name
    `;
    return await query(queryText, [appId]);
  },
};

module.exports = genresQueries;


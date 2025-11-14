// backend/db/helpers/queries/categories.js
const { query, queryOne, buildOrderClause } = require('../queryUtils');

/**
 * Category queries
 */

const categoriesQueries = {
  /**
   * Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  getAllCategories: async () => {
    const queryText = 'SELECT * FROM categories ORDER BY name';
    return await query(queryText);
  },

  /**
   * Get category by ID
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object|null>} Category object or null
   */
  getCategoryById: async (categoryId) => {
    const queryText = 'SELECT * FROM categories WHERE id = $1';
    return await queryOne(queryText, [categoryId]);
  },

  /**
   * Get category by name
   * @param {string} name - Category name
   * @returns {Promise<Object|null>} Category object or null
   */
  getCategoryByName: async (name) => {
    const queryText = 'SELECT * FROM categories WHERE name = $1';
    return await queryOne(queryText, [name]);
  },

  /**
   * Create category
   * @param {string} name - Category name
   * @returns {Promise<Object>} Created category
   */
  createCategory: async (name) => {
    const queryText = `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING *
    `;
    return await queryOne(queryText, [name]);
  },

  /**
   * Get categories for a game
   * @param {number} appId - Game app_id
   * @returns {Promise<Array>} Array of categories
   */
  getCategoriesByGame: async (appId) => {
    const queryText = `
      SELECT c.*
      FROM categories c
      INNER JOIN game_categories gc ON c.id = gc.category_id
      WHERE gc.app_id = $1
      ORDER BY c.name
    `;
    return await query(queryText, [appId]);
  },
};

module.exports = categoriesQueries;


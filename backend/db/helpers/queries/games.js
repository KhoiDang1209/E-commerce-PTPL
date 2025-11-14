// backend/db/helpers/queries/games.js
const { query, queryOne, buildWhereClause, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Game queries
 */

const gamesQueries = {
  /**
   * Get all games
   * @param {Object} options - Query options (limit, offset, sortBy, order)
   * @returns {Promise<Array>} Array of games
   */
  getAllGames: async (options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);
    
    const queryText = `
      SELECT * FROM games
      ${orderClause}
      ${paginationClause}
    `.trim();
    
    return await query(queryText);
  },

  /**
   * Get game by app_id
   * @param {number} appId - Game app_id
   * @returns {Promise<Object|null>} Game object or null
   */
  getGameById: async (appId) => {
    const queryText = 'SELECT * FROM games WHERE app_id = $1';
    return await queryOne(queryText, [appId]);
  },

  /**
   * Get game with full details (game, description, specs)
   * @param {number} appId - Game app_id
   * @returns {Promise<Object|null>} Game with full details or null
   */
  getGameWithDetails: async (appId) => {
    const queryText = `
      SELECT 
        g.*,
        gd.detailed_description,
        gd.supported_languages,
        gd.website,
        gd.header_image,
        gd.background,
        gd.categories,
        gd.genres,
        gs.pc_min_os,
        gs.pc_min_processor,
        gs.pc_min_memory,
        gs.pc_min_graphics,
        gs.pc_min_directx,
        gs.pc_min_network,
        gs.pc_min_storage,
        gs.pc_rec_os,
        gs.pc_rec_processor,
        gs.pc_rec_memory,
        gs.pc_rec_graphics,
        gs.pc_rec_directx,
        gs.pc_rec_network,
        gs.pc_rec_storage
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN game_specs gs ON g.app_id = gs.app_id
      WHERE g.app_id = $1
    `;
    return await queryOne(queryText, [appId]);
  },

  /**
   * Get games by filters (platform, price range, etc.)
   * @param {Object} filters - Filter object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByFilter: async (filters = {}, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const paramValues = [];
    const conditions = [];
    let paramIndex = 1;

    // Platform filters
    if (filters.platform === 'windows') {
      conditions.push(`platforms_windows = true`);
    } else if (filters.platform === 'mac') {
      conditions.push(`platforms_mac = true`);
    } else if (filters.platform === 'linux') {
      conditions.push(`platforms_linux = true`);
    }

    // Price range
    if (filters.minPrice !== undefined) {
      conditions.push(`price_final >= $${paramIndex}`);
      paramValues.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`price_final <= $${paramIndex}`);
      paramValues.push(filters.maxPrice);
      paramIndex++;
    }

    // Discount filter
    if (filters.hasDiscount !== undefined && filters.hasDiscount) {
      conditions.push(`discount_percent > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT * FROM games
      ${whereClause}
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, paramValues);
  },

  /**
   * Search games by name
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  searchGames: async (searchTerm, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT * FROM games
      WHERE name ILIKE $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [`%${searchTerm}%`]);
  },

  /**
   * Get games by genre
   * @param {number} genreId - Genre ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByGenre: async (genreId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*
      FROM games g
      INNER JOIN game_genres gg ON g.app_id = gg.app_id
      WHERE gg.genre_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [genreId]);
  },

  /**
   * Get games by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByCategory: async (categoryId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*
      FROM games g
      INNER JOIN game_categories gc ON g.app_id = gc.app_id
      WHERE gc.category_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [categoryId]);
  },

  /**
   * Get games by developer
   * @param {number} developerId - Developer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByDeveloper: async (developerId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*
      FROM games g
      INNER JOIN game_developers gd ON g.app_id = gd.app_id
      WHERE gd.developer_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [developerId]);
  },

  /**
   * Get games by publisher
   * @param {number} publisherId - Publisher ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByPublisher: async (publisherId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*
      FROM games g
      INNER JOIN game_publishers gp ON g.app_id = gp.app_id
      WHERE gp.publisher_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [publisherId]);
  },

  /**
   * Get discounted games
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of discounted games
   */
  getDiscountedGames: async (options = {}) => {
    const { limit, offset, sortBy = 'discount_percent', order = 'DESC' } = options;
    const orderClause = buildOrderClause(sortBy, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT * FROM games
      WHERE discount_percent > 0
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText);
  },
};

module.exports = gamesQueries;


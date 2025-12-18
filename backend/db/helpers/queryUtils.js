// backend/db/helpers/queryUtils.js
const { client } = require('../index');

/**
 * Base query utility functions
 */

/**
 * Execute a query and return rows
 * @param {string} queryText - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (queryText, params = []) => {
  try {
    const result = await client.query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Execute a query and return single row
 * @param {string} queryText - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
const queryOne = async (queryText, params = []) => {
  try {
    const result = await client.query(queryText, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Execute a query and return row count
 * @param {string} queryText - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<number>} Row count
 */
const queryCount = async (queryText, params = []) => {
  try {
    const result = await client.query(queryText, params);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback that receives client
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  }
};

/**
 * Build WHERE clause from filters object
 * @param {Object} filters - Filter object
 * @param {Array} paramValues - Array to push parameter values
 * @param {number} startIndex - Starting parameter index
 * @returns {string} WHERE clause
 */
const buildWhereClause = (filters, paramValues = [], startIndex = 1) => {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const conditions = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        conditions.push(`${key} = ANY($${paramIndex})`);
        paramValues.push(value);
        paramIndex++;
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        paramValues.push(value);
        paramIndex++;
      }
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

/**
 * Build ORDER BY clause
 * @param {string} sortBy - Column to sort by
 * @param {string} order - ASC or DESC
 * @returns {string} ORDER BY clause
 */
const buildOrderClause = (sortBy, order = 'ASC') => {
  if (!sortBy) return '';
  const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `ORDER BY ${sortBy} ${validOrder}`;
};

/**
 * Build LIMIT and OFFSET clause for pagination
 * @param {number} limit - Number of rows to return
 * @param {number} offset - Number of rows to skip
 * @returns {string} LIMIT/OFFSET clause
 */
const buildPaginationClause = (limit, offset = 0) => {
  if (!limit) return '';
  return `LIMIT ${limit} OFFSET ${offset}`;
};

module.exports = {
  client,
  query,
  queryOne,
  queryCount,
  transaction,
  buildWhereClause,
  buildOrderClause,
  buildPaginationClause,
};


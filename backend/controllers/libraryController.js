// backend/controllers/libraryController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

const getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, sortBy = 'added_at', order = 'DESC' } = req.query;

    const games = await queries.library.getUserLibrary(userId, {
      limit: Number(limit),
      offset: Number(offset),
      sortBy,
      order: String(order || 'DESC').toUpperCase(),
    });

    return sendSuccess(
      res,
      {
        games,
        count: Array.isArray(games) ? games.length : 0,
        limit: Number(limit),
        offset: Number(offset),
      },
      'Library retrieved successfully'
    );
  } catch (err) {
    console.error('Get library error:', err);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getLibrary,
};



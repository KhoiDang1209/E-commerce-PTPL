// backend/middleware/requireAdmin.js

const { sendError } = require('../utils/response');

/**
 * Middleware để kiểm tra và chỉ cho phép người dùng có vai trò 'admin' truy cập.
 * Handles session-based authentication and checks for admin role.
 */
const requireAdmin = async (req, res, next) => {
  try {
    let user = req.user || req.session.user;
    
    // If no user in current session but we have X-Session-ID header, try to load that session
    if (!user && req.headers['x-session-id']) {
      try {
        const sessionStore = req.sessionStore;
        const sessionData = await new Promise((resolve, reject) => {
          sessionStore.get(req.headers['x-session-id'], (err, session) => {
            if (err) reject(err);
            else resolve(session);
          });
        });
        
        if (sessionData && sessionData.user) {
          user = sessionData.user;
          // Update current session with the user data
          req.session.user = user;
          req.user = user;
        }
      } catch (error) {
        // Session not found or expired
      }
    }

    // 1. Kiểm tra xem người dùng đã đăng nhập chưa
    if (!user) {
      return sendError(res, 'Authentication required to access this resource', 'UNAUTHENTICATED', 401);
    }

    // 2. Kiểm tra vai trò (role) của người dùng
    // Vai trò được định nghĩa trong ENUM user_role: 'user' hoặc 'admin'
    if (user.role !== 'admin') {
      return sendError(res, 'Access denied: Insufficient privileges (Admin role required)', 'ACCESS_DENIED', 403);
    }

    // 3. Nếu là admin, cho phép tiếp tục
    next();
  } catch (error) {
    console.error('requireAdmin middleware error:', error);
    return sendError(res, 'Authentication error', 'AUTH_ERROR', 500);
  }
};

module.exports = requireAdmin;
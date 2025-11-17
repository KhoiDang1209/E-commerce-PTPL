// backend/models/UserModel.js
const db = require('../db'); // Nhập module db/index.js
// const bcrypt = require('bcrypt'); // Cần thư viện này để so sánh mật khẩu băm

// Tương ứng với UserModel -> Database trong Sequence Diagram
exports.checkUserCredentials = async (username, password) => {
    // Trong thực tế, bạn sẽ dùng hàm băm (hashing) như bcrypt
    
    try {
        // 1. Lấy thông tin người dùng từ DB (bao gồm mật khẩu băm)
        // Lưu ý: users.js của bạn trong helpers/queries cần có hàm getUserByUsername
        const result = await db.query('SELECT user_id, username, password_hash FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return null; // Người dùng không tồn tại
        }

        // 2. So sánh mật khẩu
        // const match = await bcrypt.compare(password, user.password_hash);
        
        // DÙNG GIẢ LẬP VÌ CHƯA CÓ BCRYPT/HASHING
        const match = (password === "123456"); // Giả sử mật khẩu là "123456"

        if (match) {
            // Tương ứng với việc cập nhật last_login
            // await db.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]); 
            return { user_id: user.user_id, username: user.username };
        }

        return null;
        
    } catch (error) {
        console.error("Invalid user's infomation:", error);
        throw error;
    }
};
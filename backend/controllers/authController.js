// backend/controllers/authController.js

const UserModel = require('../models/UserModel');

// Tương ứng với phần Controller trong Sequence Diagram
exports.login = async (req, res) => {
    // 1. Nhận input từ GUI
    const { username, password } = req.body; 

    if (!username || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên người dùng và mật khẩu." });
    }

    try {
        // 2. Gọi Model để kiểm tra
        const user = await UserModel.checkUserCredentials(username, password);

        if (!user) {
            // Authentication Failed
            return res.status(401).json({ message: "Tên người dùng hoặc mật khẩu không hợp lệ." });
        }

        // Authentication Success (Trong thực tế, tạo JWT ở đây)
        return res.status(200).json({ 
            message: "Login Successfully.",
            user: user
        });
        
    } catch (error) {
        console.error(" Controller Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};
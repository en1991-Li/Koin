require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const port = process.env.PORT || 3000;

// 啟用 CORS 與 JSON 解析，讓前端可以順利發送請求過來
app.use(cors());
app.use(express.json());

// 建立 MySQL 資料庫連線池 (Pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 測試資料庫連線
pool.getConnection()
    .then(() => console.log('✅ MySQL 資料庫連線成功！'))
    .catch((err) => console.error('❌ 資料庫連線失敗：', err));


// ==========================================
// API 路由設計
// ==========================================

// [1] 讀取所有帳目紀錄 (GET /api/records)
app.get('/api/records', async (req, res) => {
    try {
        // 依據日期與時間由新到舊排序
        const [rows] = await pool.query('SELECT * FROM records ORDER BY record_date DESC, record_time DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('讀取記錄錯誤:', error);
        res.status(500).json({ success: false, message: '讀取資料失敗' });
    }
});

// [2] 新增單筆帳目紀錄 (POST /api/records)
app.post('/api/records', async (req, res) => {
    // 這些變數對應前端準備發送過來的 JSON 資料
    const { type, name, amount, accountName, projectName, date, time, note } = req.body;

    // 基本防呆檢查
    if (!name || amount === undefined) {
        return res.status(400).json({ success: false, message: '缺少必填欄位 (name, amount)' });
    }

    try {
        // 使用 Prepared Statement (?) 防範 SQL Injection
        const sql = `
            INSERT INTO records 
            (type, name, amount, account_name, project_name, record_date, record_time, note) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [type, name, amount, accountName, projectName, date, time, note];
        
        const [result] = await pool.query(sql, values);
        
        res.status(201).json({ 
            success: true, 
            message: '記錄新增成功', 
            insertId: result.insertId 
        });
    } catch (error) {
        console.error('新增記錄錯誤:', error);
        res.status(500).json({ success: false, message: '資料庫寫入失敗' });
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`🚀 Koin 後端伺服器已啟動於 http://localhost:${port}`);
});

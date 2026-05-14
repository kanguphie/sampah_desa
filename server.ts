
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// Safe path resolution for both ESM and CJS
const getPaths = () => {
  try {
    if (typeof __filename !== 'undefined') {
      return { filename: __filename, dirname: __dirname };
    }
    if (typeof import.meta !== 'undefined' && typeof import.meta.url === 'string') {
      const filename = fileURLToPath(import.meta.url);
      return { filename, dirname: path.dirname(filename) };
    }
  } catch (e) {
    console.warn("Path resolution error:", e);
  }
  return { 
    filename: '', 
    dirname: process.cwd() 
  };
};

const { filename: _filename, dirname: _dirname } = getPaths();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Database Connection Pool
  let pool: mysql.Pool | null = null;

  const getDB = async () => {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sapadesa',
            port: parseInt(process.env.DB_PORT || '3306'),
            timezone: '+07:00', // Set to WIB (UTC+7)
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
  };

  // --- DATABASE INITIALIZATION ---
  const initializeDatabase = async () => {
    try {
      const db = await getDB();
      const queries = [
        `CREATE TABLE IF NOT EXISTS village_config (
            id INT PRIMARY KEY, 
            name VARCHAR(255), 
            district VARCHAR(255),
            regency VARCHAR(255),
            address TEXT, 
            phone VARCHAR(50),
            email VARCHAR(255),
            logo_url TEXT, 
            lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS dukuhs (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS rts (id INT AUTO_INCREMENT PRIMARY KEY, number VARCHAR(10), dukuhId INT)`,
        `CREATE TABLE IF NOT EXISTS wargas (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), address TEXT, dukuhId INT, rtId INT, phone VARCHAR(20), dailyFee INT, totalDebt INT DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS petugases (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS admins (id VARCHAR(50) PRIMARY KEY, username VARCHAR(255), name VARCHAR(255), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(50) PRIMARY KEY, wargaId VARCHAR(50), petugasId VARCHAR(50), amount INT, status VARCHAR(20), category VARCHAR(50), timestamp DATETIME)`,
        `CREATE TABLE IF NOT EXISTS pengeluarans (id VARCHAR(50) PRIMARY KEY, description TEXT, amount INT, date DATE, category VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS contact_messages (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), subject VARCHAR(255), message TEXT, timestamp DATETIME, isRead BOOLEAN DEFAULT FALSE)`,
        `CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(50) PRIMARY KEY, title VARCHAR(255), content TEXT, date DATETIME, isActive BOOLEAN DEFAULT TRUE)`,
        `CREATE TABLE IF NOT EXISTS schedules (day VARCHAR(20) PRIMARY KEY, dukuhIds JSON)`
      ];
      for (const q of queries) { await db.execute(q); }
      // Ensure village_config has all columns (Migration for existing databases)
      const [vCols]: any = await db.execute('DESCRIBE village_config');
      const existingVCols = vCols.map((c: any) => c.Field);
      const neededVCols = ['district', 'regency', 'phone', 'email'];
      for (const col of neededVCols) {
        if (!existingVCols.includes(col)) {
            await db.execute(`ALTER TABLE village_config ADD COLUMN ${col} VARCHAR(255)`);
        }
      }

      // Migration for admins table to add username
      const [aCols]: any = await db.execute('DESCRIBE admins');
      const existingACols = aCols.map((c: any) => c.Field);
      if (!existingACols.includes('username')) {
          await db.execute(`ALTER TABLE admins ADD COLUMN username VARCHAR(255)`);
      }
      
      console.log("Database Schema Verified.");
    } catch (err) {
      console.error("DB Init Error:", err);
    }
  };

  // Request Logger
  app.use((req, res, next) => {
    if (!req.url.includes('health')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Enhanced Admin Login with First-Run Fallback
  app.post('/api/login/admin', async (req, res) => {
    try {
        const { pin } = req.body;
        const db = await getDB();
        const [admins]: any = await db.execute('SELECT * FROM admins');
        
        // JIKA KOSONG (First Run): Ijinkan PIN 123456
        if (admins.length === 0 && pin === '123456') {
            return res.json({ id: 'admin-master', username: 'admin', name: 'Master Admin (First Run)', role: 'admin' });
        }
        
        // JIKA ADA DATA: Gunakan PIN dari Database
        const [rows]: any = await db.execute('SELECT * FROM admins WHERE pin = ? LIMIT 1', [pin]);
        if (rows.length > 0) {
            res.json({ ...rows[0], role: 'admin' });
        } else {
            res.status(401).json({ message: 'PIN Admin salah atau database belum terisi' });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  // Healthcheck for Docker
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Example API Route (Login)
  app.post('/api/login/petugas', async (req, res) => {
    try {
        const { pin } = req.body;
        const db = await getDB();
        const [rows]: any = await db.execute('SELECT * FROM petugases WHERE pin = ? LIMIT 1', [pin]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(401).json({ message: 'PIN salah' });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  // --- DASHBOARD STATS ROUTES ---
  app.get('/api/stats/transparency/:year', async (req, res) => {
    try {
        const { year } = req.params;
        const db = await getDB();
        console.log(`[API] Fetching transparency report for year: ${year}`);
        
        const [revenue]: any = await db.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "paid" AND YEAR(timestamp) = ?', [year]);
        const [expense]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans WHERE YEAR(date) = ?', [year]);
        
        const totalRevenue = revenue[0].total || 0;
        const totalExpense = expense[0].total || 0;
        
        const [dukuhList]: any = await db.execute('SELECT * FROM dukuhs');
        const dukuhStats = [];
        for (const dukuh of dukuhList) {
            const [sum]: any = await db.execute(`
                SELECT SUM(t.amount) as total 
                FROM transactions t 
                JOIN wargas w ON t.wargaId = w.id 
                WHERE w.dukuhId = ? AND t.status = 'paid' AND YEAR(t.timestamp) = ?
            `, [dukuh.id, year]);
            dukuhStats.push({ name: dukuh.name, total: sum[0].total || 0 });
        }

        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const monthlyStats = [];
        for (let i = 1; i <= 12; i++) {
            const [inc]: any = await db.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "paid" AND YEAR(timestamp) = ? AND MONTH(timestamp) = ?', [year, i]);
            const [exp]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans WHERE YEAR(date) = ? AND MONTH(date) = ?', [year, i]);
            const income = inc[0].total || 0;
            const expenseVal = exp[0].total || 0;
            monthlyStats.push({
                monthName: months[i-1],
                income,
                expense: expenseVal,
                balance: income - expenseVal
            });
        }

        res.json({
            totalRevenue,
            totalExpense,
            balance: totalRevenue - totalExpense,
            dukuhStats,
            monthlyStats
        });
    } catch (err: any) { 
        console.error(`[API Error] Transparency ${req.params.year}:`, err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  app.get('/api/stats/admin', async (req, res) => {
    try {
        const db = await getDB();
        const [wargaCount]: any = await db.execute('SELECT COUNT(*) as total FROM wargas');
        const [totalRevenue]: any = await db.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "paid"');
        const [totalDebt]: any = await db.execute('SELECT SUM(totalDebt) as total FROM wargas');
        const [totalExpense]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans');
        
        const balance = (totalRevenue[0].total || 0) - (totalExpense[0].total || 0);

        res.json({
            totalWarga: wargaCount[0].total,
            totalRevenue: totalRevenue[0].total || 0,
            totalDebt: totalDebt[0].total || 0,
            balance: balance
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stats/public', async (req, res) => {
    try {
        const db = await getDB();
        const [wargaCount]: any = await db.execute('SELECT COUNT(*) as total FROM wargas');
        const [summary]: any = await db.execute(`
            SELECT 
                (SELECT SUM(amount) FROM transactions WHERE status = 'paid') as totalMasuk,
                (SELECT COUNT(*) FROM transactions WHERE status = 'paid' AND MONTH(timestamp) = MONTH(CURRENT_DATE())) as transBulanIni,
                (SELECT SUM(amount) FROM transactions WHERE status = 'paid' AND MONTH(timestamp) = MONTH(CURRENT_DATE())) as danaBulanIni
        `);
        
        res.json({
            totalWarga: wargaCount[0].total,
            totalTransaksiBulanIni: summary[0].transBulanIni || 0,
            totalDanaTerkumpulBulanIni: summary[0].danaBulanIni || 0,
            totalMasuk: summary[0].totalMasuk || 0
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  // --- FRIENDLY ROUTES (Mapping to tables) ---
  
  app.get('/api/village-profile', async (req, res) => {
    try {
        const db = await getDB();
        const [rows]: any = await db.execute('SELECT * FROM village_config LIMIT 1');
        res.json(rows[0] || {});
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/village-profile', async (req, res) => {
    try {
        const db = await getDB();
        const data = req.body;
        const [colsInfo]: any = await db.execute(`DESCRIBE village_config`);
        const validCols = colsInfo.map((c: any) => c.Field);
        const filteredRow: any = {};
        validCols.forEach((col: string) => { if (data[col] !== undefined) filteredRow[col] = data[col]; });
        if (Object.keys(filteredRow).length === 0) return res.json({ success: true });
        const columns = Object.keys(filteredRow).map(c => `\`${c}\``).join(', ');
        const placeholders = Object.keys(filteredRow).map(() => '?').join(', ');
        const values = Object.values(filteredRow);
        await db.execute(`REPLACE INTO village_config (id, ${columns}) VALUES (1, ${placeholders})`, [1, ...values]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/pay-debt', async (req, res) => {
    try {
        const { wargaId, petugasId, amount } = req.body;
        const db = await getDB();
        const id = `tr-${Date.now()}`;
        await db.execute('INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", "tunggakan", NOW())', [id, wargaId, petugasId, amount]);
        await db.execute('UPDATE wargas SET totalDebt = totalDebt - ? WHERE id = ?', [amount, wargaId]);
        res.json({ success: true, id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/convert-debt/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];
        const [warga]: any = await db.execute('SELECT * FROM wargas WHERE id = ?', [wargaId]);
        if (warga.length === 0) throw new Error('Warga not found');
        const amount = warga[0].dailyFee;
        const id = `tr-debt-${Date.now()}`;
        await db.execute('INSERT INTO transactions (id, wargaId, status, amount, category, timestamp) VALUES (?, ?, "unpaid", ?, "harian", NOW())', [id, wargaId, amount]);
        await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [amount, wargaId]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/check-payment/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];
        const [rows]: any = await db.execute('SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? AND status = "paid" LIMIT 1', [wargaId, today]);
        res.json({ paid: rows.length > 0 });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/transactions/today/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];
        const [rows]: any = await db.execute('SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? LIMIT 1', [wargaId, today]);
        res.json(rows[0] || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/transactions/warga/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM transactions WHERE wargaId = ? ORDER BY timestamp DESC', [wargaId]);
        res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/reports', async (req, res) => {
    try {
        const { startDate, endDate, dukuhId, status } = req.body;
        const db = await getDB();
        // Use LEFT JOIN to ensure we don't lose transactions if warga data is missing
        let query = 'SELECT t.*, w.name as wargaName FROM transactions t LEFT JOIN wargas w ON t.wargaId = w.id WHERE 1=1';
        const params = [];
        if (startDate) { query += ' AND t.timestamp >= ?'; params.push(startDate); }
        if (endDate) { query += ' AND t.timestamp <= ?'; params.push(endDate); }
        if (dukuhId) { query += ' AND w.dukuhId = ?'; params.push(dukuhId); }
        if (status) { query += ' AND t.status = ?'; params.push(status); }
        query += ' ORDER BY t.timestamp DESC';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/unpaid-today', async (req, res) => {
    try {
        const db = await getDB();
        const today = new Date().toISOString().split('T')[0];
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[new Date().getDay()];
        const [schedule]: any = await db.execute('SELECT * FROM schedules WHERE day = ?', [dayName]);
        const dukuhIds = schedule.length > 0 ? schedule[0].dukuhIds : [];
        if (!Array.isArray(dukuhIds) || dukuhIds.length === 0) return res.json([]);
        const placeholders = dukuhIds.map(() => '?').join(',');
        const [wargas]: any = await db.execute(`
            SELECT w.* FROM wargas w 
            WHERE w.dukuhId IN (${placeholders})
            AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.wargaId = w.id AND DATE(t.timestamp) = ?)
        `, [...dukuhIds, today]);
        res.json(wargas);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/announcements', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM announcements ORDER BY date DESC');
        res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/announcements/active', async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM announcements WHERE isActive = TRUE ORDER BY date DESC');
        res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/schedule', async (req, res) => {
    try {
        const db = await getDB();
        const [rows]: any = await db.execute('SELECT * FROM schedules');
        // Transform array to object { [day]: dukuhIds }
        const scheduleObj: any = {};
        rows.forEach((row: any) => {
            scheduleObj[row.day] = row.dukuhIds;
        });
        res.json(scheduleObj);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/schedule', async (req, res) => {
    try {
        const { day, dukuhIds } = req.body;
        const db = await getDB();
        // Use REPLACE for upsert on PRIMARY KEY 'day'
        const dukuhIdsVal = Array.isArray(dukuhIds) || dukuhIds === 'libur' ? JSON.stringify(dukuhIds) : '[]';
        await db.execute('REPLACE INTO schedules (day, dukuhIds) VALUES (?, ?)', [day, dukuhIdsVal]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/schedule/today', async (req, res) => {
    try {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];
        const db = await getDB();
        const [rows]: any = await db.execute('SELECT * FROM schedules WHERE day = ?', [today]);
        res.json(rows[0] || { day: today, dukuhIds: [] });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post(['/api/announcements', '/api/announcement'], async (req, res) => {
    try {
        const db = await getDB();
        const { title, content, isActive, date } = req.body;
        const id = `ann-${Date.now()}`;
        await db.execute('INSERT INTO announcements (id, title, content, isActive, date) VALUES (?, ?, ?, ?, ?)', [id, title, content, isActive || true, date || new Date()]);
        res.json({ success: true, id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put(['/api/announcements/:id', '/api/announcement/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const db = await getDB();
        const sets = Object.keys(data).map(c => `\`${c}\` = ?`).join(', ');
        const vals = [...Object.values(data), id];
        await db.execute(`UPDATE announcements SET ${sets} WHERE id = ?`, vals);
        res.json({ success: true, id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete(['/api/announcements/:id', '/api/announcement/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post(['/api/messages', '/api/message'], async (req, res) => {
    try {
        const db = await getDB();
        const { name, phone, contact, subject, message } = req.body;
        const id = `msg-${Date.now()}`;
        const contactVal = contact || phone;
        await db.execute('INSERT INTO contact_messages (id, name, phone, subject, message, timestamp) VALUES (?, ?, ?, ?, ?, NOW())', [id, name, contactVal, subject || 'Pesan Baru', message]);
        res.json({ success: true, id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get(['/api/messages', '/api/message'], async (req, res) => {
    try {
        const db = await getDB();
        const [rows] = await db.execute('SELECT * FROM contact_messages ORDER BY timestamp DESC');
        res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post(['/api/messages/:id/read', '/api/message/:id/read'], async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('UPDATE contact_messages SET isRead = TRUE WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete(['/api/messages/:id', '/api/message/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post(['/api/pengeluaran', '/api/pengeluarans'], async (req, res) => {
    try {
        const db = await getDB();
        const data = req.body;
        
        // Distinguish between Filter (get-like) and Create
        if (data.startDate || data.category || (data.description === undefined && data.amount === undefined)) {
            // It's a filter request
            let query = 'SELECT * FROM pengeluarans WHERE 1=1';
            const params = [];
            if (data.startDate) { query += ' AND date >= ?'; params.push(data.startDate); }
            if (data.endDate) { query += ' AND date <= ?'; params.push(data.endDate); }
            if (data.category) { query += ' AND category = ?'; params.push(data.category); }
            query += ' ORDER BY date DESC';
            const [rows] = await db.execute(query, params);
            return res.json(rows);
        }

        // It's a create request
        const { description, amount, date, category } = data;
        const id = `exp-${Date.now()}`;
        await db.execute('INSERT INTO pengeluarans (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)', [id, description, amount, date, category]);
        res.json({ id, description, amount, date, category });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put(['/api/pengeluaran/:id', '/api/pengeluarans/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const db = await getDB();
        const sets = Object.keys(data).map(c => `\`${c}\` = ?`).join(', ');
        const vals = [...Object.values(data), id];
        await db.execute(`UPDATE pengeluarans SET ${sets} WHERE id = ?`, vals);
        res.json({ id, ...data });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete(['/api/pengeluaran/:id', '/api/pengeluarans/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('DELETE FROM pengeluarans WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/profile/admin', async (req, res) => {
    try {
        const { id, name, pin } = req.body;
        const db = await getDB();
        const queries = [];
        const params = [];
        
        if (name) { queries.push('name = ?'); params.push(name); }
        if (pin) { queries.push('pin = ?'); params.push(pin); }
        
        if (queries.length > 0) {
            params.push(id);
            await db.execute(`UPDATE admins SET ${queries.join(', ')} WHERE id = ?`, params);
        }
        
        const [rows]: any = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
        res.json({ ...rows[0], role: 'admin' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/profile/petugas', async (req, res) => {
    try {
        const { id, name, phone, pin } = req.body;
        const db = await getDB();
        const queries = [];
        const params = [];
        
        if (name) { queries.push('name = ?'); params.push(name); }
        if (phone) { queries.push('phone = ?'); params.push(phone); }
        if (pin) { queries.push('pin = ?'); params.push(pin); }
        
        if (queries.length > 0) {
            params.push(id);
            await db.execute(`UPDATE petugases SET ${queries.join(', ')} WHERE id = ?`, params);
        }
        
        const [rows]: any = await db.execute('SELECT * FROM petugases WHERE id = ?', [id]);
        res.json({ ...rows[0], role: 'petugas' });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/backup', async (req, res) => {
    try {
        const db = await getDB();
        const tables = [
            'village_config', 'dukuhs', 'rts', 'wargas', 
            'petugases', 'admins', 'schedules',
            'transactions', 'pengeluarans', 'contact_messages', 'announcements'
        ];
        const backup: any = {};
        for (const table of tables) {
            const [rows] = await db.execute(`SELECT * FROM \`${table}\``);
            backup[table] = rows;
        }
        res.json(backup);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.get('/api/data/:table', async (req, res) => {
     try {
         const { table } = req.params;
         const db = await getDB();
         const [rows] = await db.execute(`SELECT * FROM \`${table}\``);
         res.json(rows);
     } catch (err: any) {
         res.status(500).json({ error: err.message });
     }
  });

  app.get('/api/data/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const db = await getDB();
        const [rows]: any = await db.execute(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
        res.json(rows[0] || null);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data/:table/bulk', async (req, res) => {
    try {
        const { table } = req.params;
        const items = req.body;
        const db = await getDB();
        
        if (!Array.isArray(items) || items.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const cols = Object.keys(items[0]).map(c => `\`${c}\``).join(', ');
        const q = Object.keys(items[0]).map(() => '?').join(', ');
        
        for (const item of items) {
            const vals = Object.values(item);
            await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${q})`, vals);
        }
        
        res.json({ success: true, count: items.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const data = req.body;
        const db = await getDB();
        
        const cols = Object.keys(data).map(c => `\`${c}\``).join(', ');
        const q = Object.keys(data).map(() => '?').join(', ');
        const vals = Object.values(data);
        
        const [result]: any = await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${q})`, vals);
        res.json({ id: result.insertId, ...data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/data/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = req.body;
        const db = await getDB();
        
        const sets = Object.keys(data).map(c => `\`${c}\` = ?`).join(', ');
        const vals = [...Object.values(data), id];
        
        await db.execute(`UPDATE \`${table}\` SET ${sets} WHERE id = ?`, vals);
        res.json({ id, ...data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/data/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const db = await getDB();
        await db.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/restore', async (req, res) => {
    try {
        const data = req.body;
        const db = await getDB();
        const results = { success: [], errors: [] };
        
        const tables = [
            'village_config', 'dukuhs', 'rts', 'wargas', 
            'petugases', 'admins', 'schedules',
            'transactions', 'pengeluarans', 'contact_messages', 'announcements'
        ];

        for (const table of tables) {
            const base = table.endsWith('s') ? table.slice(0, -1) : table;
            const possibleNames = [table, base, `${base}s`, `${table}s`].filter((v, i, a) => a.indexOf(v) === i);
            
            let foundData = null;
            for (const name of possibleNames) {
                if (data[name] && Array.isArray(data[name])) {
                    foundData = data[name];
                    break;
                }
            }

            if (foundData && foundData.length > 0) {
                try {
                    const [colsInfo]: any = await db.execute(`DESCRIBE \`${table}\``);
                    const validCols = colsInfo.map((c: any) => c.Field);
                    
                    for (const row of foundData) {
                        const filteredRow: any = {};
                        
                        // Fuzzy field mapping for common Supabase -> MySQL naming differences
                        const fuzzyMap: any = {
                            'full_name': 'name',
                            'username': 'name',
                            'village_name': 'name', // village_config
                            'district_name': 'district', // village_config
                            'regency_name': 'regency', // village_config
                            'email_address': 'email', // village_config
                            'phone_number': 'phone', // village_config
                            'created_at': table === 'pengeluarans' ? 'date' : 'timestamp',
                            'updated_at': null, // ignore
                            'is_active': 'isActive',
                            'rt_id': 'rtId',
                            'dukuh_id': 'dukuhId',
                            'dukuh_ids': 'dukuhIds', // Added for schedules
                            'daily_fee': 'dailyFee',
                            'total_debt': 'totalDebt',
                            'warga_id': 'wargaId',
                            'petugas_id': 'petugasId'
                        };

                        // First, try direct matches or fuzzy matches from the row
                        validCols.forEach((col: string) => {
                            // Direct match
                            if (row[col] !== undefined) {
                                filteredRow[col] = row[col];
                            } else {
                                // Check if any row key maps to this column
                                Object.keys(row).forEach(rowKey => {
                                    if (fuzzyMap[rowKey] === col) {
                                        filteredRow[col] = row[rowKey];
                                    }
                                });
                            }

                            // Handle special types for MySQL (Object/Array -> JSON String)
                            // IMPORTANT: Check if it's already a string that looks like JSON to avoid double stringification
                            if (filteredRow[col] !== undefined && typeof filteredRow[col] === 'object' && filteredRow[col] !== null) {
                                filteredRow[col] = JSON.stringify(filteredRow[col]);
                            } else if (filteredRow[col] !== undefined && typeof filteredRow[col] === 'string') {
                                // If column is explicitly JSON but we got a string, it might be valid as is
                                // or it might need parsing then stringifying to normalize.
                                // For MySQL JSON columns, a string "[1,2]" is fine.
                            }
                        });

                        if (Object.keys(filteredRow).length > 0) {
                            const columns = Object.keys(filteredRow).map(c => `\`${c}\``).join(', ');
                            const placeholders = Object.keys(filteredRow).map(() => '?').join(', ');
                            const values = Object.values(filteredRow);
                            await db.execute(`REPLACE INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
                        }
                    }
                    (results.success as string[]).push(table);
                } catch (e: any) {
                    console.error(`Restore error for table ${table}:`, e);
                    (results.errors as any[]).push({ table, error: e.message });
                }
            }
        }
        res.json(results);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  // 404 handler for API routes
  app.all('/api/*all', (req, res) => {
    console.warn(`[404] API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: 'API route not found', 
        path: req.originalUrl,
        method: req.method
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Correct SPA fallback for Express 5
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    try {
      await initializeDatabase();
      console.log(`Server SapaDesa running on http://localhost:${PORT}`);
      console.log(`Timezone forced to WIB (UTC+7)`);
    } catch (e) {
      console.error("Critical Startup Error:", e);
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error] ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });
}

startServer();

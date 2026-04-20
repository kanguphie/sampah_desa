
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        `CREATE TABLE IF NOT EXISTS village_config (id INT PRIMARY KEY, name VARCHAR(255), code VARCHAR(50), address TEXT, logo_url TEXT, lastUpdated DATETIME)`,
        `CREATE TABLE IF NOT EXISTS dukuhs (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS rts (id INT AUTO_INCREMENT PRIMARY KEY, number VARCHAR(10), dukuhId INT)`,
        `CREATE TABLE IF NOT EXISTS wargas (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), address TEXT, dukuhId INT, rtId INT, phone VARCHAR(20), dailyFee INT, totalDebt INT DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS petugases (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS admins (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(50) PRIMARY KEY, wargaId VARCHAR(50), petugasId VARCHAR(50), amount INT, status VARCHAR(20), category VARCHAR(50), timestamp DATETIME)`,
        `CREATE TABLE IF NOT EXISTS pengeluarans (id VARCHAR(50) PRIMARY KEY, description TEXT, amount INT, date DATE, category VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS contact_messages (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), subject VARCHAR(255), message TEXT, timestamp DATETIME, isRead BOOLEAN DEFAULT FALSE)`,
        `CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(50) PRIMARY KEY, title VARCHAR(255), content TEXT, date DATETIME, isActive BOOLEAN DEFAULT TRUE)`,
        `CREATE TABLE IF NOT EXISTS schedules (day VARCHAR(20) PRIMARY KEY, dukuhIds JSON)`
      ];
      for (const q of queries) { await db.execute(q); }
      console.log("Database Schema Verified.");
    } catch (err) {
      console.error("DB Init Error:", err);
    }
  };

  // --- API ROUTES ---

  // Enhanced Admin Login with First-Run Fallback
  app.post('/api/login/admin', async (req, res) => {
    try {
        const { pin } = req.body;
        const db = await getDB();
        const [admins]: any = await db.execute('SELECT * FROM admins');
        
        // JIKA KOSONG (First Run): Ijinkan PIN 123456
        if (admins.length === 0 && pin === '123456') {
            return res.json({ id: 'admin-master', name: 'Master Admin (First Run)', role: 'admin' });
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

  app.get('/api/stats/admin', async (req, res) => {
    try {
        const db = await getDB();
        const [wargaCount]: any = await db.execute('SELECT COUNT(*) as total FROM wargas');
        const [totalSaldo]: any = await db.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "paid"');
        const [unpaidCount]: any = await db.execute('SELECT COUNT(*) as total FROM wargas WHERE totalDebt > 0');
        const [recentTransactions]: any = await db.execute('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 5');
        
        res.json({
            wargaCount: wargaCount[0].total,
            totalSaldo: totalSaldo[0].total || 0,
            unpaidCount: unpaidCount[0].total,
            recentTransactions: recentTransactions || []
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stats/public', async (req, res) => {
    try {
        const db = await getDB();
        const [summary]: any = await db.execute(`
            SELECT 
                (SELECT SUM(amount) FROM transactions WHERE status = 'paid') as totalMasuk,
                (SELECT SUM(amount) FROM pengeluarans) as totalKeluar
        `);
        const [announcements]: any = await db.execute('SELECT * FROM announcements WHERE isActive = TRUE ORDER BY date DESC LIMIT 3');
        
        res.json({
            totalMasuk: summary[0].totalMasuk || 0,
            totalKeluar: summary[0].totalKeluar || 0,
            announcements: announcements || []
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  // Proxy-like routes for Supabase tables to local MySQL
  // (In a real migration, we would implement all crud here)
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
            if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
                try {
                    // Get actual table columns to avoid "column not found" errors
                    const [colsInfo]: any = await db.execute(`DESCRIBE \`${table}\``);
                    const validCols = colsInfo.map((c: any) => c.Field);
                    
                    for (const row of data[table]) {
                        // Filter out keys that don't exist in our local table
                        const filteredRow: any = {};
                        validCols.forEach((col: string) => {
                            if (row[col] !== undefined) {
                                filteredRow[col] = row[col];
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
                    console.error(`Restore error for ${table}:`, e);
                    (results.errors as any[]).push({ table, error: e.message });
                }
            }
        }
        res.json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    await initializeDatabase();
    console.log(`Server SapaDesa running on http://localhost:${PORT}`);
    console.log(`Timezone forced to WIB (UTC+7)`);
  });
}

startServer();

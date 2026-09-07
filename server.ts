
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

const getWIBDateString = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (3600000 * 7));
  const year = wib.getFullYear();
  const month = String(wib.getMonth() + 1).padStart(2, '0');
  const day = String(wib.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWIBDateTimeString = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wib = new Date(utc + (3600000 * 7));
  const year = wib.getFullYear();
  const month = String(wib.getMonth() + 1).padStart(2, '0');
  const day = String(wib.getDate()).padStart(2, '0');
  const hours = String(wib.getHours()).padStart(2, '0');
  const minutes = String(wib.getMinutes()).padStart(2, '0');
  const seconds = String(wib.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
            dateStrings: true,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
  };

  // Helper to ensure all required wargas columns exist in MySQL (self-healing migration)
  async function ensureWargasColumns(db: any): Promise<Set<string>> {
    try {
      const [cols]: any = await db.execute('DESCRIBE wargas');
      const existing = new Set<string>(
        cols.map((c: any) => String(c.Field || c.field || c.COLUMN_NAME || '').toLowerCase())
      );

      if (!existing.has('billingtype')) {
        try {
          await db.execute("ALTER TABLE wargas ADD COLUMN billingType VARCHAR(20) DEFAULT 'HARIAN'");
          existing.add('billingtype');
          console.log("[MIGRATION] Added billingType column to wargas table");
        } catch (e: any) {
          console.warn("[MIGRATION] billingType ALTER warning:", e.message);
        }
      }
      if (!existing.has('monthlyfee')) {
        try {
          await db.execute("ALTER TABLE wargas ADD COLUMN monthlyFee INT DEFAULT 0");
          existing.add('monthlyfee');
          console.log("[MIGRATION] Added monthlyFee column to wargas table");
        } catch (e: any) {
          console.warn("[MIGRATION] monthlyFee ALTER warning:", e.message);
        }
      }
      if (!existing.has('totaldebt')) {
        try {
          await db.execute("ALTER TABLE wargas ADD COLUMN totalDebt INT DEFAULT 0");
          existing.add('totaldebt');
          console.log("[MIGRATION] Added totalDebt column to wargas table");
        } catch (e: any) {
          console.warn("[MIGRATION] totalDebt ALTER warning:", e.message);
        }
      }
      if (!existing.has('dailyfee')) {
        try {
          await db.execute("ALTER TABLE wargas ADD COLUMN dailyFee INT DEFAULT 2000");
          existing.add('dailyfee');
          console.log("[MIGRATION] Added dailyFee column to wargas table");
        } catch (e: any) {
          console.warn("[MIGRATION] dailyFee ALTER warning:", e.message);
        }
      }
      return existing;
    } catch (err: any) {
      console.error("[MIGRATION] Error inspecting wargas columns:", err.message);
      return new Set<string>();
    }
  }

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
        `CREATE TABLE IF NOT EXISTS wargas (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), address TEXT, dukuhId INT, rtId INT, phone VARCHAR(20), dailyFee INT DEFAULT 2000, billingType VARCHAR(20) DEFAULT 'HARIAN', monthlyFee INT DEFAULT 0, totalDebt INT DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS petugases (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS admins (id VARCHAR(50) PRIMARY KEY, username VARCHAR(255), name VARCHAR(255), pin VARCHAR(10))`,
        `CREATE TABLE IF NOT EXISTS transactions (id VARCHAR(50) PRIMARY KEY, wargaId VARCHAR(50), petugasId VARCHAR(50), amount INT, status VARCHAR(20), category VARCHAR(50), timestamp DATETIME)`,
        `CREATE TABLE IF NOT EXISTS pengeluarans (id VARCHAR(50) PRIMARY KEY, description TEXT, amount INT, date DATE, category VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS pemasukan_lain (id VARCHAR(50) PRIMARY KEY, description TEXT, amount INT, date DATE, source VARCHAR(100), category VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS contact_messages (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20), subject VARCHAR(255), message TEXT, timestamp DATETIME, isRead BOOLEAN DEFAULT FALSE)`,
        `CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(50) PRIMARY KEY, title VARCHAR(255), content TEXT, date DATETIME, isActive BOOLEAN DEFAULT TRUE)`,
        `CREATE TABLE IF NOT EXISTS schedules (day VARCHAR(20) PRIMARY KEY, dukuhIds JSON)`
      ];
      for (const q of queries) {
        try {
          await db.execute(q);
        } catch (e: any) {
          console.warn("[Init Table Note]:", e.message);
        }
      }

      // Ensure village_config has all columns (Migration for existing databases)
      try {
        const [vCols]: any = await db.execute('DESCRIBE village_config');
        const existingVCols = new Set(vCols.map((c: any) => String(c.Field || c.field || '').toLowerCase()));
        const neededVCols = ['district', 'regency', 'phone', 'email', 'logo_url'];
        for (const col of neededVCols) {
          if (!existingVCols.has(col.toLowerCase())) {
            await db.execute(`ALTER TABLE village_config ADD COLUMN ${col} VARCHAR(255)`);
          }
        }
      } catch (err: any) {
        console.warn("[Migration village_config]:", err.message);
      }

      // Migration for admins table to add username
      try {
        const [aCols]: any = await db.execute('DESCRIBE admins');
        const existingACols = new Set(aCols.map((c: any) => String(c.Field || c.field || '').toLowerCase()));
        if (!existingACols.has('username')) {
          await db.execute(`ALTER TABLE admins ADD COLUMN username VARCHAR(255)`);
        }
      } catch (err: any) {
        console.warn("[Migration admins]:", err.message);
      }

      // Migration for wargas table to add billingType, monthlyFee, totalDebt, dailyFee
      await ensureWargasColumns(db);
      
      console.log("Database Schema Verified & Migrated.");
    } catch (err) {
      console.error("DB Init Error:", err);
      throw err;
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

  // API routes FIRST
  app.get('/api/diagnostic-db', async (req, res) => {
    try {
        const db = await getDB();
        const [tz] = await db.execute('SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as db_now_val');
        const [rows] = await db.execute('SELECT id, amount, status, category, timestamp, DATE(timestamp) as date_val, UNIX_TIMESTAMP(timestamp) as unix_ts FROM transactions ORDER BY timestamp DESC LIMIT 5');
        res.json({
            tz,
            rows,
            server_time: new Date().toISOString(),
            process_env_tz: process.env.TZ
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

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
        const [otherIncome]: any = await db.execute('SELECT SUM(amount) as total FROM pemasukan_lain WHERE YEAR(date) = ?', [year]);
        const [expense]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans WHERE YEAR(date) = ?', [year]);
        
        const totalIuran = Number(revenue[0]?.total || 0);
        const totalOtherIncome = Number(otherIncome[0]?.total || 0);
        const totalRevenue = totalIuran + totalOtherIncome;
        const totalExpense = Number(expense[0]?.total || 0);
        
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
            const [otherInc]: any = await db.execute('SELECT SUM(amount) as total FROM pemasukan_lain WHERE YEAR(date) = ? AND MONTH(date) = ?', [year, i]);
            const [exp]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans WHERE YEAR(date) = ? AND MONTH(date) = ?', [year, i]);
            const iuranVal = Number(inc[0]?.total || 0);
            const otherVal = Number(otherInc[0]?.total || 0);
            const income = iuranVal + otherVal;
            const expenseVal = Number(exp[0]?.total || 0);
            monthlyStats.push({
                monthName: months[i-1],
                income,
                iuranIncome: iuranVal,
                otherIncome: otherVal,
                expense: expenseVal,
                balance: income - expenseVal
            });
        }

        res.json({
            totalRevenue,
            totalIuran,
            totalOtherIncome,
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
        const [iuranRevenue]: any = await db.execute('SELECT SUM(amount) as total FROM transactions WHERE status = "paid"');
        const [otherRevenue]: any = await db.execute('SELECT SUM(amount) as total FROM pemasukan_lain');
        const [totalDebt]: any = await db.execute('SELECT SUM(totalDebt) as total FROM wargas');
        const [totalExpense]: any = await db.execute('SELECT SUM(amount) as total FROM pengeluarans');
        
        const totalIuran = Number(iuranRevenue[0]?.total || 0);
        const totalOther = Number(otherRevenue[0]?.total || 0);
        const totalRevenue = totalIuran + totalOther;
        const totalExp = Number(totalExpense[0]?.total || 0);
        const balance = totalRevenue - totalExp;

        res.json({
            totalWarga: wargaCount[0]?.total || 0,
            totalRevenue: totalRevenue,
            totalIuran: totalIuran,
            totalOtherIncome: totalOther,
            totalDebt: Number(totalDebt[0]?.total || 0),
            totalExpense: totalExp,
            balance: balance
        });
    } catch (err: any) {
        console.error(`[API Error] stats/admin:`, err.message);
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stats/petugas/:petugasId', async (req, res) => {
    try {
        const { petugasId } = req.params;
        const db = await getDB();
        
        // Define 'today' in WIB (UTC+7) manually to ensure consistency with DB 
        // even if system clock or mysql driver has offset issues
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const wib = new Date(utc + (3600000 * 7));
        const todayStr = wib.toISOString().split('T')[0];
        
        console.log(`[API] Fetching stats for petugas ${petugasId} for date ${todayStr}`);

        const [revenue]: any = await db.execute(
            'SELECT SUM(amount) as total FROM transactions WHERE petugasId = ? AND DATE(timestamp) = ? AND status = "paid"', 
            [petugasId, todayStr]
        );
        
        const [wargaCount]: any = await db.execute('SELECT COUNT(*) as total FROM wargas');

        res.json({
            total: Number(revenue[0].total || 0),
            count: Number(wargaCount[0].total || 0)
        });
    } catch (err: any) {
        console.error(`[API Error] stats/petugas/${req.params.petugasId}:`, err.message);
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
        await db.execute('INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", "tunggakan", ?)', [id, wargaId, petugasId, amount, getWIBDateTimeString()]);
        await db.execute('UPDATE wargas SET totalDebt = totalDebt - ? WHERE id = ?', [amount, wargaId]);
        res.json({ success: true, id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/transactions/partial', async (req, res) => {
    try {
        const { wargaId, petugasId, amountPaid, tarif, category } = req.body;
        const db = await getDB();
        const [wRows]: any = await db.execute('SELECT * FROM wargas WHERE id = ?', [wargaId]);
        if (wRows.length === 0) return res.status(404).json({ error: 'Warga tidak ditemukan' });
        const warga = wRows[0];

        const isBulanan = (category === 'bulanan' || (!category && warga.billingType === 'BULANAN'));
        const txCategory = isBulanan ? 'bulanan' : 'harian';
        const nominalTarif = Number(tarif) || (isBulanan ? (warga.monthlyFee || 0) : (warga.dailyFee || 2000));
        const paid = Number(amountPaid) || 0;
        const today = getWIBDateString();
        const nowStr = getWIBDateTimeString();

        // Bersihkan jika sebelumnya di hari yang sama sempat dicatat sebagai hutang/tunggakan harian
        const [todayUnpaidRows]: any = await db.execute(
            'SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? AND status = "unpaid" AND category = ?',
            [wargaId, today, txCategory]
        );
        if (todayUnpaidRows.length > 0) {
            for (const r of todayUnpaidRows) {
                await db.execute('UPDATE wargas SET totalDebt = GREATEST(0, totalDebt - ?) WHERE id = ?', [r.amount, wargaId]);
                await db.execute('DELETE FROM transactions WHERE id = ?', [r.id]);
            }
        }

        if (paid <= 0) {
            // Warga tidak membayar sama sekali -> catat hutang penuh
            const debtId = `tr-debt-${Date.now()}`;
            await db.execute(
                'INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "unpaid", ?, ?)',
                [debtId, wargaId, petugasId || null, nominalTarif, txCategory, nowStr]
            );
            await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [nominalTarif, wargaId]);
            return res.json({ success: true, type: 'tunggakan', amountPaid: 0, debtAdded: nominalTarif });
        }

        if (paid < nominalTarif) {
            // Pembayaran sebagian (misal tarif 2000 dibayar 1000)
            const deficit = nominalTarif - paid;
            
            // 1. Catat transaksi bayar (masuk penerimaan hari ini)
            const paidId = `tr-part-paid-${Date.now()}`;
            await db.execute(
                'INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", ?, ?)',
                [paidId, wargaId, petugasId || null, paid, txCategory, nowStr]
            );

            // 2. Catat sisa kekurangan sebagai tunggakan
            const debtId = `tr-part-debt-${Date.now()}`;
            await db.execute(
                'INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "unpaid", ?, ?)',
                [debtId, wargaId, petugasId || null, deficit, txCategory, nowStr]
            );

            // 3. Tambahkan selisih kekurangan ke totalDebt warga
            await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [deficit, wargaId]);

            return res.json({ success: true, type: 'sebagian', amountPaid: paid, debtAdded: deficit });
        }

        // paid >= nominalTarif (Pembayaran pas atau lebih)
        const paidId = `tr-paid-${Date.now()}`;
        await db.execute(
            'INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", ?, ?)',
            [paidId, wargaId, petugasId || null, nominalTarif, txCategory, nowStr]
        );

        const excess = paid - nominalTarif;
        if (excess > 0) {
            // Kelebihan bayar otomatis dialokasikan untuk memotong tunggakan lama
            const debtPayId = `tr-debt-pay-${Date.now()}`;
            await db.execute(
                'INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", "tunggakan", ?)',
                [debtPayId, wargaId, petugasId || null, excess, nowStr]
            );
            await db.execute('UPDATE wargas SET totalDebt = GREATEST(0, totalDebt - ?) WHERE id = ?', [excess, wargaId]);
        }

        return res.json({ success: true, type: 'lunas', amountPaid: paid, excess });
    } catch (err: any) {
        console.error('[API Error] partial transaction:', err);
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/convert-debt/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const { petugasId } = req.body || {};
        const db = await getDB();
        const today = getWIBDateString();
        const [warga]: any = await db.execute('SELECT * FROM wargas WHERE id = ?', [wargaId]);
        if (warga.length === 0) throw new Error('Warga not found');
        const amount = warga[0].dailyFee || 2000;
        
        // Cek apakah ada transaksi hutang hari ini
        const [unpaidRows]: any = await db.execute(
            'SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? AND status = "unpaid" ORDER BY timestamp DESC LIMIT 1',
            [wargaId, today]
        );

        if (unpaidRows.length > 0) {
            const tx = unpaidRows[0];
            await db.execute('UPDATE transactions SET status = "paid", petugasId = ? WHERE id = ?', [petugasId || null, tx.id]);
            await db.execute('UPDATE wargas SET totalDebt = GREATEST(0, totalDebt - ?) WHERE id = ?', [tx.amount, wargaId]);
        } else {
            const id = `tr-${Date.now()}`;
            await db.execute('INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, "paid", "harian", ?)', [id, wargaId, petugasId || null, amount, getWIBDateTimeString()]);
        }

        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/check-payment/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = getWIBDateString();
        const [rows]: any = await db.execute('SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? AND status = "paid" LIMIT 1', [wargaId, today]);
        res.json({ paid: rows.length > 0 });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/transactions/today/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = getWIBDateString();
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

  app.post('/api/mark-skipped', async (req, res) => {
    try {
        const { dukuhIds } = req.body;
        const db = await getDB();
        const today = getWIBDateString();
        if (!Array.isArray(dukuhIds) || dukuhIds.length === 0) {
            return res.json({ success: true, count: 0 });
        }
        const placeholders = dukuhIds.map(() => '?').join(',');

        // Hanya warga dengan billingType = 'HARIAN' (atau NULL) yang dicatat tunggakan harian saat jadwal dilewati.
        // Warga berlangganan BULANAN membayar tarif bulanan tetap, tidak dikenakan denda harian saat armada batal/lewat.
        const [wargas]: any = await db.execute(`
            SELECT w.* FROM wargas w 
            WHERE w.dukuhId IN (${placeholders})
            AND (w.billingType = 'HARIAN' OR w.billingType IS NULL)
            AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.wargaId = w.id AND DATE(t.timestamp) = ?)
        `, [...dukuhIds, today]);

        let count = 0;
        for (const w of wargas) {
            const amount = w.dailyFee || 2000;
            const id = `tr-debt-skip-${Date.now()}-${w.id}`;
            await db.execute(
                'INSERT INTO transactions (id, wargaId, status, amount, category, timestamp) VALUES (?, ?, "unpaid", ?, "harian", ?)',
                [id, w.id, amount, getWIBDateTimeString()]
            );
            await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [amount, w.id]);
            count++;
        }
        res.json({ success: true, count });
    } catch (err: any) {
        console.error('[API] mark-skipped error:', err);
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/warga-status/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();
        const today = getWIBDateString();

        const [wRows]: any = await db.execute('SELECT * FROM wargas WHERE id = ?', [wargaId]);
        if (wRows.length === 0) {
            return res.status(404).json({ error: 'Warga tidak ditemukan' });
        }
        const warga = wRows[0];

        // 1. Cek transaksi hari ini
        const [todayRows]: any = await db.execute(
            'SELECT * FROM transactions WHERE wargaId = ? AND DATE(timestamp) = ? ORDER BY timestamp DESC LIMIT 1', 
            [wargaId, today]
        );

        // 2. Cek status pembayaran bulanan bulan ini (WIB)
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const wib = new Date(utc + (3600000 * 7));
        const currentYear = wib.getFullYear();
        const currentMonth = wib.getMonth() + 1;

        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const currentMonthName = `${months[currentMonth - 1]} ${currentYear}`;

        const [mRows]: any = await db.execute(`
            SELECT * FROM transactions 
            WHERE wargaId = ? 
            AND LOWER(category) = 'bulanan' 
            AND LOWER(status) = 'paid' 
            AND YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `, [wargaId, currentYear, currentMonth]);

        const monthlyPaid = mRows.length > 0;

        res.json({
            warga,
            todayTx: todayRows[0] || null,
            monthlyPaid,
            monthlyTx: mRows[0] || null,
            currentMonthName,
            currentMonth,
            currentYear
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/monthly-status/:wargaId', async (req, res) => {
    try {
        const { wargaId } = req.params;
        const db = await getDB();

        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const wib = new Date(utc + (3600000 * 7));
        const currentYear = wib.getFullYear();
        const currentMonth = wib.getMonth() + 1;

        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const currentMonthName = `${months[currentMonth - 1]} ${currentYear}`;

        const [mRows]: any = await db.execute(`
            SELECT * FROM transactions 
            WHERE wargaId = ? 
            AND LOWER(category) = 'bulanan' 
            AND LOWER(status) = 'paid' 
            AND YEAR(timestamp) = ? 
            AND MONTH(timestamp) = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `, [wargaId, currentYear, currentMonth]);

        res.json({
            monthlyPaid: mRows.length > 0,
            monthlyTx: mRows[0] || null,
            currentMonthName,
            currentMonth,
            currentYear
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reports', async (req, res) => {
    try {
        const { startDate, endDate, dukuhId, status } = req.body;
        const db = await getDB();
        
        console.log('[REPORTS] Raw filter input:', { startDate, endDate, dukuhId, status });

        // Use LEFT JOIN to ensure we don't lose transactions if related data is missing
        let query = `
            SELECT 
                t.*, 
                DATE_FORMAT(t.timestamp, '%Y-%m-%d %H:%i:%s') as timestamp,
                w.name as wargaName, 
                w.dukuhId as wargaDukuhId, 
                w.rtId as wargaRtId,
                p.name as petugasName, 
                d.name as dukuhName, 
                r.number as rtNumber
            FROM transactions t 
            LEFT JOIN wargas w ON t.wargaId = w.id 
            LEFT JOIN petugases p ON t.petugasId = p.id
            LEFT JOIN dukuhs d ON w.dukuhId = d.id
            LEFT JOIN rts r ON w.rtId = r.id
            WHERE 1=1
        `;
        const params = [];
        if (startDate) { 
            let adjustedStartDate = startDate;
            if (typeof startDate === 'string' && startDate.includes('T')) {
                adjustedStartDate = startDate.split('T')[0];
            }
            if (typeof adjustedStartDate === 'string' && adjustedStartDate.length === 10) {
                // To support transactions that may be timezone-shifted (e.g. UTC vs WIB),
                // we subtract 1 day from the start filter safely.
                try {
                    const dateParts = adjustedStartDate.split('-');
                    if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]) - 1;
                        const day = parseInt(dateParts[2]);
                        const d = new Date(year, month, day);
                        d.setDate(d.getDate() - 1);
                        const prevYear = d.getFullYear();
                        const prevMonth = String(d.getMonth() + 1).padStart(2, '0');
                        const prevDay = String(d.getDate()).padStart(2, '0');
                        adjustedStartDate = `${prevYear}-${prevMonth}-${prevDay} 00:00:00`;
                    } else {
                        adjustedStartDate = adjustedStartDate + ' 00:00:00';
                    }
                } catch (e) {
                    adjustedStartDate = adjustedStartDate + ' 00:00:00';
                }
            }
            query += ' AND t.timestamp >= ?'; 
            params.push(adjustedStartDate); 
        }
        if (endDate) { 
            let adjustedEndDate = endDate;
            if (typeof endDate === 'string' && endDate.includes('T')) {
                adjustedEndDate = endDate.split('T')[0];
            }
            if (typeof adjustedEndDate === 'string' && adjustedEndDate.length === 10) {
                // To support transactions that may be timezone-shifted,
                // we add 1 day to the end filter safely.
                try {
                    const dateParts = adjustedEndDate.split('-');
                    if (dateParts.length === 3) {
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]) - 1;
                        const day = parseInt(dateParts[2]);
                        const d = new Date(year, month, day);
                        d.setDate(d.getDate() + 1);
                        const nextYear = d.getFullYear();
                        const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
                        const nextDay = String(d.getDate()).padStart(2, '0');
                        adjustedEndDate = `${nextYear}-${nextMonth}-${nextDay} 23:59:59`;
                    } else {
                        adjustedEndDate = adjustedEndDate + ' 23:59:59';
                    }
                } catch (e) {
                    adjustedEndDate = adjustedEndDate + ' 23:59:59';
                }
            }
            query += ' AND t.timestamp <= ?'; 
            params.push(adjustedEndDate); 
        }
        if (dukuhId) { query += ' AND w.dukuhId = ?'; params.push(dukuhId); }
        if (status) { query += ' AND t.status = ?'; params.push(status); }
        query += ' ORDER BY t.timestamp DESC';

        console.log('[REPORTS] Executing query parameters:', params);

        const [rows]: any = await db.execute(query, params);

        console.log('[REPORTS] Found records:', rows.length);
        if (rows.length > 0) {
            console.log('[REPORTS] First row sample:', {
                id: rows[0].id,
                amount: rows[0].amount,
                timestamp: rows[0].timestamp,
                typeofTimestamp: typeof rows[0].timestamp
            });
        }

        res.json(rows);
    } catch (err: any) { 
        console.error('[REPORTS] Error loading reports:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  app.get('/api/unpaid-today', async (req, res) => {
    try {
        const db = await getDB();
        const today = getWIBDateString();
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const wib = new Date(utc + (3600000 * 7));
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[wib.getDay()];
        const [schedule]: any = await db.execute('SELECT * FROM schedules WHERE day = ?', [dayName]);
        const dukuhIds = schedule.length > 0 ? schedule[0].dukuhIds : [];
        if (!Array.isArray(dukuhIds) || dukuhIds.length === 0) return res.json([]);
        const placeholders = dukuhIds.map(() => '?').join(',');
        const currentYear = wib.getFullYear();
        const currentMonth = wib.getMonth() + 1;

        // Warga harian: belum bayar jika belum ada transaksi lunas hari ini
        // Warga bulanan: belum bayar jika belum ada iuran bulanan lunas di bulan ini
        const [wargas]: any = await db.execute(`
            SELECT w.* FROM wargas w 
            WHERE w.dukuhId IN (${placeholders})
            AND (
                (
                    (w.billingType = 'HARIAN' OR w.billingType IS NULL)
                    AND NOT EXISTS (
                        SELECT 1 FROM transactions t 
                        WHERE t.wargaId = w.id AND DATE(t.timestamp) = ? AND LOWER(t.status) IN ('paid', 'lunas')
                    )
                )
                OR
                (
                    w.billingType = 'BULANAN'
                    AND NOT EXISTS (
                        SELECT 1 FROM transactions t 
                        WHERE t.wargaId = w.id 
                        AND LOWER(t.category) = 'bulanan' 
                        AND LOWER(t.status) IN ('paid', 'lunas')
                        AND YEAR(t.timestamp) = ? 
                        AND MONTH(t.timestamp) = ?
                    )
                )
            )
        `, [...dukuhIds, today, currentYear, currentMonth]);
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

  // Helper for querying pengeluaran
  const queryPengeluarans = async (db: any, filter: any) => {
    let query = "SELECT id, description, amount, DATE_FORMAT(date, '%Y-%m-%d') as date, category FROM pengeluarans WHERE 1=1";
    const params = [];
    if (filter.startDate) { 
        let adjustedStartDate = filter.startDate;
        if (typeof adjustedStartDate === 'string' && adjustedStartDate.includes('T')) {
            adjustedStartDate = adjustedStartDate.split('T')[0];
        }
        query += ' AND date >= ?'; 
        params.push(adjustedStartDate); 
    }
    if (filter.endDate) { 
        let adjustedEndDate = filter.endDate;
        if (typeof adjustedEndDate === 'string' && adjustedEndDate.includes('T')) {
            adjustedEndDate = adjustedEndDate.split('T')[0];
        }
        query += ' AND date <= ?'; 
        params.push(adjustedEndDate); 
    }
    if (filter.category) { query += ' AND category = ?'; params.push(filter.category); }
    query += ' ORDER BY date DESC, id DESC';
    const [rows] = await db.execute(query, params);
    return rows;
  };

  // GET pengeluaran with query params
  app.get(['/api/pengeluaran', '/api/pengeluarans'], async (req, res) => {
    try {
        const db = await getDB();
        const rows = await queryPengeluarans(db, req.query);
        res.json(rows);
    } catch (err: any) { 
        console.error('[API Error] GET pengeluaran:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  // POST filter for pengeluaran
  app.post(['/api/pengeluaran/filter', '/api/pengeluarans/filter'], async (req, res) => {
    try {
        const db = await getDB();
        const rows = await queryPengeluarans(db, req.body);
        res.json(rows);
    } catch (err: any) { 
        console.error('[API Error] POST filter pengeluaran:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  // POST pengeluaran (Create, with fallback to filter if body is filter params)
  app.post(['/api/pengeluaran', '/api/pengeluarans'], async (req, res) => {
    try {
        const db = await getDB();
        const data = req.body;
        
        // If request is purely a filter request (has filter fields but no description & amount)
        if ((data.startDate || data.endDate) && data.description === undefined && data.amount === undefined) {
            const rows = await queryPengeluarans(db, data);
            return res.json(rows);
        }

        // It's a create request
        const { description, amount, date, category } = data;
        const id = `exp-${Date.now()}`;
        const catVal = category || 'OPERASIONAL';
        const dateVal = date ? (typeof date === 'string' && date.includes('T') ? date.split('T')[0] : date) : new Date().toISOString().split('T')[0];
        const amountVal = Number(amount) || 0;

        await db.execute(
            'INSERT INTO pengeluarans (id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)', 
            [id, description || '', amountVal, dateVal, catVal]
        );
        res.json({ id, description: description || '', amount: amountVal, date: dateVal, category: catVal });
    } catch (err: any) { 
        console.error('[API Error] CREATE pengeluaran:', err.message);
        res.status(500).json({ error: err.message }); 
    }
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

  // --- PEMASUKAN LAIN (NON-IURAN) ROUTES ---

  // Helper for querying pemasukan_lain
  const queryPemasukanLain = async (db: any, filter: any) => {
    let query = "SELECT id, description, amount, DATE_FORMAT(date, '%Y-%m-%d') as date, source, category FROM pemasukan_lain WHERE 1=1";
    const params = [];
    if (filter.startDate) { 
        let adjustedStartDate = filter.startDate;
        if (typeof adjustedStartDate === 'string' && adjustedStartDate.includes('T')) {
            adjustedStartDate = adjustedStartDate.split('T')[0];
        }
        query += ' AND date >= ?'; 
        params.push(adjustedStartDate); 
    }
    if (filter.endDate) { 
        let adjustedEndDate = filter.endDate;
        if (typeof adjustedEndDate === 'string' && adjustedEndDate.includes('T')) {
            adjustedEndDate = adjustedEndDate.split('T')[0];
        }
        query += ' AND date <= ?'; 
        params.push(adjustedEndDate); 
    }
    if (filter.source) { query += ' AND source = ?'; params.push(filter.source); }
    if (filter.category) { query += ' AND category = ?'; params.push(filter.category); }
    query += ' ORDER BY date DESC, id DESC';
    const [rows] = await db.execute(query, params);
    return rows;
  };

  // GET pemasukan-lain with query params
  app.get(['/api/pemasukan-lain', '/api/pemasukan-lains'], async (req, res) => {
    try {
        const db = await getDB();
        const rows = await queryPemasukanLain(db, req.query);
        res.json(rows);
    } catch (err: any) { 
        console.error('[API Error] GET pemasukan-lain:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  // POST filter for pemasukan-lain
  app.post(['/api/pemasukan-lain/filter', '/api/pemasukan-lains/filter'], async (req, res) => {
    try {
        const db = await getDB();
        const rows = await queryPemasukanLain(db, req.body);
        res.json(rows);
    } catch (err: any) { 
        console.error('[API Error] POST filter pemasukan-lain:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  // POST pemasukan-lain (Create, with fallback to filter if body is filter params)
  app.post(['/api/pemasukan-lain', '/api/pemasukan-lains'], async (req, res) => {
    try {
        const db = await getDB();
        const data = req.body;
        
        // If this request is purely a filter request (has startDate/endDate but no description & amount)
        if ((data.startDate || data.endDate) && data.description === undefined && data.amount === undefined) {
            const rows = await queryPemasukanLain(db, data);
            return res.json(rows);
        }

        // It's a create request
        const { description, amount, date, source, category } = data;
        const id = `inc-${Date.now()}`;
        const sourceVal = source || 'Lainnya';
        const catVal = category || 'PEMASUKAN_LAIN';
        const dateVal = date ? (typeof date === 'string' && date.includes('T') ? date.split('T')[0] : date) : new Date().toISOString().split('T')[0];
        const amountVal = Number(amount) || 0;

        await db.execute(
            'INSERT INTO pemasukan_lain (id, description, amount, date, source, category) VALUES (?, ?, ?, ?, ?, ?)', 
            [id, description || '', amountVal, dateVal, sourceVal, catVal]
        );
        res.json({ id, description: description || '', amount: amountVal, date: dateVal, source: sourceVal, category: catVal });
    } catch (err: any) { 
        console.error('[API Error] CREATE pemasukan-lain:', err.message);
        res.status(500).json({ error: err.message }); 
    }
  });

  app.put(['/api/pemasukan-lain/:id', '/api/pemasukan-lains/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const db = await getDB();
        const sets = Object.keys(data).map(c => `\`${c}\` = ?`).join(', ');
        const vals = [...Object.values(data), id];
        await db.execute(`UPDATE pemasukan_lain SET ${sets} WHERE id = ?`, vals);
        res.json({ id, ...data });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.delete(['/api/pemasukan-lain/:id', '/api/pemasukan-lains/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        await db.execute('DELETE FROM pemasukan_lain WHERE id = ?', [id]);
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
            'transactions', 'pengeluarans', 'pemasukan_lain', 'contact_messages', 'announcements'
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

  // Helper to generate next numeric warga ID safely
  async function getNextWargaId(db: any): Promise<number> {
    const [rows]: any = await db.execute(
      'SELECT id FROM wargas WHERE id REGEXP "^[0-9]+$" ORDER BY CAST(id AS UNSIGNED) DESC LIMIT 1'
    );
    if (rows && rows.length > 0 && rows[0]?.id) {
      const parsed = parseInt(rows[0].id, 10);
      if (!isNaN(parsed) && parsed >= 100000) {
        return parsed + 1;
      }
    }
    const [countRows]: any = await db.execute('SELECT COUNT(*) as total FROM wargas');
    return 100001 + ((countRows && countRows[0]?.total) || 0);
  }

  app.post('/api/data/:table/bulk', async (req, res) => {
    try {
        const { table } = req.params;
        const items = req.body;
        const db = await getDB();
        
        if (!Array.isArray(items) || items.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        if (table === 'wargas') {
            // First run auto-migration to ensure columns exist in wargas table
            const activeCols = await ensureWargasColumns(db);

            // Bulk insert/update specifically optimized for wargas
            const [existingRows]: any = await db.execute('SELECT id, name, dukuhId, rtId FROM wargas');
            const existingById = new Map<string, any>();
            const existingByNameAndLoc = new Map<string, any>();
            for (const row of existingRows) {
                if (row.id) existingById.set(String(row.id).trim(), row);
                const key = `${String(row.name || '').trim().toLowerCase()}_${row.dukuhId}_${row.rtId}`;
                existingByNameAndLoc.set(key, row);
            }

            let nextNumericId = await getNextWargaId(db);

            const preparedRows: any[] = [];
            for (const item of items) {
                const cleanName = String(item.name || '').trim();
                if (!cleanName) continue;

                const dId = Number(item.dukuhId) || 0;
                const rId = Number(item.rtId) || 0;
                const locKey = `${cleanName.toLowerCase()}_${dId}_${rId}`;
                
                const matched = (item.id && existingById.get(String(item.id).trim())) || existingByNameAndLoc.get(locKey);

                let id: string;
                if (item.id && String(item.id).trim().length > 0) {
                    id = String(item.id).trim();
                } else if (matched && matched.id) {
                    id = String(matched.id);
                } else {
                    id = String(nextNumericId++);
                }

                let totalDebt = 0;
                if (item.totalDebt !== undefined && !isNaN(Number(item.totalDebt))) {
                    totalDebt = Number(item.totalDebt);
                } else if (matched && matched.totalDebt !== undefined) {
                    totalDebt = Number(matched.totalDebt);
                }

                const billingType = String(item.billingType || '').toUpperCase().includes('BULAN') ? 'BULANAN' : 'HARIAN';
                const dailyFee = (!isNaN(Number(item.dailyFee)) && Number(item.dailyFee) >= 0) ? Number(item.dailyFee) : 2000;
                const monthlyFee = (!isNaN(Number(item.monthlyFee)) && Number(item.monthlyFee) >= 0) 
                    ? Number(item.monthlyFee) 
                    : (billingType === 'BULANAN' ? 25000 : 0);
                const address = item.address ? String(item.address).trim() : null;
                const phone = item.phone ? String(item.phone).trim() : null;

                const rowObj: any = {
                    id,
                    name: cleanName,
                    address,
                    dukuhId: dId,
                    rtId: rId,
                    phone
                };
                if (activeCols.has('dailyfee')) rowObj.dailyFee = dailyFee;
                if (activeCols.has('billingtype')) rowObj.billingType = billingType;
                if (activeCols.has('monthlyfee')) rowObj.monthlyFee = monthlyFee;
                if (activeCols.has('totaldebt')) rowObj.totalDebt = totalDebt;

                preparedRows.push(rowObj);
            }

            if (preparedRows.length === 0) {
                return res.json({ success: true, count: 0 });
            }

            // Dynamically determine insertable columns based on active columns that actually exist
            const insertKeys: string[] = ['id', 'name', 'address', 'dukuhId', 'rtId', 'phone'];
            if (activeCols.has('dailyfee')) insertKeys.push('dailyFee');
            if (activeCols.has('billingtype')) insertKeys.push('billingType');
            if (activeCols.has('monthlyfee')) insertKeys.push('monthlyFee');
            if (activeCols.has('totaldebt')) insertKeys.push('totalDebt');

            const colsSql = insertKeys.map(k => `\`${k}\``).join(', ');
            const singlePlaceholder = `(${insertKeys.map(() => '?').join(', ')})`;

            // Batch multi-row REPLACE INTO (safe against re-uploads & duplicate entries)
            const chunkSize = 200;
            for (let i = 0; i < preparedRows.length; i += chunkSize) {
                const chunk = preparedRows.slice(i, i + chunkSize);
                const placeholders = chunk.map(() => singlePlaceholder).join(', ');
                const flatValues = chunk.flatMap(r => insertKeys.map(k => (r[k] === undefined ? null : r[k])));
                await db.execute(
                    `REPLACE INTO \`wargas\` (${colsSql}) VALUES ${placeholders}`,
                    flatValues
                );
            }

            return res.json({ success: true, count: preparedRows.length });
        }

        // Generic fallback for other tables
        const keys = Object.keys(items[0]);
        const cols = keys.map(c => `\`${c}\``).join(', ');
        const q = keys.map(() => '?').join(', ');
        
        for (const item of items) {
            const vals = keys.map(k => (item[k] === undefined ? null : item[k]));
            await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${q})`, vals);
        }
        
        res.json({ success: true, count: items.length });
    } catch (err: any) {
        console.error('Bulk Insert Error:', err);
        res.status(500).json({ error: err.message, message: err.message });
    }
  });

  app.post('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const data = req.body;
        const db = await getDB();
        
        if (table === 'wargas') {
            const activeCols = await ensureWargasColumns(db);
            if (!data.id) {
                data.id = String(await getNextWargaId(db));
            }
            if (data.totalDebt === undefined && activeCols.has('totaldebt')) {
                data.totalDebt = 0;
            }
            if (!data.billingType && activeCols.has('billingtype')) {
                data.billingType = 'HARIAN';
            }

            const allowed = new Set(['id', 'name', 'address', 'dukuhId', 'rtId', 'phone']);
            if (activeCols.has('dailyfee')) allowed.add('dailyFee');
            if (activeCols.has('billingtype')) allowed.add('billingType');
            if (activeCols.has('monthlyfee')) allowed.add('monthlyFee');
            if (activeCols.has('totaldebt')) allowed.add('totalDebt');

            const cleanData: any = {};
            for (const [k, v] of Object.entries(data)) {
                if (allowed.has(k)) {
                    cleanData[k] = v === undefined ? null : v;
                }
            }

            const cols = Object.keys(cleanData).map(c => `\`${c}\``).join(', ');
            const q = Object.keys(cleanData).map(() => '?').join(', ');
            const vals = Object.values(cleanData);
            
            const [result]: any = await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${q})`, vals);
            return res.json({ id: cleanData.id || result.insertId, ...cleanData });
        } else if (table === 'petugases' && !data.id) {
            data.id = `petugas-${Date.now()}`;
        } else if (table === 'admins' && !data.id) {
            data.id = `admin-${Date.now()}`;
        }

        const cleanData: any = {};
        for (const [k, v] of Object.entries(data)) {
            cleanData[k] = v === undefined ? null : v;
        }

        const cols = Object.keys(cleanData).map(c => `\`${c}\``).join(', ');
        const q = Object.keys(cleanData).map(() => '?').join(', ');
        const vals = Object.values(cleanData);
        
        const [result]: any = await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${q})`, vals);
        res.json({ id: cleanData.id || result.insertId, ...cleanData });
    } catch (err: any) {
        console.error('Data Insert Error:', err);
        res.status(500).json({ error: err.message, message: err.message });
    }
  });

  app.put('/api/data/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = req.body;
        const db = await getDB();
        
        if (table === 'wargas') {
            const activeCols = await ensureWargasColumns(db);
            const allowed = new Set(['name', 'address', 'dukuhId', 'rtId', 'phone']);
            if (activeCols.has('dailyfee')) allowed.add('dailyFee');
            if (activeCols.has('billingtype')) allowed.add('billingType');
            if (activeCols.has('monthlyfee')) allowed.add('monthlyFee');
            if (activeCols.has('totaldebt')) allowed.add('totalDebt');

            const filteredData: any = {};
            for (const [k, v] of Object.entries(data)) {
                if (allowed.has(k)) {
                    filteredData[k] = v === undefined ? null : v;
                }
            }
            const sets = Object.keys(filteredData).map(c => `\`${c}\` = ?`).join(', ');
            const vals = [...Object.values(filteredData), id];
            await db.execute(`UPDATE \`wargas\` SET ${sets} WHERE id = ?`, vals);
            return res.json({ id, ...filteredData });
        }

        const sets = Object.keys(data).map(c => `\`${c}\` = ?`).join(', ');
        const vals = [...Object.values(data), id];
        
        await db.execute(`UPDATE \`${table}\` SET ${sets} WHERE id = ?`, vals);
        res.json({ id, ...data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data/:table/bulk-delete', async (req, res) => {
    try {
        const { table } = req.params;
        const { ids } = req.body;
        const db = await getDB();
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const chunkSize = 500;
        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            const placeholders = chunk.map(() => '?').join(',');
            await db.execute(`DELETE FROM \`${table}\` WHERE id IN (${placeholders})`, chunk);
            if (table === 'wargas') {
                await db.execute(`DELETE FROM transactions WHERE wargaId IN (${placeholders})`, chunk);
            }
        }
        res.json({ success: true, count: ids.length });
    } catch (err: any) {
        console.error('[API] bulk-delete error:', err);
        res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/data/:table/bulk', async (req, res) => {
    try {
        const { table } = req.params;
        const { ids } = req.body;
        const db = await getDB();
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const chunkSize = 500;
        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            const placeholders = chunk.map(() => '?').join(',');
            await db.execute(`DELETE FROM \`${table}\` WHERE id IN (${placeholders})`, chunk);
            if (table === 'wargas') {
                await db.execute(`DELETE FROM transactions WHERE wargaId IN (${placeholders})`, chunk);
            }
        }
        res.json({ success: true, count: ids.length });
    } catch (err: any) {
        console.error('[API] bulk-delete error:', err);
        res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/data/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const db = await getDB();
        await db.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
        if (table === 'wargas') {
            await db.execute(`DELETE FROM transactions WHERE wargaId = ?`, [id]);
        }
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
            'transactions', 'pengeluarans', 'pemasukan_lain', 'contact_messages', 'announcements'
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
                            'billing_type': 'billingType',
                            'monthly_fee': 'monthlyFee',
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

  app.post('/api/transactions', async (req, res) => {
    try {
        const { wargaId, petugasId, amount, status, category } = req.body;
        const db = await getDB();
        const id = `tr-${Date.now()}`;
        
        // Standardize status: LUNAS/paid -> paid, HUTANG/unpaid -> unpaid
        const finalStatus = (status === 'LUNAS' || status === 'paid') ? 'paid' : 'unpaid';
        // Standardize category: tunggakan, bulanan, ambil_bulanan, or harian
        let finalCategory = 'harian';
        const catLower = (category || '').toLowerCase();
        if (catLower === 'tunggakan') {
            finalCategory = 'tunggakan';
        } else if (catLower === 'bulanan' || catLower === 'iuran_bulanan') {
            finalCategory = 'bulanan';
        } else if (catLower === 'ambil_bulanan') {
            finalCategory = 'ambil_bulanan';
        }

        await db.execute('INSERT INTO transactions (id, wargaId, petugasId, amount, status, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, wargaId, petugasId || null, amount, finalStatus, finalCategory, getWIBDateTimeString()]);

        // Effect on totalDebt
        if (finalStatus === 'unpaid') {
            // Adding a debt record (harian or bulanan)
            await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [amount, wargaId]);
        } else if (finalStatus === 'paid' && finalCategory === 'tunggakan') {
            // Paying a debt
            await db.execute('UPDATE wargas SET totalDebt = totalDebt - ? WHERE id = ?', [amount, wargaId]);
        }
        // Normal daily payment (paid + harian) doesn't change existing totalDebt field

        res.json({ success: true, id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDB();
        
        // 1. Get transaction details before deleting
        const [rows]: any = await db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }
        
        const tx = rows[0];
        
        // 2. Revert debt logic
        // Use case-insensitive check and handle both DB and Frontend strings
        const isPaid = tx.status.toLowerCase() === 'paid' || tx.status === 'LUNAS';
        const isUnpaid = tx.status.toLowerCase() === 'unpaid' || tx.status === 'HUTANG';
        const isTunggakan = tx.category.toLowerCase() === 'tunggakan' || tx.category === 'TUNGGAKAN';

        if (isUnpaid) {
            // Deleting a debt record -> decrease totalDebt back
            await db.execute('UPDATE wargas SET totalDebt = totalDebt - ? WHERE id = ?', [tx.amount, tx.wargaId]);
        } else if (isPaid && isTunggakan) {
            // Deleting a payment of debt -> increase totalDebt back
            await db.execute('UPDATE wargas SET totalDebt = totalDebt + ? WHERE id = ?', [tx.amount, tx.wargaId]);
        }
        
        // 3. Delete the transaction
        await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
        
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/recalculate-debt', async (req, res) => {
    console.log('[API] recalculate-debt triggered');
    try {
        const db = await getDB();
        
        // Recalculate totalDebt for ALL wargas based on transaction history
        const [result] = await db.execute(`
            UPDATE wargas w
            SET w.totalDebt = (
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN LOWER(t.status) IN ('unpaid', 'hutang') THEN t.amount 
                        WHEN LOWER(t.status) IN ('paid', 'lunas') AND LOWER(t.category) IN ('tunggakan') THEN -t.amount 
                        ELSE 0 
                    END
                ), 0)
                FROM transactions t
                WHERE t.wargaId = w.id
            )
        `);
        
        console.log('[API] recalculate-debt finished safely');
        res.json({ success: true, result });
    } catch (err: any) {
        console.error('[API] recalculate-debt error:', err);
        res.status(500).json({ error: err.message });
    }
  });

  // Manual / Diagnostic Migration Trigger
  app.get('/api/system/migrate', async (req, res) => {
    try {
      const db = await getDB();
      await initializeDatabase();
      const [cols]: any = await db.execute('DESCRIBE wargas');
      res.json({ 
        success: true, 
        message: 'Database schema successfully verified and migrated.',
        wargasColumns: cols.map((c: any) => c.Field)
      });
    } catch (err: any) {
      console.error('[API] /api/system/migrate error:', err);
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
    console.log(`Server SapaDesa running on http://localhost:${PORT}`);
    console.log(`Timezone forced to WIB (UTC+7)`);
    
    // Non-blocking retry loop for database initialization (vital for Portainer/Docker startup)
    (async () => {
      let retries = 15;
      while (retries > 0) {
        try {
          await initializeDatabase();
          console.log("Database initialized and all table schemas verified.");
          break;
        } catch (e: any) {
          retries--;
          console.warn(`[DB Init] Waiting for database (${e.message}). Retrying in 3s... (${retries} left)`);
          if (retries === 0) {
            console.error("Database connection failed after 15 attempts. Schema migration will run on first API request.");
          } else {
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }
    })();
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error] ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });
}

startServer();

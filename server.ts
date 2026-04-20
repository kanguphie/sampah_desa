
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

  // --- API ROUTES ---

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
        
        // Order matters for foreign keys
        const tables = [
            'village_config', 'dukuhs', 'rts', 'wargas', 
            'petugases', 'admins', 'schedules',
            'transactions', 'pengeluarans', 'contact_messages', 'announcements'
        ];

        for (const table of tables) {
            if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
                try {
                    // Simple replacement logic for restore
                    // For Production, use ON DUPLICATE KEY UPDATE
                    const columns = Object.keys(data[table][0]).map(c => `\`${c}\``).join(', ');
                    const placeholders = Object.keys(data[table][0]).map(() => '?').join(', ');
                    
                    for (const row of data[table]) {
                        const values = Object.values(row);
                        await db.execute(`REPLACE INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
                    }
                    (results.success as string[]).push(table);
                } catch (e: any) {
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SapaDesa running on http://localhost:${PORT}`);
    console.log(`Timezone forced to WIB (UTC+7)`);
  });
}

startServer();

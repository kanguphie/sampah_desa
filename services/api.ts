import type { Warga, Petugas, Admin, Transaksi, Dukuh, RT, Pengeluaran, PublicStats, Announcement } from '@/types';

// --- DATA PERSISTENCE HELPERS ---
const DB_KEY = 'sapadesa_db_v1';

const saveToStorage = (data: any) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const loadFromStorage = () => {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
};

// --- INITIAL STATE / MOCK DATA ---
const initialState = {
    dukuhs: [
        { id: 1, name: 'Rowosari' },
        { id: 2, name: 'Pencar' },
        { id: 3, name: 'Paten' },
        { id: 4, name: 'Adiloko' },
    ],
    rts: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, number: (i + 1).toString().padStart(2, '0') })),
    wargas: [] as Warga[],
    petugases: [
        { id: 'petugas01', name: 'Agus', phone: '081234567890', pin: '1234' },
        { id: 'petugas02', name: 'Bambang', phone: '081234567891', pin: '5678' },
    ],
    admins: [{ id: 'admin01', username: 'admin', name: 'Admin Desa' }],
    transactions: [] as Transaksi[],
    pengeluarans: [] as Pengeluaran[],
    schedule: { 
        Senin: [1, 2], 
        Selasa: [3, 4], 
        Rabu: [1, 2], 
        Kamis: [3, 4], 
        Jumat: 'libur', 
        Sabtu: [1, 2], 
        Minggu: [4, 3] 
    }
};

// Initialize Wargas if not exists
if (initialState.wargas.length === 0) {
    const dummyNames = ["Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Eko Prasetyo", "Rina Wulandari", "Joko Susilo"];
    initialState.dukuhs.forEach(dukuh => {
        initialState.rts.slice(0, 3).forEach(rt => {
            for (let i = 0; i < 2; i++) {
                initialState.wargas.push({
                    id: String(100000 + initialState.wargas.length),
                    name: dummyNames[initialState.wargas.length % dummyNames.length],
                    rtId: rt.id,
                    dukuhId: dukuh.id,
                    dailyFee: 2000,
                    totalDebt: 0
                });
            }
        });
    });
}

// Load data or set default
let db = loadFromStorage() || initialState;

// --- API Implementation ---

export const markDayAsSkipped = async (dukuhIds: number[]) => {
    db.wargas.forEach(w => {
        if (dukuhIds.includes(w.dukuhId)) {
            w.totalDebt += w.dailyFee;
        }
    });
    saveToStorage(db);
    return true;
};

export const getWargaById = async (id: string): Promise<Warga | null> => db.wargas.find(w => w.id === id) || null;
export const getAllWarga = async (): Promise<Warga[]> => [...db.wargas];

export const createTransaksi = async (txData: any): Promise<Transaksi> => {
    const newTx: Transaksi = { ...txData, id: `tx${Date.now()}`, timestamp: new Date(), category: 'IURAN' };
    db.transactions.unshift(newTx);
    saveToStorage(db);
    return newTx;
};

export const payDebt = async (wargaId: string, petugasId: string, amount: number): Promise<Transaksi> => {
    const warga = db.wargas.find(w => w.id === wargaId);
    if (warga) warga.totalDebt = Math.max(0, warga.totalDebt - amount);
    const newTx: Transaksi = { id: `tx-p-${Date.now()}`, timestamp: new Date(), wargaId, petugasId, amount, status: 'LUNAS', category: 'TUNGGAKAN' };
    db.transactions.unshift(newTx);
    saveToStorage(db);
    return newTx;
};

export const loginPetugas = async (pin: string): Promise<Petugas | null> => db.petugases.find(p => p.pin === pin) || null;
export const loginAdmin = async (u: string, p: string): Promise<Admin | null> => (u === 'admin' && p === 'password') ? db.admins[0] : null;

export const getAllDukuh = async (): Promise<Dukuh[]> => [...db.dukuhs];
export const getDukuhById = (id: number) => db.dukuhs.find(d => d.id === id) || null;
export const getAllRT = async (): Promise<RT[]> => [...db.rts];
export const getRTById = (id: number) => db.rts.find(r => r.id === id) || null;

export const getReports = async (f: { startDate: Date, endDate: Date }): Promise<any[]> => {
    const start = new Date(f.startDate); start.setHours(0,0,0,0);
    const end = new Date(f.endDate); end.setHours(23,59,59,999);
    return db.transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= start && txDate <= end;
    }).map(tx => {
        const w = db.wargas.find(w => w.id === tx.wargaId);
        return {
            ...tx,
            wargaName: w?.name || 'Warga Terhapus',
            petugasName: db.petugases.find(p => p.id === tx.petugasId)?.name || 'Sistem',
            dukuhName: db.dukuhs.find(d => d.id === w?.dukuhId)?.name || '-',
            rtNumber: db.rts.find(r => r.id === w?.rtId)?.number || '-'
        };
    });
};

export const getAdminDashboardStats = async () => {
    const totalRevenue = db.transactions.filter(tx => tx.status === 'LUNAS').reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebt = db.wargas.reduce((sum, w) => sum + (w.totalDebt || 0), 0);
    const totalExpense = db.pengeluarans.reduce((sum, p) => sum + p.amount, 0);
    return {
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense,
        totalWarga: db.wargas.length,
        totalDebt
    };
};

export const getSchedule = async () => ({ ...db.schedule });
export const updateSchedule = async (day: string, s: any) => {
    (db.schedule as any)[day] = s;
    saveToStorage(db);
    return db.schedule;
}; 

export const getScheduleForToday = async () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];
    const todaySched = (db.schedule as any)[todayName];
    if (todaySched === 'libur' || !todaySched || todaySched.length === 0) return { isHoliday: true, dukuhIds: [], dukuhNames: [] };
    const dukuhNames = todaySched.map((id: number) => db.dukuhs.find(d => d.id === id)?.name || 'N/A');
    return { isHoliday: false, dukuhIds: todaySched, dukuhNames };
};

export const checkIfWargaPaidToday = async (id: string) => db.transactions.some(tx => tx.wargaId === id && new Date(tx.timestamp).toDateString() === new Date().toDateString());
export const getUnpaidWargaForToday = async () => db.wargas.filter(w => !db.transactions.some(tx => tx.wargaId === w.id && new Date(tx.timestamp).toDateString() === new Date().toDateString()));

export const getActiveAnnouncements = async () => [];
export const getPublicDashboardStats = async (): Promise<PublicStats> => ({
    totalWarga: db.wargas.length,
    totalTransaksiBulanIni: db.transactions.length,
    totalDanaTerkumpulBulanIni: db.transactions.reduce((s, t) => s + t.amount, 0)
});
export const getTransactionsByWargaId = async (id: string, limit?: number) => db.transactions.filter(t => t.wargaId === id).slice(0, limit);
export const getPengeluaran = async (f: any) => db.pengeluarans;
export const getPetugasDailySummary = async (id: string) => {
    const txs = db.transactions.filter(t => t.petugasId === id && new Date(t.timestamp).toDateString() === new Date().toDateString());
    return { total: txs.reduce((s, t) => s + t.amount, 0), count: txs.length };
};
export const getDetailedPublicTransparency = async (year: number) => ({
    dukuhStats: db.dukuhs.map(d => ({ name: d.name, total: 0 })),
    monthlyStats: [],
    totalRevenue: 0,
    totalExpense: 0,
    balance: 0
});
export const updateAdminProfile = async (id: any, n: any, p: any) => db.admins[0];
export const updatePetugasProfile = async (id: any, n: any, ph: any, pi: any) => db.petugases[0];
export const updateWarga = async (id: string, data: Warga) => { const i = db.wargas.findIndex(w => w.id === id); if(i>-1) db.wargas[i] = data; saveToStorage(db); return data; };
export const createWarga = async (data: any) => { const nw = { ...data, id: String(100000 + db.wargas.length), totalDebt: 0 }; db.wargas.push(nw); saveToStorage(db); return nw; };
// Added bulkCreateWarga to handle Excel imports
export const bulkCreateWarga = async (data: any[]) => { data.forEach(d => { const nw = { ...d, id: String(100000 + db.wargas.length), totalDebt: 0 }; db.wargas.push(nw); }); saveToStorage(db); };
export const deleteWarga = async (id: string) => { db.wargas = db.wargas.filter(w => w.id !== id); saveToStorage(db); };
export const getAllPetugas = async () => db.petugases;
export const createPetugas = async (d: any) => { const np = { ...d, id: 'petugas' + Date.now() }; db.petugases.push(np); saveToStorage(db); return np; };
export const updatePetugas = async (id: string, d: any) => { const i = db.petugases.findIndex(p => p.id === id); if(i>-1) db.petugases[i] = { ...db.petugases[i], ...d }; saveToStorage(db); return db.petugases[i]; };
export const deletePetugas = async (id: string) => { db.petugases = db.petugases.filter(p => p.id !== id); saveToStorage(db); };
export const createDukuh = async (d: any) => { const nd = { ...d, id: db.dukuhs.length + 1 }; db.dukuhs.push(nd); saveToStorage(db); return nd; };
export const updateDukuh = async (id: number, d: any) => { const i = db.dukuhs.findIndex(du => du.id === id); if(i>-1) db.dukuhs[i] = { ...db.dukuhs[i], ...d }; saveToStorage(db); return db.dukuhs[i]; };
export const deleteDukuh = async (id: number) => { db.dukuhs = db.dukuhs.filter(du => du.id !== id); saveToStorage(db); };
export const createRT = async (d: any) => { const nr = { ...d, id: db.rts.length + 1 }; db.rts.push(nr); saveToStorage(db); return nr; };
export const updateRT = async (id: number, d: any) => { const i = db.rts.findIndex(r => r.id === id); if(i>-1) db.rts[i] = { ...db.rts[i], ...d }; saveToStorage(db); return db.rts[i]; };
export const deleteRT = async (id: number) => { db.rts = db.rts.filter(r => r.id !== id); saveToStorage(db); };
export const deleteTransaksi = async (id: string) => { db.transactions = db.transactions.filter(t => t.id !== id); saveToStorage(db); };
export const createPengeluaran = async (d: any) => { const ne = { ...d, id: 'exp' + Date.now() }; db.pengeluarans.push(ne); saveToStorage(db); return ne; };
export const updatePengeluaran = async (id: string, d: any) => { const i = db.pengeluarans.findIndex(e => e.id === id); if(i>-1) db.pengeluarans[i] = { ...db.pengeluarans[i], ...d }; saveToStorage(db); return db.pengeluarans[i]; };
export const deletePengeluaran = async (id: string) => { db.pengeluarans = db.pengeluarans.filter(e => e.id !== id); saveToStorage(db); };
export const getMessages = async () => [];
export const markMessageAsRead = async (id: string) => {};
export const deleteMessage = async (id: string) => {};
export const sendMessage = async (d: any) => {};
export const getAnnouncements = async () => [];
export const createAnnouncement = async (d: any) => {};
export const updateAnnouncement = async (id: string, d: any) => {};
export const deleteAnnouncement = async (id: string) => {};
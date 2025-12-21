
import type { Warga, Petugas, Admin, Transaksi, Dukuh, RT, Pengeluaran, ContactMessage, Announcement, PublicStats, ParticipationStats, TransactionStatus } from '@/types';

// --- Mock Database ---
let dukuhs: Dukuh[] = [
    { id: 1, name: 'Rowosari' },
    { id: 2, name: 'Pencar' },
    { id: 3, name: 'Paten' },
    { id: 4, name: 'Adiloko' },
];

let rts: RT[] = [];
for (let i = 1; i <= 10; i++) {
    rts.push({ id: i, number: i < 10 ? `0${i}` : `${i}` });
}

const dummyNames = [
    "Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Eko Prasetyo",
    "Rina Wulandari", "Joko Susilo", "Sri Wahyuni", "Ahmad Fauzi", "Nurhayati"
];

let wargas: Warga[] = [];
dukuhs.forEach(dukuh => {
    const activeRTs = rts.slice(0, 5); 
    activeRTs.forEach(rt => {
        for (let i = 1; i <= 3; i++) {
            const uniqueId = String(100000 + wargas.length);
            wargas.push({
                id: uniqueId,
                name: dummyNames[wargas.length % dummyNames.length],
                rtId: rt.id,
                dukuhId: dukuh.id,
                dailyFee: 2000,
                totalDebt: Math.random() > 0.8 ? 10000 : 0 
            });
        }
    });
});

let petugases: Petugas[] = [
    { id: 'petugas01', name: 'Agus', phone: '081234567890', pin: '1234' },
    { id: 'petugas02', name: 'Bambang', phone: '081234567891', pin: '5678' },
];

let admins: Admin[] = [
    { id: 'admin01', username: 'admin', name: 'Admin Desa' },
];

let adminPassword = 'password';
let transactions: Transaksi[] = [];
let pengeluarans: Pengeluaran[] = [];

// Store untuk Jadwal (Agar bisa diedit)
let villageSchedule: Record<string, number[] | 'libur'> = { 
    Senin: [1], 
    Selasa: [2], 
    Rabu: [3], 
    Kamis: [4], 
    Jumat: 'libur', 
    Sabtu: [1], 
    Minggu: [2] 
};

// --- Dummy Data Generator ---
const generateDummyTransactions = () => {
    const now = new Date();
    for (let i = 180; i >= 0; i--) { // 6 bulan data
        const date = new Date();
        date.setDate(now.getDate() - i);
        if (date.getDay() === 5) continue; 
        const activeWargas = wargas.filter(() => Math.random() > 0.3);
        activeWargas.forEach(warga => {
            const hour = Math.floor(Math.random() * 4) + 7;
            const timestamp = new Date(date);
            timestamp.setHours(hour, Math.floor(Math.random() * 60), 0);
            transactions.push({
                id: `tx-dummy-${i}-${warga.id}`,
                timestamp: timestamp,
                wargaId: warga.id,
                petugasId: petugases[Math.floor(Math.random() * petugases.length)].id,
                amount: warga.dailyFee,
                status: 'LUNAS',
                category: 'IURAN'
            });
        });
        if (date.getDay() === 1) {
            pengeluarans.push({
                id: `exp-dummy-${i}`,
                date: new Date(date),
                description: i % 2 === 0 ? 'Bensin Motor Tossa' : 'Servis Rutin Kendaraan',
                amount: i % 2 === 0 ? 45000 : 150000
            });
        }
    }
};

generateDummyTransactions();

// --- API Implementation ---

export const getWargaById = async (id: string): Promise<Warga | null> => wargas.find(w => w.id === id) || null;
export const getAllWarga = async (): Promise<Warga[]> => [...wargas];
export const updateWarga = async (id: string, data: Warga): Promise<Warga> => {
    const idx = wargas.findIndex(w => w.id === id);
    if (idx > -1) { wargas[idx] = data; return wargas[idx]; }
    throw new Error('Not found');
};
export const createWarga = async (d: Omit<Warga, 'id' | 'totalDebt'>): Promise<Warga> => {
    const nw: Warga = { ...d, id: String(100000 + wargas.length), totalDebt: 0 };
    wargas.push(nw); return nw;
};
export const bulkCreateWarga = async (list: Omit<Warga, 'id' | 'totalDebt'>[]): Promise<void> => {
    list.forEach(d => {
        const nw: Warga = { ...d, id: String(100000 + wargas.length), totalDebt: 0 };
        wargas.push(nw);
    });
};
export const deleteWarga = async (id: string) => { wargas = wargas.filter(w => w.id !== id); };
export const getAllPetugas = async (): Promise<Petugas[]> => [...petugases];
export const loginPetugas = async (pin: string): Promise<Petugas | null> => petugases.find(p => p.pin === pin) || null;
export const createPetugas = async (data: Omit<Petugas, 'id'>): Promise<Petugas> => {
    const newPetugas = { ...data, id: `petugas${Date.now()}` };
    petugases.push(newPetugas);
    return newPetugas;
};
export const updatePetugas = async (id: string, data: Partial<Petugas>): Promise<Petugas> => {
    const idx = petugases.findIndex(p => p.id === id);
    if (idx > -1) { petugases[idx] = { ...petugases[idx], ...data }; return petugases[idx]; }
    throw new Error('Not found');
};
export const deletePetugas = async (id: string) => { petugases = petugases.filter(p => p.id !== id); };
export const loginAdmin = async (u: string, p: string): Promise<Admin | null> => (u === 'admin' && p === adminPassword) ? admins[0] : null;
export const getAllDukuh = async (): Promise<Dukuh[]> => [...dukuhs];
export const getDukuhById = (id: number) => dukuhs.find(d => d.id === id) || null;
export const createDukuh = async (data: Omit<Dukuh, 'id'>): Promise<Dukuh> => {
    const nextId = dukuhs.length > 0 ? Math.max(...dukuhs.map(d => d.id)) + 1 : 1;
    const newDukuh = { ...data, id: nextId };
    dukuhs.push(newDukuh); return newDukuh;
};
export const updateDukuh = async (id: number, data: Partial<Dukuh>): Promise<Dukuh> => {
    const idx = dukuhs.findIndex(d => d.id === id);
    if (idx > -1) { dukuhs[idx] = { ...dukuhs[idx], ...data }; return dukuhs[idx]; }
    throw new Error('Not found');
};
export const deleteDukuh = async (id: number) => { dukuhs = dukuhs.filter(d => d.id !== id); };
export const getAllRT = async (): Promise<RT[]> => [...rts];
export const getRTById = (id: number) => rts.find(r => r.id === id) || null;
export const createRT = async (data: Omit<RT, 'id'>): Promise<RT> => {
    const nextId = rts.length > 0 ? Math.max(...rts.map(r => r.id)) + 1 : 1;
    const newRT = { ...data, id: nextId };
    rts.push(newRT); return newRT;
};
export const updateRT = async (id: number, data: Partial<RT>): Promise<RT> => {
    const idx = rts.findIndex(r => r.id === id);
    if (idx > -1) { rts[idx] = { ...rts[idx], ...data }; return rts[idx]; }
    throw new Error('Not found');
};
export const deleteRT = async (id: number) => { rts = rts.filter(r => r.id !== id); };
export const createTransaksi = async (txData: any): Promise<Transaksi> => {
    const newTx: Transaksi = { ...txData, id: `tx${Date.now()}`, timestamp: new Date(), category: 'IURAN' };
    transactions.unshift(newTx); return newTx;
};
export const payDebt = async (wargaId: string, petugasId: string, amount: number): Promise<Transaksi> => {
    const warga = wargas.find(w => w.id === wargaId);
    if (warga) warga.totalDebt -= amount;
    const newTx: Transaksi = { id: `tx-p-${Date.now()}`, timestamp: new Date(), wargaId, petugasId, amount, status: 'LUNAS', category: 'TUNGGAKAN' };
    transactions.unshift(newTx); return newTx;
};
export const deleteTransaksi = async (id: string) => { transactions = transactions.filter(t => t.id !== id); };
export const getTransactionsByWargaId = async (wargaId: string, limit?: number): Promise<Transaksi[]> => {
    let list = transactions.filter(t => t.wargaId === wargaId);
    if (limit) list = list.slice(0, limit);
    return list;
};

export const getReports = async (f: { startDate: Date, endDate: Date }): Promise<any[]> => {
    const start = new Date(f.startDate); start.setHours(0,0,0,0);
    const end = new Date(f.endDate); end.setHours(23,59,59,999);
    return transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= start && txDate <= end;
    }).map(tx => {
        const w = wargas.find(w => w.id === tx.wargaId);
        return {
            ...tx,
            wargaName: w?.name || 'Warga Terhapus',
            petugasName: petugases.find(p => p.id === tx.petugasId)?.name || 'Sistem',
            dukuhName: dukuhs.find(d => d.id === w?.dukuhId)?.name || '-',
            rtNumber: rts.find(r => r.id === w?.rtId)?.number || '-'
        };
    });
};

export const getAdminDashboardStats = async () => {
    const totalRevenue = transactions.filter(tx => tx.status === 'LUNAS').reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebt = wargas.reduce((sum, w) => sum + (w.totalDebt || 0), 0);
    const totalExpense = pengeluarans.reduce((sum, p) => sum + p.amount, 0);
    return {
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense,
        totalWarga: wargas.length,
        totalDebt
    };
};

export const getPublicDashboardStats = async (): Promise<PublicStats> => {
    const now = new Date();
    const thisMonthTx = transactions.filter(tx => tx.status === 'LUNAS' && new Date(tx.timestamp).getMonth() === now.getMonth());
    return {
        totalWarga: wargas.length,
        totalTransaksiBulanIni: thisMonthTx.length,
        totalDanaTerkumpulBulanIni: thisMonthTx.reduce((s, t) => s + t.amount, 0)
    };
};

export const getDetailedPublicTransparency = async (year: number) => {
    const dukuhStats = dukuhs.map(d => {
        const total = transactions
            .filter(tx => {
                const w = wargas.find(w => w.id === tx.wargaId);
                return w?.dukuhId === d.id && new Date(tx.timestamp).getFullYear() === year;
            })
            .reduce((s, t) => s + t.amount, 0);
        return { name: d.name, total };
    });

    const monthlyStats = [];
    for (let m = 0; m < 12; m++) {
        const date = new Date(year, m, 1);
        const income = transactions.filter(tx => new Date(tx.timestamp).getMonth() === m && new Date(tx.timestamp).getFullYear() === year).reduce((s, t) => s + t.amount, 0);
        const expense = pengeluarans.filter(p => new Date(p.date).getMonth() === m && new Date(p.date).getFullYear() === year).reduce((s, p) => s + p.amount, 0);
        monthlyStats.push({
            monthName: date.toLocaleString('id-ID', { month: 'long' }),
            income,
            expense,
            balance: income - expense
        });
    }

    const totalRevenue = transactions.filter(tx => new Date(tx.timestamp).getFullYear() === year).reduce((s, t) => s + t.amount, 0);
    const totalExpense = pengeluarans.filter(p => new Date(p.date).getFullYear() === year).reduce((s, p) => s + p.amount, 0);

    return {
        dukuhStats,
        monthlyStats,
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense
    };
};

export const getPengeluaran = async (f: { startDate: Date, endDate: Date }) => {
    const start = new Date(f.startDate); start.setHours(0,0,0,0);
    const end = new Date(f.endDate); end.setHours(23,59,59,999);
    return pengeluarans.filter(p => {
        const d = new Date(p.date);
        return d >= start && d <= end;
    });
};

export const createPengeluaran = async (data: Omit<Pengeluaran, 'id'>): Promise<Pengeluaran> => {
    const newP = { ...data, id: `exp${Date.now()}` };
    pengeluarans.push(newP); return newP;
};
export const updatePengeluaran = async (id: string, data: Partial<Pengeluaran>): Promise<Pengeluaran> => {
    const idx = pengeluarans.findIndex(p => p.id === id);
    if (idx > -1) { pengeluarans[idx] = { ...pengeluarans[idx], ...data }; return pengeluarans[idx]; }
    throw new Error('Not found');
};
export const deletePengeluaran = async (id: string) => { pengeluarans = pengeluarans.filter(p => p.id !== id); };

// IMPLEMENTASI UPDATE JADWAL
export const updateSchedule = async (day: string, s: any) => {
    villageSchedule[day] = s;
    return villageSchedule;
}; 

export const getSchedule = async () => ({ ...villageSchedule });

export const getScheduleForToday = async () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];
    const todaySched = villageSchedule[todayName];
    
    if (todaySched === 'libur' || (Array.isArray(todaySched) && todaySched.length === 0)) {
        return { isHoliday: true, dukuhIds: [], dukuhNames: [] };
    }

    const dukuhIds = Array.isArray(todaySched) ? todaySched : [];
    const dukuhNames = dukuhIds.map(id => dukuhs.find(d => d.id === id)?.name || 'N/A');

    return { isHoliday: false, dukuhIds, dukuhNames };
};

export const checkIfWargaPaidToday = async (id: string) => transactions.some(tx => tx.wargaId === id && new Date(tx.timestamp).toDateString() === new Date().toDateString());
export const getUnpaidWargaForToday = async () => wargas.filter(w => !transactions.some(tx => tx.wargaId === w.id && new Date(tx.timestamp).toDateString() === new Date().toDateString()));
export const getPetugasDailySummary = async (id: string) => {
    const today = new Date().toDateString();
    const txs = transactions.filter(t => t.petugasId === id && new Date(t.timestamp).toDateString() === today);
    return { total: txs.reduce((s, t) => s + t.amount, 0), count: txs.length };
};
export const getMessages = async () => [];
export const sendMessage = async (d: any) => {};
export const markMessageAsRead = async (id: string) => {};
export const deleteMessage = async (id: string) => {};
export const getAnnouncements = async () => [];
export const getActiveAnnouncements = async () => [];
export const createAnnouncement = async (d: any) => {};
export const updateAnnouncement = async (id: string, d: any) => {};
export const deleteAnnouncement = async (id: string) => {};
export const updateAdminProfile = async (id: string, n: string, p?: string) => ({ id, name: n, username: 'admin' });
export const updatePetugasProfile = async (id: string, n: string, ph: string, pi: string) => ({ id, name: n, phone: ph, pin: pi });
export const getRTByIdSync = (id: number) => rts.find(r => r.id === id);
export const getDukuhByIdSync = (id: number) => dukuhs.find(d => d.id === id);

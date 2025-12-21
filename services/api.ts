
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
    "Rina Wulandari", "Joko Susilo", "Sri Wahyuni", "Ahmad Fauzi", "Nurhayati",
    "Heri Purwanto", "Indah Sari", "Teguh Widodo", "Fitri Handayani", "Wahyu Hidayat",
    "Yuni Kartika", "Dian Purnomo", "Anisa Fitria", "Bayu Nugroho", "Ratna Juwita"
];

let wargas: Warga[] = [];
dukuhs.forEach(dukuh => {
    const activeRTs = rts.slice(0, 5); 
    activeRTs.forEach(rt => {
        for (let i = 1; i <= 3; i++) {
            const uniqueId = String(100000 + wargas.length);
            const dailyFee = 2000;
            wargas.push({
                id: uniqueId,
                name: dummyNames[wargas.length % dummyNames.length],
                rtId: rt.id,
                dukuhId: dukuh.id,
                dailyFee: dailyFee,
                totalDebt: Math.random() > 0.8 ? dailyFee * Math.floor(Math.random() * 5) : 0 
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

let schedule: Record<string, number[] | 'libur'> = {
    Senin: [1, 2], Selasa: [4, 3], Rabu: [1, 2], Kamis: [4, 3], Jumat: 'libur', Sabtu: [1, 2], Minggu: [4, 3],
};

let messages: ContactMessage[] = [];
let announcements: Announcement[] = [];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Warga API ---

export const getWargaById = async (id: string): Promise<Warga | null> => {
    await delay(200);
    return wargas.find(w => w.id === id) || null;
};

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

export const deleteWarga = async (id: string) => { wargas = wargas.filter(w => w.id !== id); };

// --- Petugas API ---

export const getAllPetugas = async (): Promise<Petugas[]> => [...petugases];

export const loginPetugas = async (pin: string): Promise<Petugas | null> => petugases.find(p => p.pin === pin) || null;

export const createPetugas = async (data: Omit<Petugas, 'id'>): Promise<Petugas> => {
    const newPetugas = { ...data, id: `petugas${Date.now()}` };
    petugases.push(newPetugas);
    return newPetugas;
};

export const updatePetugas = async (id: string, data: Partial<Petugas>): Promise<Petugas> => {
    const idx = petugases.findIndex(p => p.id === id);
    if (idx > -1) {
        petugases[idx] = { ...petugases[idx], ...data };
        return petugases[idx];
    }
    throw new Error('Petugas not found');
};

export const updatePetugasProfile = async (id: string, name: string, phone: string, pin: string): Promise<Petugas> => {
    return updatePetugas(id, { name, phone, pin });
};

export const deletePetugas = async (id: string) => {
    petugases = petugases.filter(p => p.id !== id);
};

// --- Admin API ---

export const loginAdmin = async (u: string, p: string): Promise<Admin | null> => (u === 'admin' && p === adminPassword) ? admins[0] : null;

export const updateAdminProfile = async (id: string, name: string, password?: string): Promise<Admin> => {
    const idx = admins.findIndex(a => a.id === id);
    if (idx > -1) {
        admins[idx].name = name;
        if (password) adminPassword = password;
        return admins[idx];
    }
    throw new Error('Admin not found');
};

// --- Dukuh & RT API ---

export const getAllDukuh = async (): Promise<Dukuh[]> => [...dukuhs];
export const getDukuhById = (id: number) => dukuhs.find(d => d.id === id) || null;

export const createDukuh = async (data: Omit<Dukuh, 'id'>): Promise<Dukuh> => {
    const newDukuh = { ...data, id: dukuhs.length + 1 };
    dukuhs.push(newDukuh);
    return newDukuh;
};

export const updateDukuh = async (id: number, data: Partial<Dukuh>): Promise<Dukuh> => {
    const idx = dukuhs.findIndex(d => d.id === id);
    if (idx > -1) {
        dukuhs[idx] = { ...dukuhs[idx], ...data };
        return dukuhs[idx];
    }
    throw new Error('Dukuh not found');
};

export const deleteDukuh = async (id: number) => {
    dukuhs = dukuhs.filter(d => d.id !== id);
};

export const getAllRT = async (): Promise<RT[]> => [...rts];
export const getRTById = (id: number) => rts.find(r => r.id === id) || null;

export const createRT = async (data: Omit<RT, 'id'>): Promise<RT> => {
    const newRT = { ...data, id: rts.length + 1 };
    rts.push(newRT);
    return newRT;
};

export const updateRT = async (id: number, data: Partial<RT>): Promise<RT> => {
    const idx = rts.findIndex(r => r.id === id);
    if (idx > -1) {
        rts[idx] = { ...rts[idx], ...data };
        return rts[idx];
    }
    throw new Error('RT not found');
};

export const deleteRT = async (id: number) => {
    rts = rts.filter(r => r.id !== id);
};

// --- Transactions API ---

export const getTransactionsByWargaId = async (wargaId: string, days: number): Promise<Transaksi[]> => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);
    return transactions.filter(tx => tx.wargaId === wargaId && tx.timestamp >= limitDate).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const createTransaksi = async (txData: {wargaId: string, petugasId: string, amount: number, status?: TransactionStatus}): Promise<Transaksi> => {
    await delay(300);
    const status = txData.status || 'LUNAS';
    const newTx: Transaksi = {
        ...txData,
        status,
        id: `tx${Date.now()}`,
        timestamp: new Date(),
    };
    
    // Update Warga Debt
    const warga = wargas.find(w => w.id === txData.wargaId);
    if (warga) {
        if (status === 'HUTANG') {
            warga.totalDebt += txData.amount;
        }
    }

    transactions.unshift(newTx);
    return newTx;
};

export const payDebt = async (wargaId: string, petugasId: string, amountToPay: number): Promise<Transaksi> => {
    await delay(300);
    const warga = wargas.find(w => w.id === wargaId);
    if (!warga) throw new Error('Warga tidak ditemukan');
    
    if (amountToPay > warga.totalDebt) {
        throw new Error('Jumlah pembayaran melebihi total tunggakan');
    }

    const newTx: Transaksi = {
        id: `tx-pay-${Date.now()}`,
        timestamp: new Date(),
        wargaId,
        petugasId,
        amount: amountToPay,
        status: 'LUNAS' // Payment for debt is recorded as LUNAS (Cash received)
    };

    warga.totalDebt -= amountToPay;
    transactions.unshift(newTx);
    return newTx;
};

export const deleteTransaksi = async (id: string) => { transactions = transactions.filter(t => t.id !== id); };

// --- Reports API ---

export const getReports = async (f: { startDate: Date, endDate: Date, dukuhId?: number, rtId?: number }): Promise<any[]> => {
    let filtered = transactions.filter(tx => tx.timestamp >= f.startDate && tx.timestamp <= f.endDate);
    
    return filtered.map(tx => {
        const w = wargas.find(w => w.id === tx.wargaId);
        const p = petugases.find(p => p.id === tx.petugasId);
        return {
            ...tx,
            wargaName: w?.name || 'N/A',
            petugasName: p?.name || 'N/A',
            dukuhName: dukuhs.find(d => d.id === w?.dukuhId)?.name || 'N/A',
            rtNumber: rts.find(r => r.id === w?.rtId)?.number || 'N/A'
        };
    }).filter(row => {
        if (f.dukuhId && row.dukuhName !== dukuhs.find(d => d.id === f.dukuhId)?.name) return false;
        if (f.rtId && row.rtNumber !== rts.find(r => r.id === f.rtId)?.number) return false;
        return true;
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
        totalPetugas: petugases.length,
        totalDebt,
        monthlyRevenue: [] // simplified
    };
};

export const getPublicDashboardStats = async (): Promise<PublicStats> => {
    const today = new Date();
    const transactionsThisMonth = transactions.filter(tx => tx.status === 'LUNAS' && tx.timestamp.getMonth() === today.getMonth());
    return {
        totalWarga: wargas.length,
        totalTransaksiBulanIni: transactionsThisMonth.length,
        totalDanaTerkumpulBulanIni: transactionsThisMonth.reduce((sum, tx) => sum + tx.amount, 0)
    };
};

export const getParticipationReport = async (m: number, y: number): Promise<ParticipationStats[]> => {
    const report: ParticipationStats[] = rts.map(rt => {
        const wargaInRT = wargas.filter(w => w.rtId === rt.id);
        const activeInRT = wargaInRT.filter(w => transactions.some(tx => tx.wargaId === w.id && tx.timestamp.getMonth() === m - 1 && tx.timestamp.getFullYear() === y));
        
        return {
            rtId: rt.id,
            rtNumber: rt.number,
            totalWarga: wargaInRT.length,
            activeWarga: activeInRT.length,
            participationRate: wargaInRT.length > 0 ? (activeInRT.length / wargaInRT.length) * 100 : 0,
            unpaidWargaList: wargaInRT.filter(w => !activeInRT.includes(w))
        };
    });
    return report;
};

// --- Pengeluaran API ---

export const getAllPengeluaran = async (): Promise<Pengeluaran[]> => [...pengeluarans];

export const getPengeluaran = async (f: { startDate: Date, endDate: Date }) => {
    return pengeluarans.filter(p => p.date >= f.startDate && p.date <= f.endDate);
};

export const createPengeluaran = async (data: Omit<Pengeluaran, 'id'>): Promise<Pengeluaran> => {
    const newP = { ...data, id: `exp${Date.now()}` };
    pengeluarans.push(newP);
    return newP;
};

export const updatePengeluaran = async (id: string, data: Partial<Pengeluaran>): Promise<Pengeluaran> => {
    const idx = pengeluarans.findIndex(p => p.id === id);
    if (idx > -1) {
        pengeluarans[idx] = { ...pengeluarans[idx], ...data };
        return pengeluarans[idx];
    }
    throw new Error('Pengeluaran not found');
};

export const deletePengeluaran = async (id: string) => {
    pengeluarans = pengeluarans.filter(p => p.id !== id);
};

// --- Schedule API ---

export const getSchedule = async () => schedule;
export const updateSchedule = async (d: string, s: any) => { schedule[d] = s; return schedule; };

export const getScheduleForToday = async () => {
    const day = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date().getDay()];
    const s = schedule[day];
    return { 
        isHoliday: s === 'libur', 
        dukuhIds: s === 'libur' ? [] : s, 
        dukuhNames: s === 'libur' ? [] : (s as number[]).map(id => dukuhs.find(d => d.id === id)?.name || '')
    };
};

export const getScheduleForDate = async (d: Date) => {
    const day = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
    const s = schedule[day];
    return { 
        isHoliday: s === 'libur', 
        dukuhNames: s === 'libur' ? [] : (s as number[]).map(id => dukuhs.find(d => d.id === id)?.name || '')
    };
};

// --- Other API ---

export const checkIfWargaPaidToday = async (id: string) => {
    const today = new Date().toDateString();
    return transactions.some(tx => tx.wargaId === id && tx.timestamp.toDateString() === today);
};

export const getUnpaidWargaForToday = async () => {
    const sched = await getScheduleForToday();
    if (sched.isHoliday) return [];
    return wargas.filter(w => sched.dukuhIds.includes(w.dukuhId) && !transactions.some(tx => tx.wargaId === w.id && tx.timestamp.toDateString() === new Date().toDateString()));
};

export const getUnpaidWargaForDate = async (d: Date) => {
    const sched = await getScheduleForDate(d);
    if (sched.isHoliday) return [];
    // simplified: just return all warga not in transactions for that date
    return wargas.filter(w => !transactions.some(tx => tx.wargaId === w.id && tx.timestamp.toDateString() === d.toDateString()));
};

export const getPetugasDailySummary = async (id: string) => {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(tx => tx.petugasId === id && tx.timestamp.toDateString() === today && tx.status === 'LUNAS');
    return { total: todayTx.reduce((s, tx) => s + tx.amount, 0), count: todayTx.length };
};

// --- Messaging API ---

export const getMessages = async () => [...messages].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

export const sendMessage = async (data: { name: string, contact: string, message: string }) => {
    const newMsg: ContactMessage = {
        ...data,
        id: `msg${Date.now()}`,
        timestamp: new Date(),
        isRead: false
    };
    messages.push(newMsg);
    return newMsg;
};

export const markMessageAsRead = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg) msg.isRead = true;
};

export const deleteMessage = async (id: string) => {
    messages = messages.filter(m => m.id !== id);
};

// --- Announcements API ---

export const getAnnouncements = async () => [...announcements].sort((a,b) => b.date.getTime() - a.date.getTime());

export const getActiveAnnouncements = async (): Promise<Announcement[]> => announcements.filter(a => a.isActive);

export const createAnnouncement = async (data: Omit<Announcement, 'id' | 'date'>) => {
    const newAnn: Announcement = {
        ...data,
        id: `ann${Date.now()}`,
        date: new Date()
    };
    announcements.push(newAnn);
    return newAnn;
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>) => {
    const idx = announcements.findIndex(a => a.id === id);
    if (idx > -1) {
        announcements[idx] = { ...announcements[idx], ...data };
        return announcements[idx];
    }
    throw new Error('Announcement not found');
};

export const deleteAnnouncement = async (id: string) => {
    announcements = announcements.filter(a => a.id !== id);
};

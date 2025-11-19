
import type { Warga, Petugas, Admin, Transaksi, Dukuh, RT, Pengeluaran, ContactMessage, Announcement, PublicStats, ParticipationStats } from '@/types';

// --- Mock Database ---
let dukuhs: Dukuh[] = [
    { id: 1, name: 'Rowosari' },
    { id: 2, name: 'Pencar' },
    { id: 3, name: 'Paten' },
    { id: 4, name: 'Adiloko' },
];

// RT sekarang adalah Master Data independent (Label RT)
let rts: RT[] = [];
for (let i = 1; i <= 10; i++) {
    rts.push({ id: i, number: i < 10 ? `0${i}` : `${i}` });
}

const dummyNames = [
    "Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Eko Prasetyo",
    "Rina Wulandari", "Joko Susilo", "Sri Wahyuni", "Ahmad Fauzi", "Nurhayati",
    "Heri Purwanto", "Indah Sari", "Teguh Widodo", "Fitri Handayani", "Wahyu Hidayat",
    "Yuni Kartika", "Dian Purnomo", "Anisa Fitria", "Bayu Nugroho", "Ratna Juwita",
    "Adi Surya", "Lina Marlina", "Rudi Hartono", "Mega Permata", "Fajar Sidik",
    "Wati Susanti", "Iwan Kusuma", "Putri Amelia", "Hendra Gunawan", "Sari Novita",
    "Dedi Supriadi", "Maya Anggraini", "Guntur Saputra", "Eva Yuliana", "Rizki Maulana",
    "Tri Utami", "Arif Rahman", "Dinda Kirana", "Bambang Irawan", "Lia Agustina",
    "Cahyo Utomo", "Nita Rosita", "Doni Setiabudi", "Ria Puspita", "Feri Irawan",
    "Winda Astuti", "Galih Prakoso", "Intan Purnama", "Hari Santoso", "Mira Lestari",
    "Jefri Setiawan", "Sinta Bella", "Kurniawan", "Tia Amelia", "Lucky Hakim",
    "Vina Andriani", "Maman Abdurahman", "Umi Kalsum", "Nanang Iskandar", "Zahra Aulia",
    "Purnomo", "Yeni Rahmawati", "Qodir Jaelani", "Xena Wati", "Yusuf Ibrahim",
    "Zulfa Hamidah", "Andika Pratama", "Bella Saphira", "Candra Wijaya", "Diah Permatasari",
    "Fahmi Idris", "Gita Gutawa", "Hilman Hariwijaya", "Ira Wibowo", "Jamal Mirdad",
    "Krisdayanti", "Lulu Tobing", "Marcell Siahaan", "Nia Ramadhani", "Onky Alexander"
];


let wargas: Warga[] = [];
// Generate warga secara acak tersebar di dukuh dan RT yang ada
dukuhs.forEach(dukuh => {
    // Ambil subset RT acak untuk dukuh ini (misal setiap dukuh punya RT 01-05)
    const activeRTs = rts.slice(0, 5); 
    activeRTs.forEach(rt => {
        for (let i = 1; i <= 3; i++) { // 3 Warga per RT
            const uniqueId = String(100000 + wargas.length);
            const dailyFee = 2000 + Math.floor(Math.random() * 7) * 500; // Fee between 2000-5000
            wargas.push({
                id: uniqueId,
                name: dummyNames[wargas.length] || `Warga Cadangan ${wargas.length + 1}`,
                rtId: rt.id,
                dukuhId: dukuh.id,
                dailyFee: dailyFee,
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

// Password Mock for Admin (Not secure in frontend, just for demo)
let adminPassword = 'password';

let transactions: Transaksi[] = [];
// Create 40 recent sample transactions
for (let i = 0; i < 40; i++) {
    const wargaIndex = Math.floor(Math.random() * wargas.length);
    const warga = wargas[wargaIndex];
    const petugas = petugases[i % 2]; // Alternate between the two petugas
    transactions.push({
        id: `tx${Date.now()}${i}`,
        timestamp: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 14)), // transactions in the last 14 days
        wargaId: warga.id,
        petugasId: petugas.id,
        amount: warga.dailyFee,
    });
}
// Generate some historical data for chart
for (let i = 0; i < 200; i++) {
    const wargaIndex = Math.floor(Math.random() * wargas.length);
    const warga = wargas[wargaIndex];
    const petugas = petugases[i % 2];
    const date = new Date();
    date.setDate(date.getDate() - (15 + Math.floor(Math.random() * 180))); // 15 to 195 days ago
    transactions.push({
        id: `tx-hist-${Date.now()}${i}`,
        timestamp: date,
        wargaId: warga.id,
        petugasId: petugas.id,
        amount: warga.dailyFee,
    });
}


let pengeluarans: Pengeluaran[] = [
    { id: 'peng01', date: new Date(new Date().setDate(new Date().getDate() - 2)), description: 'Gaji Petugas Agus - Bulan Ini', amount: 1500000 },
    { id: 'peng02', date: new Date(new Date().setDate(new Date().getDate() - 2)), description: 'Gaji Petugas Bambang - Bulan Ini', amount: 1500000 },
    { id: 'peng03', date: new Date(new Date().setDate(new Date().getDate() - 5)), description: 'Beli Bensin Motor Sampah', amount: 100000 },
    { id: 'peng04', date: new Date(new Date().setDate(new Date().getDate() - 10)), description: 'Perbaikan Ban Motor Sampah', amount: 75000 },
    { id: 'peng05', date: new Date(new Date().setMonth(new Date().getMonth() - 1)), description: 'Beli Karung Sampah', amount: 50000 },
];

let schedule: Record<string, number[] | 'libur'> = {
    Senin: [1, 2], // Rowosari, Pencar
    Selasa: [4, 3], // Adiloko, Paten
    Rabu: [1, 2],
    Kamis: [4, 3],
    Jumat: 'libur',
    Sabtu: [1, 2],
    Minggu: [4, 3],
};

let messages: ContactMessage[] = [
    {
        id: 'msg1',
        name: 'Slamet Riyadi',
        contact: '081234567890',
        message: 'Mohon info apakah hari libur tetap ada pengambilan sampah? Terima kasih.',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        isRead: false
    },
    {
        id: 'msg2',
        name: 'Ibu Ani',
        contact: 'ani@email.com',
        message: 'Saya ingin mendaftar layanan sampah, bagaimana caranya ya?',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 3)),
        isRead: true
    }
];

let announcements: Announcement[] = [
    {
        id: 'ann1',
        title: 'Libur Hari Raya',
        content: 'Pengambilan sampah akan diliburkan selama 2 hari pada tanggal 10-11 April dalam rangka Hari Raya Idul Fitri.',
        isActive: true,
        date: new Date()
    },
    {
        id: 'ann2',
        title: 'Himbauan Pemilahan Sampah',
        content: 'Mohon warga memisahkan sampah organik dan anorganik sebelum dibuang.',
        isActive: true,
        date: new Date(Date.now() - 86400000 * 5)
    }
];

// Offline Buffer Mock
let offlineTransactions: Transaksi[] = [];


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Public API ---
export const getWargaById = async (id: string): Promise<Warga | null> => {
    await delay(300);
    return wargas.find(w => w.id === id) || null;
};

export const getTransactionsByWargaId = async (wargaId: string, days: number): Promise<Transaksi[]> => {
    await delay(300);
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);
    return transactions.filter(tx => tx.wargaId === wargaId && tx.timestamp >= limitDate).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getPublicDashboardStats = async (): Promise<PublicStats> => {
    await delay(400);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const transactionsThisMonth = transactions.filter(tx => {
        const d = new Date(tx.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    return {
        totalWarga: wargas.length,
        totalTransaksiBulanIni: transactionsThisMonth.length,
        totalDanaTerkumpulBulanIni: transactionsThisMonth.reduce((sum, tx) => sum + tx.amount, 0)
    };
};

// --- Announcement API ---
export const getAnnouncements = async (): Promise<Announcement[]> => {
    await delay(300);
    return [...announcements].sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
    await delay(300);
    return announcements.filter(a => a.isActive).sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const createAnnouncement = async (data: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> => {
    await delay(300);
    const newAnnouncement: Announcement = {
        ...data,
        id: `ann${Date.now()}`,
        date: new Date()
    };
    announcements.unshift(newAnnouncement);
    return newAnnouncement;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    await delay(300);
    announcements = announcements.filter(a => a.id !== id);
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
    await delay(300);
    const index = announcements.findIndex(a => a.id === id);
    if (index > -1) {
        announcements[index] = { ...announcements[index], ...data };
        return announcements[index];
    }
    throw new Error("Announcement not found");
};


// --- Contact API ---
export const sendMessage = async (data: Omit<ContactMessage, 'id' | 'timestamp' | 'isRead'>): Promise<ContactMessage> => {
    await delay(600);
    const newMessage: ContactMessage = {
        ...data,
        id: `msg${Date.now()}`,
        timestamp: new Date(),
        isRead: false
    };
    messages.unshift(newMessage);
    return newMessage;
};

export const getMessages = async (): Promise<ContactMessage[]> => {
    await delay(400);
    return [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const markMessageAsRead = async (id: string): Promise<void> => {
    await delay(200);
    const msg = messages.find(m => m.id === id);
    if (msg) msg.isRead = true;
};

export const deleteMessage = async (id: string): Promise<void> => {
    await delay(300);
    messages = messages.filter(m => m.id !== id);
};


// --- Petugas API ---
export const loginPetugas = async (pin: string): Promise<Petugas | null> => {
    await delay(500);
    return petugases.find(p => p.pin === pin) || null;
};

export const updatePetugasProfile = async (id: string, name: string, phone: string, pin: string): Promise<Petugas> => {
    await delay(400);
    const index = petugases.findIndex(p => p.id === id);
    if (index > -1) {
        petugases[index] = { ...petugases[index], name, phone, pin };
        return petugases[index];
    }
    throw new Error('Petugas not found');
};

export const checkIfWargaPaidToday = async (wargaId: string): Promise<boolean> => {
    await delay(100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasPaid = transactions.some(tx => {
        if (tx.wargaId !== wargaId) return false;
        const txDate = new Date(tx.timestamp);
        txDate.setHours(0, 0, 0, 0);
        return txDate.getTime() === today.getTime();
    });
    
    return hasPaid;
};

export const getUnpaidWargaForToday = async (): Promise<Warga[]> => {
    await delay(500);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[today.getDay()];
    const todaySchedule = schedule[todayName];
    
    if (todaySchedule === 'libur') {
        return [];
    }

    const paidWargaIds = new Set(
        transactions
            .filter(tx => {
                const txDate = new Date(tx.timestamp);
                txDate.setHours(0, 0, 0, 0);
                return txDate.getTime() === today.getTime();
            })
            .map(tx => tx.wargaId)
    );

    const allUnpaidWarga = wargas.filter(warga => !paidWargaIds.has(warga.id));
    
    const scheduledUnpaidWarga = allUnpaidWarga.filter(warga => 
        todaySchedule.includes(warga.dukuhId)
    );

    return scheduledUnpaidWarga;
};

export const getPetugasDailySummary = async (petugasId: string): Promise<{ total: number, count: number }> => {
    await delay(400);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyTx = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        txDate.setHours(0,0,0,0);
        return tx.petugasId === petugasId && txDate.getTime() === today.getTime();
    });
    
    // Also check offline buffer if strictly simulating
    // In a real app, we would query IndexedDB or localStorage
    
    const total = dailyTx.reduce((sum, tx) => sum + tx.amount, 0);
    const count = new Set(dailyTx.map(tx => tx.wargaId)).size;
    return { total, count };
};

export const createTransaksi = async (txData: {wargaId: string, petugasId: string, amount: number}): Promise<Transaksi> => {
    // Check connectivity
    if (!navigator.onLine) {
         const newTx: Transaksi = {
            ...txData,
            id: `offline_${Date.now()}`,
            timestamp: new Date(),
        };
        offlineTransactions.push(newTx);
        // In real app: localStorage.setItem('offline_tx', JSON.stringify(offlineTransactions));
        return newTx;
    }

    await delay(500);
    
    const hasPaidToday = await checkIfWargaPaidToday(txData.wargaId);
    if (hasPaidToday) {
        throw new Error('Warga ini sudah membayar hari ini.');
    }

    const newTx: Transaksi = {
        ...txData,
        id: `tx${Date.now()}`,
        timestamp: new Date(),
    };
    transactions.unshift(newTx);
    return newTx;
};


// --- Admin API ---
export const loginAdmin = async (username: string, password: string): Promise<Admin | null> => {
    await delay(500);
    if (username === 'admin' && password === adminPassword) {
        return admins[0];
    }
    return null;
};

export const updateAdminProfile = async (id: string, name: string, password?: string): Promise<Admin> => {
    await delay(400);
    if (admins[0].id === id) {
        admins[0].name = name;
        if (password) {
            adminPassword = password;
        }
        return admins[0];
    }
    throw new Error('Admin not found');
};

export const getAdminDashboardStats = async () => {
    await delay(600);
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = pengeluarans.reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenueData: { [key: string]: number } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
        const date = new Date(sixMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(-2)}`;
        monthlyRevenueData[key] = 0;
    }
    
    transactions.forEach(tx => {
        if (tx.timestamp >= sixMonthsAgo) {
            const key = `${tx.timestamp.toLocaleString('default', { month: 'short' })} ${tx.timestamp.getFullYear().toString().slice(-2)}`;
            if(monthlyRevenueData.hasOwnProperty(key)) {
                monthlyRevenueData[key] += tx.amount;
            }
        }
    });

    const monthlyRevenue = Object.entries(monthlyRevenueData).map(([name, pemasukan]) => ({ name, pemasukan }));

    return {
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense,
        totalWarga: wargas.length,
        totalPetugas: petugases.length,
        monthlyRevenue,
    };
};

export const getAllWarga = async (): Promise<Warga[]> => { await delay(200); return [...wargas]; };
export const createWarga = async (wargaData: Omit<Warga, 'id'>): Promise<Warga> => {
    await delay(300);
    // Generate random ID if not provided (for imports)
    const newWarga: Warga = { 
        ...wargaData, 
        id: String(Math.floor(100000 + Math.random() * 900000)) 
    };
    wargas.push(newWarga);
    return newWarga;
};
export const updateWarga = async (id: string, wargaData: Warga): Promise<Warga> => {
    await delay(300);
    const index = wargas.findIndex(w => w.id === id);
    if (index > -1) { wargas[index] = wargaData; return wargas[index]; }
    throw new Error('Warga not found');
};
export const deleteWarga = async (id: string): Promise<void> => {
    await delay(300);
    wargas = wargas.filter(w => w.id !== id);
};

export const getAllPetugas = async (): Promise<Petugas[]> => { await delay(200); return [...petugases]; };
export const createPetugas = async (petugasData: Omit<Petugas, 'id'>): Promise<Petugas> => {
    await delay(300);
    const newPetugas: Petugas = { ...petugasData, id: `petugas${Date.now()}` };
    petugases.push(newPetugas);
    return newPetugas;
};
export const updatePetugas = async (id: string, petugasData: Petugas): Promise<Petugas> => {
    await delay(300);
    const index = petugases.findIndex(p => p.id === id);
    if (index > -1) { petugases[index] = petugasData; return petugases[index]; }
    throw new Error('Petugas not found');
};
export const deletePetugas = async (id: string): Promise<void> => {
    await delay(300);
    petugases = petugases.filter(p => p.id !== id);
};

export const getAllDukuh = async (): Promise<Dukuh[]> => { await delay(100); return [...dukuhs]; };
export const getDukuhById = (id: number): Dukuh | null => dukuhs.find(d => d.id === id) || null;
export const createDukuh = async (dukuhData: Omit<Dukuh, 'id'>): Promise<Dukuh> => {
    await delay(300);
    const newDukuh: Dukuh = { ...dukuhData, id: dukuhs.length > 0 ? Math.max(...dukuhs.map(d => d.id)) + 1 : 1 };
    dukuhs.push(newDukuh);
    return newDukuh;
};
export const updateDukuh = async (id: number, dukuhData: Dukuh): Promise<Dukuh> => {
    await delay(300);
    const index = dukuhs.findIndex(d => d.id === id);
    if (index > -1) { dukuhs[index] = dukuhData; return dukuhs[index]; }
    throw new Error('Dukuh not found');
};
export const deleteDukuh = async (id: number): Promise<void> => {
    await delay(300);
    // Note: When deleting a Dukuh, we might need to check if any Warga refers to it,
    // but we don't need to delete RTs anymore since RTs are independent.
    wargas = wargas.filter(w => w.dukuhId !== id); 
    dukuhs = dukuhs.filter(d => d.id !== id);
};

export const getAllRT = async (): Promise<RT[]> => { await delay(100); return [...rts]; };
export const getRTById = (id: number): RT | null => rts.find(r => r.id === id) || null;
export const createRT = async (rtData: Omit<RT, 'id'>): Promise<RT> => {
    await delay(300);
    const newRT: RT = { ...rtData, id: rts.length > 0 ? Math.max(...rts.map(r => r.id)) + 1 : 1 };
    rts.push(newRT);
    return newRT;
};
export const updateRT = async (id: number, rtData: RT): Promise<RT> => {
    await delay(300);
    const index = rts.findIndex(r => r.id === id);
    if (index > -1) { rts[index] = rtData; return rts[index]; }
    throw new Error('RT not found');
};
export const deleteRT = async (id: number): Promise<void> => {
    await delay(300);
    wargas = wargas.filter(w => w.rtId !== id);
    rts = rts.filter(r => r.id !== id);
};

// --- Pengeluaran API ---
export const getAllPengeluaran = async (): Promise<Pengeluaran[]> => { await delay(200); return [...pengeluarans]; };
export const getPengeluaran = async (filters: { startDate?: Date; endDate?: Date; }): Promise<Pengeluaran[]> => {
    await delay(200);
    let tempPengeluaran = [...pengeluarans];

    if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        tempPengeluaran = tempPengeluaran.filter(p => new Date(p.date) >= start);
    }
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        tempPengeluaran = tempPengeluaran.filter(p => new Date(p.date) <= end);
    }
    
    return tempPengeluaran.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
export const createPengeluaran = async (pengeluaranData: Omit<Pengeluaran, 'id' | 'date'> & { date: Date }): Promise<Pengeluaran> => {
    await delay(300);
    const newPengeluaran: Pengeluaran = { ...pengeluaranData, id: `peng${Date.now()}` };
    pengeluarans.unshift(newPengeluaran);
    return newPengeluaran;
};
export const updatePengeluaran = async (id: string, pengeluaranData: Pengeluaran): Promise<Pengeluaran> => {
    await delay(300);
    const index = pengeluarans.findIndex(p => p.id === id);
    if (index > -1) { pengeluarans[index] = pengeluaranData; return pengeluarans[index]; }
    throw new Error('Pengeluaran not found');
};
export const deletePengeluaran = async (id: string): Promise<void> => {
    await delay(300);
    pengeluarans = pengeluarans.filter(p => p.id !== id);
};


// --- Reports API ---
interface ReportFilters { startDate?: Date; endDate?: Date; dukuhId?: number; rtId?: number; }
interface ReportRow extends Transaksi { wargaName: string; petugasName: string; dukuhName: string; rtNumber: string; }

export const getReports = async (filters: ReportFilters): Promise<ReportRow[]> => {
    await delay(700);
    let tempTransactions = [...transactions];

    if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        tempTransactions = tempTransactions.filter(tx => tx.timestamp >= start);
    }
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        tempTransactions = tempTransactions.filter(tx => tx.timestamp <= end);
    }

    const reportRows = tempTransactions.map(tx => {
        const warga = wargas.find(w => w.id === tx.wargaId);
        const petugas = petugases.find(p => p.id === tx.petugasId);
        const rt = rts.find(r => r.id === warga?.rtId);
        const dukuh = dukuhs.find(d => d.id === warga?.dukuhId);
        return {
            ...tx,
            wargaName: warga?.name || 'N/A',
            petugasName: petugas?.name || 'N/A',
            dukuhName: dukuh?.name || 'N/A',
            rtNumber: rt?.number || 'N/A',
            _warga: warga
        };
    });

    let finalReport = reportRows;
    if (filters.dukuhId) {
        finalReport = finalReport.filter(row => row._warga?.dukuhId === filters.dukuhId);
    }
    if (filters.rtId) {
        finalReport = finalReport.filter(row => row._warga?.rtId === filters.rtId);
    }
    
    return finalReport.map(({ _warga, ...rest }) => rest).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getParticipationReport = async (month: number, year: number): Promise<ParticipationStats[]> => {
    await delay(600);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Get all transactions for the period
    const periodTransactions = transactions.filter(tx => {
        const tDate = new Date(tx.timestamp);
        return tDate >= startDate && tDate <= endDate;
    });

    // 2. Get Set of Warga IDs who have paid
    const paidWargaIds = new Set(periodTransactions.map(tx => tx.wargaId));

    // 3. Group Stats by RT
    const statsMap = new Map<number, ParticipationStats>();

    // Initialize entries for all known RTs (even if no wargas in them yet, though strictly we rely on existing wargas)
    // Better: Iterate through all Wargas and aggregate.

    for (const warga of wargas) {
        if (!statsMap.has(warga.rtId)) {
            const rt = rts.find(r => r.id === warga.rtId);
            statsMap.set(warga.rtId, {
                rtId: warga.rtId,
                rtNumber: rt ? rt.number : '?',
                totalWarga: 0,
                activeWarga: 0,
                participationRate: 0,
                unpaidWargaList: []
            });
        }

        const stat = statsMap.get(warga.rtId)!;
        stat.totalWarga++;

        if (paidWargaIds.has(warga.id)) {
            stat.activeWarga++;
        } else {
            stat.unpaidWargaList.push(warga);
        }
    }

    // Calculate percentages
    const result = Array.from(statsMap.values()).map(stat => {
        stat.participationRate = stat.totalWarga > 0 ? (stat.activeWarga / stat.totalWarga) * 100 : 0;
        return stat;
    });

    // Sort by RT Number for display
    return result.sort((a, b) => a.rtNumber.localeCompare(b.rtNumber));
};

export const deleteTransaksi = async (id: string): Promise<void> => {
    await delay(300);
    transactions = transactions.filter(t => t.id !== id);
};


// --- Settings API ---
export const getSchedule = async (): Promise<typeof schedule> => {
    await delay(200);
    return { ...schedule };
};

export const updateSchedule = async (day: string, newSchedule: number[] | 'libur'): Promise<typeof schedule> => {
    await delay(300);
    if (day in schedule) {
        schedule[day as keyof typeof schedule] = newSchedule;
        return { ...schedule };
    }
    throw new Error('Invalid day provided');
};

export const getScheduleForDate = async (date: Date): Promise<{ isHoliday: boolean, dukuhIds: number[], dukuhNames: string[] }> => {
    await delay(100);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[date.getDay()];
    const daySchedule = schedule[dayName];

    if (daySchedule === 'libur') {
        return { isHoliday: true, dukuhIds: [], dukuhNames: [] };
    }

    const scheduledDukuhNames = daySchedule.map(dukuhId => {
        const dukuh = dukuhs.find(d => d.id === dukuhId);
        return dukuh ? dukuh.name : '';
    }).filter(name => name);

    return { isHoliday: false, dukuhIds: daySchedule, dukuhNames: scheduledDukuhNames };
};


export const getUnpaidWargaForDate = async (date: Date): Promise<Warga[]> => {
    await delay(500);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const scheduleForDate = await getScheduleForDate(targetDate);
    if (scheduleForDate.isHoliday) {
        return [];
    }

    const paidWargaIds = new Set(
        transactions
            .filter(tx => {
                const txDate = new Date(tx.timestamp);
                txDate.setHours(0, 0, 0, 0);
                return txDate.getTime() === targetDate.getTime();
            })
            .map(tx => tx.wargaId)
    );

    const scheduledWarga = wargas.filter(warga =>
        scheduleForDate.dukuhIds.includes(warga.dukuhId)
    );

    const unpaidWarga = scheduledWarga.filter(warga => !paidWargaIds.has(warga.id));
    
    return unpaidWarga;
};


export const getScheduleForToday = async (): Promise<{ isHoliday: boolean, dukuhIds: number[], dukuhNames: string[] }> => {
    await delay(100);
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[today.getDay()];
    const todaySchedule = schedule[todayName];

    if (todaySchedule === 'libur') {
        return { isHoliday: true, dukuhIds: [], dukuhNames: [] };
    }

    const scheduledDukuhNames = todaySchedule.map(dukuhId => {
        const dukuh = dukuhs.find(d => d.id === dukuhId);
        return dukuh ? dukuh.name : '';
    }).filter(name => name);

    return { isHoliday: false, dukuhIds: todaySchedule, dukuhNames: scheduledDukuhNames };
};
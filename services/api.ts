
// --- SERVICES/API.TS (LOCAL VERSION) ---
// This file is now optimized for the Local Portainer environment.
// It talks to our Express backend instead of Supabase.

const API_URL = '/api'; // Relative to the same host

async function fetchLocal(endpoint: string, options: any = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Server Error');
    }
    return res.json();
}

// --- AUTHENTICATION ---

export const loginPetugas = async (pin: string) => {
    return fetchLocal('/login/petugas', {
        method: 'POST',
        body: JSON.stringify({ pin })
    });
};

export const loginAdmin = async (pin: string) => {
    // In local mode, we route admin same as petugas but different table logic in backend
    return fetchLocal('/login/admin', {
        method: 'POST',
        body: JSON.stringify({ pin })
    });
};

// --- DATA MASTER ---

export const getAllWarga = async () => fetchLocal('/data/wargas');
export const getWargaById = async (id: string) => fetchLocal(`/data/wargas/${id}`);
export const createWarga = async (data: any) => fetchLocal('/data/wargas', { method: 'POST', body: JSON.stringify(data) });
export const bulkCreateWarga = async (wargas: any[]) => {
    // For now, handle bulk by looping or a dedicated endpoint
    // Let's assume the backend can handle an array if we want, 
    // but for now let's just make it call the API
    return fetchLocal('/data/wargas/bulk', { method: 'POST', body: JSON.stringify(wargas) });
};
export const updateWarga = async (id: string, data: any) => fetchLocal(`/data/wargas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWarga = async (id: string) => fetchLocal(`/data/wargas/${id}`, { method: 'DELETE' });

export const getAllPetugas = async () => fetchLocal('/data/petugases');
export const createPetugas = async (data: any) => fetchLocal('/data/petugases', { method: 'POST', body: JSON.stringify(data) });
export const updatePetugas = async (id: string, data: any) => fetchLocal(`/data/petugases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePetugas = async (id: string) => fetchLocal(`/data/petugases/${id}`, { method: 'DELETE' });

// --- DATA WILAYAH ---

export const getAllDukuh = async () => fetchLocal('/data/dukuhs');
export const createDukuh = async (data: any) => fetchLocal('/data/dukuhs', { method: 'POST', body: JSON.stringify(data) });
export const updateDukuh = async (id: number, data: any) => fetchLocal(`/data/dukuhs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDukuh = async (id: number) => fetchLocal(`/data/dukuhs/${id}`, { method: 'DELETE' });

export const getAllRT = async () => fetchLocal('/data/rts');
export const createRT = async (data: any) => fetchLocal('/data/rts', { method: 'POST', body: JSON.stringify(data) });
export const updateRT = async (id: number, data: any) => fetchLocal(`/data/rts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRT = async (id: number) => fetchLocal(`/data/rts/${id}`, { method: 'DELETE' });

// --- TRANSAKSI ---

export const createTransaksi = async (data: any) => fetchLocal('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const deleteTransaksi = async (id: string) => fetchLocal(`/transactions/${id}`, { method: 'DELETE' });
export const getReports = async (filter: any) => fetchLocal('/reports', { method: 'POST', body: JSON.stringify(filter) });
export const checkIfWargaPaidToday = async (wargaId: string) => fetchLocal(`/check-payment/${wargaId}`);
export const getWargaTodayTransaction = async (wargaId: string) => fetchLocal(`/transactions/today/${wargaId}`);
export const getTransactionsByWargaId = async (wargaId: string) => fetchLocal(`/transactions/warga/${wargaId}`);

// --- KEUANGAN & DASHBOARD ---

export const getAdminDashboardStats = async () => fetchLocal('/stats/admin');
export const getPublicDashboardStats = async () => fetchLocal('/stats/public');
export const getPetugasDailySummary = async (petugasId: string) => fetchLocal(`/stats/petugas/${petugasId}`);
export const getDetailedPublicTransparency = async (year: number) => fetchLocal(`/stats/transparency/${year}`);

// --- ANNOUNCEMENTS ---

export const getAnnouncements = async () => fetchLocal('/announcements');
export const getActiveAnnouncements = async () => fetchLocal('/announcements/active');
export const createAnnouncement = async (data: any) => fetchLocal('/announcements', { method: 'POST', body: JSON.stringify(data) });
export const updateAnnouncement = async (id: string, data: any) => fetchLocal(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAnnouncement = async (id: string) => fetchLocal(`/announcements/${id}`, { method: 'DELETE' });

// --- MESSAGES ---

export const sendMessage = async (data: any) => fetchLocal('/messages', { method: 'POST', body: JSON.stringify(data) });
export const getMessages = async () => fetchLocal('/messages');
export const markMessageAsRead = async (id: string) => fetchLocal(`/messages/${id}/read`, { method: 'POST' });
export const deleteMessage = async (id: string) => fetchLocal(`/messages/${id}`, { method: 'DELETE' });

// --- OPERATIONAL ---

export const payDebt = async (wargaId: string, petugasId: string, amount: number) => fetchLocal('/pay-debt', { method: 'POST', body: JSON.stringify({ wargaId, petugasId, amount }) });
export const convertDebtToPaidToday = async (wargaId: string) => fetchLocal(`/convert-debt/${wargaId}`, { method: 'POST' });
export const markDayAsSkipped = async (dukuhIds: number[]) => fetchLocal('/mark-skipped', { method: 'POST', body: JSON.stringify({ dukuhIds }) });
export const getUnpaidWargaForToday = async () => fetchLocal('/unpaid-today');

// --- PENGELUARAN ---

export const getPengeluaran = async (filter: any) => fetchLocal('/pengeluaran', { method: 'POST', body: JSON.stringify(filter) });
export const createPengeluaran = async (data: any) => fetchLocal('/pengeluaran', { method: 'POST', body: JSON.stringify(data) });
export const updatePengeluaran = async (id: string, data: any) => fetchLocal(`/pengeluaran/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePengeluaran = async (id: string) => fetchLocal(`/pengeluaran/${id}`, { method: 'DELETE' });

// --- JADWAL & OPERATIONAL ---

export const getSchedule = async () => fetchLocal('/schedule');
export const getScheduleForToday = async () => fetchLocal('/schedule/today');
export const updateSchedule = async (day: string, dukuhIds: any) => fetchLocal('/schedule', { method: 'POST', body: JSON.stringify({ day, dukuhIds }) });

// --- PROFILE & SETTINGS ---

export const updateAdminProfile = async (id: string, name: string, pin?: string) => fetchLocal('/profile/admin', { method: 'POST', body: JSON.stringify({ id, name, pin }) });
export const updatePetugasProfile = async (id: string, name: string, phone: string, pin: string) => fetchLocal('/profile/petugas', { method: 'POST', body: JSON.stringify({ id, name, phone, pin }) });

export const getVillageProfile = async () => fetchLocal('/village-profile');
export const updateVillageProfile = async (data: any) => fetchLocal('/village-profile', { method: 'POST', body: JSON.stringify(data) });

// --- BACKUP & RESTORE ---

export const exportFullBackup = async () => {
    // When in local mode, we might just call a special export endpoint
    return fetchLocal('/backup');
};

export const importFullBackup = async (data: any) => {
    return fetchLocal('/restore', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// ... (Functions are mapped to the new Express backend)

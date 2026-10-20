
// --- SERVICES/API.TS (LOCAL VERSION) ---
// This file is now optimized for the Local Portainer environment.
// It talks to our Express backend instead of Supabase.

    // API_URL normalization
    let base = import.meta.env.VITE_API_URL;
    
    // Check for stringified objects or nulls from build environment
    const rawBase = String(base);
    if (!base || rawBase === 'undefined' || rawBase === 'null' || rawBase === '[object Object]') {
        base = '';
    }
    
    // If no absolute URL is provided, detect context
    if (!base && typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If we're at a subpath, we might need more logic, 
        // but typically /api is safest for same-origin
        base = origin + '/api'; 
    } else if (base && typeof base === 'string' && !base.endsWith('/api') && !base.endsWith('/api/')) {
        // If an absolute URL is provided but lacks /api prefix
        base = base.endsWith('/') ? base + 'api' : base + '/api';
    }
    const API_URL = base || '/api';

// --- TOKEN LOGIN ---
// Token diterbitkan server saat login dan disimpan di sessionStorage.
// Semua request API (selain endpoint publik) wajib menyertakannya.
const getAuthToken = (): string | null => {
    try { return sessionStorage.getItem('auth_token'); } catch { return null; }
};
const storeAuthToken = (data: any) => {
    if (data && data.token) {
        try { sessionStorage.setItem('auth_token', data.token); } catch {}
    }
};
const clearAuthSession = () => {
    try {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('admin');
        sessionStorage.removeItem('petugas');
    } catch {}
};

async function fetchLocal(endpoint: string, options: any = {}) {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Construct full URL with normalization to avoid double slashes
    let fullUrl = `${API_URL}${cleanEndpoint}`;
    if (API_URL.endsWith('/') && cleanEndpoint.startsWith('/')) {
        fullUrl = API_URL + cleanEndpoint.substring(1);
    }

    const token = getAuthToken();
    console.log(`[API] Fetching: ${options.method || 'GET'} ${fullUrl}`);
    try {
        const res = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        });

        if (!res.ok) {
            // Token hangus/ditolak: bersihkan sesi agar pengguna diarahkan login ulang
            if (res.status === 401 && token && !cleanEndpoint.startsWith('/login/')) {
                clearAuthSession();
            }
            const error = await res.json().catch(() => ({ message: 'Server Error' }));
            throw new Error(error.message || error.error || `Server Error (${res.status})`);
        }

        const data = await res.json();
        
        // Automatic Date Parsing Helper
        const dateReviver = (val: any): any => {
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                return new Date(val);
            }
            if (Array.isArray(val)) return val.map(dateReviver);
            if (val !== null && typeof val === 'object') {
                const newVal: any = {};
                for (const key in val) {
                    newVal[key] = dateReviver(val[key]);
                }
                return newVal;
            }
            return val;
        };

        return dateReviver(data);
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            console.error(`Network Error: Gagal menghubungkan ke ${fullUrl}. Pastikan server aktif dan URL benar.`);
        }
        throw e;
    }
}

// --- AUTHENTICATION ---

export const loginPetugas = async (pin: string) => {
    const data = await fetchLocal('/login/petugas', {
        method: 'POST',
        body: JSON.stringify({ pin })
    });
    storeAuthToken(data);
    return data;
};

export const loginAdmin = async (pin: string) => {
    // In local mode, we route admin same as petugas but different table logic in backend
    const data = await fetchLocal('/login/admin', {
        method: 'POST',
        body: JSON.stringify({ pin })
    });
    storeAuthToken(data);
    return data;
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
export const bulkDeleteWarga = async (ids: string[]) => fetchLocal('/data/wargas/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });

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
export const getWargaStatus = async (wargaId: string) => fetchLocal(`/warga-status/${wargaId}`);
export const getMonthlyPaymentStatus = async (wargaId: string) => fetchLocal(`/monthly-status/${wargaId}`);

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
export const convertDebtToPaidToday = async (wargaId: string, petugasId?: string) => fetchLocal(`/convert-debt/${wargaId}`, { method: 'POST', body: JSON.stringify({ petugasId }) });
export const createPartialPayment = async (data: { wargaId: string; petugasId: string; amountPaid: number; tarif: number; category?: string }) => fetchLocal('/transactions/partial', { method: 'POST', body: JSON.stringify(data) });
export const markDayAsSkipped = async (dukuhIds: number[]) => fetchLocal('/mark-skipped', { method: 'POST', body: JSON.stringify({ dukuhIds }) });
export const getUnpaidWargaForToday = async () => fetchLocal('/unpaid-today');

// --- PENGELUARAN ---

export const getPengeluaran = async (filter?: any) => fetchLocal('/pengeluaran/filter', { method: 'POST', body: JSON.stringify(filter || {}) });
export const createPengeluaran = async (data: any) => fetchLocal('/pengeluaran', { method: 'POST', body: JSON.stringify(data) });
export const updatePengeluaran = async (id: string, data: any) => fetchLocal(`/pengeluaran/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePengeluaran = async (id: string) => fetchLocal(`/pengeluaran/${id}`, { method: 'DELETE' });

// --- PEMASUKAN LAIN (NON-IURAN) ---

export const getPemasukanLain = async (filter?: any) => fetchLocal('/pemasukan-lain/filter', { method: 'POST', body: JSON.stringify(filter || {}) });
export const createPemasukanLain = async (data: any) => fetchLocal('/pemasukan-lain', { method: 'POST', body: JSON.stringify(data) });
export const updatePemasukanLain = async (id: string, data: any) => fetchLocal(`/pemasukan-lain/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePemasukanLain = async (id: string) => fetchLocal(`/pemasukan-lain/${id}`, { method: 'DELETE' });

// --- JADWAL & OPERATIONAL ---

export const getSchedule = async () => fetchLocal('/schedule');
export const getScheduleForToday = async () => fetchLocal('/schedule/today');
export const updateSchedule = async (day: string, dukuhIds: any) => fetchLocal('/schedule', { method: 'POST', body: JSON.stringify({ day, dukuhIds }) });

// --- PROFILE & SETTINGS ---

export const updateAdminProfile = async (id: string, name: string, pin?: string) => fetchLocal('/profile/admin', { method: 'POST', body: JSON.stringify({ id, name, pin }) });
export const updatePetugasProfile = async (id: string, name: string, phone: string, pin: string) => fetchLocal('/profile/petugas', { method: 'POST', body: JSON.stringify({ id, name, phone, pin }) });

export const getVillageProfile = async () => fetchLocal('/village-profile');
export const updateVillageProfile = async (data: any) => fetchLocal('/village-profile', { method: 'POST', body: JSON.stringify(data) });

export const uploadLogoFile = async (file: File, type: 'logo_app' | 'logo_horizontal') => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('type', type);

    const cleanEndpoint = '/upload-logo-single';
    const fullUrl = API_URL.endsWith('/') ? `${API_URL.slice(0, -1)}${cleanEndpoint}` : `${API_URL}${cleanEndpoint}`;
    
    console.log(`[API] Uploading logo: POST ${fullUrl} (${type})`);
    const uploadToken = getAuthToken();
    const res = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        headers: {
            ...(uploadToken ? { 'Authorization': `Bearer ${uploadToken}` } : {})
        },
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengunggah logo');
    }
    return res.json();
};

export const removeLogo = async (type: 'logo_app' | 'logo_horizontal') => {
    return fetchLocal(`/remove-logo/${type}`, { method: 'DELETE' });
};

// --- BACKUP & RESTORE ---

export const exportFullBackup = async () => {
    // When in local mode, we might just call a special export endpoint
    return fetchLocal('/backup');
};

export const recalculateDebt = async () => fetchLocal('/admin/recalculate-debt', { method: 'POST' });

export const importFullBackup = async (data: any) => {
    return fetchLocal('/restore', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

// ... (Functions are mapped to the new Express backend)


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
export const createWarga = async (data: any) => fetchLocal('/data/wargas', { method: 'POST', body: JSON.stringify(data) });
export const updateWarga = async (id: string, data: any) => fetchLocal(`/data/wargas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWarga = async (id: string) => fetchLocal(`/data/wargas/${id}`, { method: 'DELETE' });

export const getAllPetugas = async () => fetchLocal('/data/petugases');
export const createPetugas = async (data: any) => fetchLocal('/data/petugases', { method: 'POST', body: JSON.stringify(data) });

export const getAllDukuh = async () => fetchLocal('/data/dukuhs');
export const getAllRT = async () => fetchLocal('/data/rts');

// --- TRANSAKSI ---

export const createTransaksi = async (data: any) => fetchLocal('/transactions', { method: 'POST', body: JSON.stringify(data) });
export const getReports = async (filter: any) => fetchLocal('/reports', { method: 'POST', body: JSON.stringify(filter) });

// --- SETTINGS & PROFILE ---

export const getVillageProfile = async () => fetchLocal('/village-profile');
export const updateVillageProfile = async (data: any) => fetchLocal('/village-profile', { method: 'POST', body: JSON.stringify(data) });

export const getSchedule = async () => fetchLocal('/schedule');
export const updateSchedule = async (day: string, dukuhIds: any) => fetchLocal('/schedule', { method: 'POST', body: JSON.stringify({ day, dukuhIds }) });

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

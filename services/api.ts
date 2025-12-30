
import { supabase } from '@/lib/supabase';
import type { Warga, Petugas, Admin, Transaksi, Dukuh, RT, Pengeluaran, PublicStats, Announcement, ContactMessage } from '@/types';

// --- AUTHENTICATION ---

export const loginPetugas = async (pin: string): Promise<Petugas | null> => {
    const { data, error } = await supabase
        .from('petugases')
        .select('*')
        .eq('pin', pin)
        .single();
    if (error) return null;
    return data as Petugas;
};

export const loginAdmin = async (pin: string): Promise<Admin | null> => {
    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('pin', pin)
        .single();
    if (error) return null;
    return data as Admin;
};

// --- DATA MASTER: WARGA ---

export const getAllWarga = async (): Promise<Warga[]> => {
    const { data, error } = await supabase
        .from('wargas')
        .select('*')
        .order('name', { ascending: true });
    if (error) return [];
    return data as Warga[];
};

export const getWargaById = async (id: string): Promise<Warga | null> => {
    const { data, error } = await supabase
        .from('wargas')
        .select('*')
        .eq('id', id)
        .single();
    if (error) return null;
    return data as Warga;
};

export const createWarga = async (wargaData: Omit<Warga, 'id' | 'totalDebt'>) => {
    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const { data, error } = await supabase
        .from('wargas')
        .insert([{ ...wargaData, id: newId, totalDebt: 0 }])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const bulkCreateWarga = async (wargas: Omit<Warga, 'id' | 'totalDebt'>[]) => {
    // Generate IDs with better collision handling
    const payload = wargas.map(w => ({
        ...w,
        id: String(Math.floor(100000 + Math.random() * 900000)),
        totalDebt: 0
    }));
    
    const { error } = await supabase.from('wargas').insert(payload);
    
    if (error) {
        console.error("Supabase bulk insert full error:", error);
        let msg = error.message;
        // Penanganan kode error PostgreSQL yang spesifik
        if (error.code === '23503') {
            msg = "Gagal: Salah satu Kode Dukuh atau Kode RT tidak terdaftar di sistem. Harap cek menu Data Wilayah.";
        } else if (error.code === '23505') {
            msg = "Gagal: Terjadi duplikasi ID sistem secara acak. Silakan coba impor kembali dalam beberapa saat.";
        } else if (error.code === '42P01') {
            msg = "Gagal: Tabel database 'wargas' tidak ditemukan. Harap jalankan script SQL di Supabase.";
        }
        throw new Error(msg);
    }
};

export const updateWarga = async (id: string, wargaData: Partial<Warga>) => {
    const { data, error } = await supabase
        .from('wargas')
        .update(wargaData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteWarga = async (id: string) => {
    const { error } = await supabase.from('wargas').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// --- DATA MASTER: PETUGAS ---

export const getAllPetugas = async (): Promise<Petugas[]> => {
    const { data, error } = await supabase.from('petugases').select('*').order('name', { ascending: true });
    return (data as Petugas[]) || [];
};

export const createPetugas = async (p: Omit<Petugas, 'id'>) => {
    const id = `pt${Date.now()}`;
    const { data, error } = await supabase.from('petugases').insert([{ ...p, id }]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updatePetugas = async (id: string, p: Partial<Petugas>) => {
    const { data, error } = await supabase.from('petugases').update(p).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deletePetugas = async (id: string) => {
    await supabase.from('petugases').delete().eq('id', id);
};

// --- TRANSAKSI ---

export const createTransaksi = async (txData: Omit<Transaksi, 'id' | 'timestamp'>): Promise<Transaksi | null> => {
    const txId = `tx${Date.now()}`;
    const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...txData, id: txId, timestamp: new Date().toISOString() }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Jika transaksi adalah HUTANG, tambahkan ke saldo hutang warga
    if (txData.status === 'HUTANG') {
        const { data: warga } = await supabase.from('wargas').select('totalDebt').eq('id', txData.wargaId).single();
        if (warga) {
            await supabase.from('wargas').update({ totalDebt: (warga.totalDebt || 0) + txData.amount }).eq('id', txData.wargaId);
        }
    }
    return data ? { ...data, timestamp: new Date(data.timestamp) } : null;
};

export const deleteTransaksi = async (id: string) => {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (tx && tx.status === 'HUTANG') {
        const { data: warga } = await supabase.from('wargas').select('totalDebt').eq('id', tx.wargaId).single();
        if (warga) {
            await supabase.from('wargas').update({ totalDebt: Math.max(0, (warga.totalDebt || 0) - tx.amount) }).eq('id', tx.wargaId);
        }
    }
    await supabase.from('transactions').delete().eq('id', id);
};

export const getTransactionsByWargaId = async (wargaId: string, limit: number = 10): Promise<Transaksi[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wargaId', wargaId)
        .order('timestamp', { ascending: false })
        .limit(limit);
    if (error) return [];
    return (data || []).map(tx => ({ ...tx, timestamp: new Date(tx.timestamp) }));
};

export const checkIfWargaPaidToday = async (wargaId: string): Promise<boolean> => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('wargaId', wargaId)
        .eq('status', 'LUNAS')
        .gte('timestamp', today.toISOString())
        .limit(1);
    return (data && data.length > 0) || false;
};

export const getWargaTodayTransaction = async (wargaId: string): Promise<Transaksi | null> => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('wargaId', wargaId)
        .gte('timestamp', today.toISOString())
        .limit(1);
    
    const tx = data && data.length > 0 ? data[0] : null;
    return tx ? { ...tx, timestamp: new Date(tx.timestamp) } : null;
};

export const convertDebtToPaidToday = async (wargaId: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('wargaId', wargaId)
        .eq('status', 'HUTANG')
        .gte('timestamp', today.toISOString())
        .limit(1);
    
    const tx = txs && txs.length > 0 ? txs[0] : null;
    if (tx) {
        await supabase.from('transactions').update({ status: 'LUNAS' }).eq('id', tx.id);
        const { data: warga } = await supabase.from('wargas').select('totalDebt').eq('id', wargaId).single();
        if (warga) {
            await supabase.from('wargas').update({ totalDebt: Math.max(0, (warga.totalDebt || 0) - tx.amount) }).eq('id', wargaId);
        }
    }
};

export const payDebt = async (wargaId: string, petugasId: string, amount: number) => {
    const txId = `tx${Date.now()}`;
    await supabase.from('transactions').insert([{
        id: txId,
        wargaId,
        petugasId,
        amount,
        status: 'LUNAS',
        category: 'TUNGGAKAN',
        timestamp: new Date().toISOString()
    }]);
    const { data: warga } = await supabase.from('wargas').select('totalDebt').eq('id', wargaId).single();
    if (warga) {
        await supabase.from('wargas').update({ totalDebt: Math.max(0, (warga.totalDebt || 0) - amount) }).eq('id', wargaId);
    }
};

export const getReports = async (f: { startDate: Date, endDate: Date }): Promise<any[]> => {
    const end = new Date(f.endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            wargas (name, dukuhId, rtId),
            petugases (name)
        `)
        .gte('timestamp', f.startDate.toISOString())
        .lte('timestamp', end.toISOString());

    if (error) return [];

    const dukuhs = await getAllDukuh();
    const rts = await getAllRT();

    return data.map(tx => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
        wargaName: tx.wargas?.name || 'Warga Terhapus',
        petugasName: tx.petugases?.name || (tx.petugasId === 'SYSTEM' ? 'Sistem Otomatis' : 'Petugas Terhapus'),
        dukuhName: dukuhs.find(d => d.id === tx.wargas?.dukuhId)?.name || 'N/A',
        rtNumber: rts.find(r => r.id === tx.wargas?.rtId)?.number || 'N/A'
    }));
};

// --- KEUANGAN ---

export const getAdminDashboardStats = async () => {
    const { data: income } = await supabase.from('transactions').select('amount').eq('status', 'LUNAS');
    const { data: expense } = await supabase.from('pengeluarans').select('amount');
    const { data: wargas } = await supabase.from('wargas').select('totalDebt');

    const totalRevenue = (income || []).reduce((s, i) => s + i.amount, 0);
    const totalExpense = (expense || []).reduce((s, i) => s + i.amount, 0);
    const totalDebt = (wargas || []).reduce((s, w) => s + (w.totalDebt || 0), 0);

    return {
        totalRevenue,
        totalExpense,
        balance: totalRevenue - totalExpense,
        totalWarga: wargas?.length || 0,
        totalDebt
    };
};

export const getPublicDashboardStats = async (): Promise<PublicStats> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: txs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'LUNAS')
        .gte('timestamp', startOfMonth);
    
    const { data: allWarga } = await supabase.from('wargas').select('id');

    return {
        totalWarga: allWarga?.length || 0,
        totalTransaksiBulanIni: txs?.length || 0,
        totalDanaTerkumpulBulanIni: (txs || []).reduce((s, i) => s + i.amount, 0)
    };
};

export const getPetugasDailySummary = async (petugasId: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data } = await supabase
        .from('transactions')
        .select('amount')
        .eq('petugasId', petugasId)
        .eq('status', 'LUNAS')
        .gte('timestamp', today.toISOString());
    const total = (data || []).reduce((s, i) => s + i.amount, 0);
    return { total, count: data?.length || 0 };
};

// --- PENGELUARAN ---

export const getPengeluaran = async (f: { startDate: Date, endDate: Date }): Promise<Pengeluaran[]> => {
    const { data } = await supabase
        .from('pengeluarans')
        .select('*')
        .gte('date', f.startDate.toISOString().split('T')[0])
        .lte('date', f.endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
    return (data || []).map(e => ({ ...e, date: new Date(e.date) }));
};

export const createPengeluaran = async (p: Omit<Pengeluaran, 'id'>) => {
    const id = `exp${Date.now()}`;
    const { data, error } = await supabase.from('pengeluarans').insert([{ ...p, id, date: p.date.toISOString().split('T')[0] }]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updatePengeluaran = async (id: string, p: Partial<Pengeluaran>) => {
    const payload = { ...p };
    if (p.date) payload.date = p.date.toISOString().split('T')[0] as any;
    const { data, error } = await supabase.from('pengeluarans').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deletePengeluaran = async (id: string) => {
    await supabase.from('pengeluarans').delete().eq('id', id);
};

// --- DATA WILAYAH ---

export const getAllDukuh = async (): Promise<Dukuh[]> => {
    const { data } = await supabase.from('dukuhs').select('*').order('name', { ascending: true });
    return (data as Dukuh[]) || [];
};

export const getDukuhById = async (id: number): Promise<Dukuh | null> => {
    const { data } = await supabase.from('dukuhs').select('*').eq('id', id).single();
    return (data as Dukuh) || null;
};

export const createDukuh = async (d: Omit<Dukuh, 'id'>) => {
    const { data, error } = await supabase.from('dukuhs').insert([d]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateDukuh = async (id: number, d: Partial<Dukuh>) => {
    const { data, error } = await supabase.from('dukuhs').update(d).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteDukuh = async (id: number) => {
    await supabase.from('dukuhs').delete().eq('id', id);
};

export const getAllRT = async (): Promise<RT[]> => {
    const { data } = await supabase.from('rts').select('*').order('number', { ascending: true });
    return (data as RT[]) || [];
};

export const getRTById = async (id: number): Promise<RT | null> => {
    const { data } = await supabase.from('rts').select('*').eq('id', id).single();
    return (data as RT) || null;
};

export const createRT = async (r: Omit<RT, 'id'>) => {
    const { data, error } = await supabase.from('rts').insert([r]).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateRT = async (id: number, r: Partial<RT>) => {
    const { data, error } = await supabase.from('rts').update(r).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const deleteRT = async (id: number) => {
    await supabase.from('rts').delete().eq('id', id);
};

// --- MESSAGES ---

export const sendMessage = async (m: Omit<ContactMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const id = `msg${Date.now()}`;
    const { error } = await supabase.from('contact_messages').insert([{ ...m, id, timestamp: new Date().toISOString(), isRead: false }]);
    if (error) throw new Error(error.message);
};

export const getMessages = async (): Promise<ContactMessage[]> => {
    const { data } = await supabase.from('contact_messages').select('*').order('timestamp', { ascending: false });
    return (data || []).map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
};

export const markMessageAsRead = async (id: string) => {
    await supabase.from('contact_messages').update({ isRead: true }).eq('id', id);
};

export const deleteMessage = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
};

// --- ANNOUNCEMENTS ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false });
    return (data || []).map(a => ({ ...a, date: new Date(a.date) }));
};

export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await supabase.from('announcements').select('*').eq('isActive', true).order('date', { ascending: false });
    return (data || []).map(a => ({ ...a, date: new Date(a.date) }));
};

export const createAnnouncement = async (a: Omit<Announcement, 'id' | 'date'>) => {
    const id = `ann${Date.now()}`;
    await supabase.from('announcements').insert([{ ...a, id, date: new Date().toISOString() }]);
};

export const updateAnnouncement = async (id: string, a: Partial<Announcement>) => {
    await supabase.from('announcements').update(a).eq('id', id);
};

export const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
};

// --- PROFILE ---

export const updateAdminProfile = async (id: string, name: string, pin?: string) => {
    const payload: any = { name };
    if (pin) payload.pin = pin;
    const { data, error } = await supabase.from('admins').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

export const updatePetugasProfile = async (id: string, name: string, phone: string, pin: string) => {
    const { data, error } = await supabase.from('petugases').update({ name, phone, pin }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
};

// --- JADWAL & OPERATIONAL ---

export const getSchedule = async () => {
    const { data } = await supabase.from('schedules').select('*');
    const result: any = {};
    (data || []).forEach(row => {
        result[row.day] = row.dukuhIds;
    });
    return result;
};

export const getScheduleForToday = async () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[new Date().getDay()];
    const { data } = await supabase.from('schedules').select('*').eq('day', todayName).single();
    
    if (!data || data.dukuhIds === 'libur' || !data.dukuhIds.length) {
        return { isHoliday: true, dukuhIds: [], dukuhNames: [] };
    }
    
    const dukuhs = await getAllDukuh();
    const names = data.dukuhIds.map((id: number) => dukuhs.find(d => d.id === id)?.name || 'Dukuh Tak Dikenal');
    return { isHoliday: false, dukuhIds: data.dukuhIds, dukuhNames: names };
};

export const updateSchedule = async (day: string, dukuhIds: number[] | 'libur') => {
    const { error } = await supabase.from('schedules').upsert([{ day, dukuhIds }]);
    if (error) throw new Error(error.message);
};

export const markDayAsSkipped = async (dukuhIds: number[]) => {
    const { data: wargas } = await supabase.from('wargas').select('*').in('dukuhId', dukuhIds);
    if (wargas) {
        for (const w of wargas) {
            await createTransaksi({
                wargaId: w.id,
                petugasId: 'SYSTEM',
                amount: w.dailyFee,
                status: 'HUTANG',
                category: 'IURAN'
            });
        }
    }
};

export const getUnpaidWargaForToday = async (): Promise<Warga[]> => {
    const sched = await getScheduleForToday();
    if (sched.isHoliday) return [];
    
    const { data: allWarga } = await supabase.from('wargas').select('*').in('dukuhId', sched.dukuhIds);
    if (!allWarga) return [];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data: todayTxs } = await supabase
        .from('transactions')
        .select('wargaId')
        .gte('timestamp', today.toISOString());
        
    const paidIds = new Set((todayTxs || []).map(tx => tx.wargaId));
    
    return allWarga.filter(w => !paidIds.has(w.id));
};

export const getDetailedPublicTransparency = async (year: number) => {
    const stats = await getAdminDashboardStats();
    const dukuhs = await getAllDukuh();
    
    const start = new Date(year, 0, 1).toISOString();
    const end = new Date(year, 11, 31, 23, 59, 59).toISOString();
    
    const { data: txs } = await supabase
        .from('transactions')
        .select('amount, wargaId, timestamp')
        .eq('status', 'LUNAS')
        .gte('timestamp', start)
        .lte('timestamp', end);

    const { data: wargas } = await supabase.from('wargas').select('id, dukuhId');

    const dukuhStats = dukuhs.map(d => {
        const wargaInDukuh = new Set(wargas?.filter(w => w.dukuhId === d.id).map(w => w.id));
        const total = (txs || []).filter(t => wargaInDukuh.has(t.wargaId)).reduce((s, i) => s + i.amount, 0);
        return { name: d.name, total };
    });

    const monthlyStats = Array.from({ length: 12 }).map((_, i) => {
        const monthIncome = (txs || []).filter(t => new Date(t.timestamp).getMonth() === i).reduce((s, i) => s + i.amount, 0);
        return {
            monthName: new Date(year, i).toLocaleString('id-ID', { month: 'long' }),
            income: monthIncome,
            expense: 0,
            balance: monthIncome
        };
    });

    return { ...stats, dukuhStats, monthlyStats };
};

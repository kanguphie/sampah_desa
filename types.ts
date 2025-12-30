
export interface Dukuh {
    id: number;
    name: string;
}

export interface RT {
    id: number;
    number: string;
}

export interface Warga {
    id: string; // 6-digit unique random number
    name: string;
    rtId: number;
    dukuhId: number;
    dailyFee: number;
    totalDebt: number; // Accumulated unpaid fees
}

export interface Petugas {
    id: string;
    name: string;
    phone: string;
    pin: string; // 4-6 digit PIN
}

export interface Admin {
    id: string;
    username: string;
    name: string;
    pin: string; // Updated to use PIN for consistency
}

export type TransactionStatus = 'LUNAS' | 'HUTANG';
export type TransactionCategory = 'IURAN' | 'TUNGGAKAN';

export interface Transaksi {
    id: string;
    timestamp: Date;
    wargaId: string;
    petugasId: string;
    amount: number;
    status: TransactionStatus;
    category?: TransactionCategory;
}

export interface Pengeluaran {
    id: string;
    date: Date;
    description: string;
    amount: number;
}

export interface ContactMessage {
    id: string;
    name: string;
    contact: string; // Email or Phone
    message: string;
    timestamp: Date;
    isRead: boolean;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
    date: Date;
}

export interface PublicStats {
    totalWarga: number;
    totalTransaksiBulanIni: number;
    totalDanaTerkumpulBulanIni: number;
}

export interface ParticipationStats {
    rtId: number;
    rtNumber: string;
    totalWarga: number;
    activeWarga: number; 
    participationRate: number; 
    unpaidWargaList: Warga[]; 
}

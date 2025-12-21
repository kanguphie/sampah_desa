
import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/services/api';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon, SparklesIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';

const StatCard: React.FC<{ title: string; value: string; icon: any; theme: string }> = ({ title, value, icon: Icon, theme }) => (
    <div className={`p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-full`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${theme}`}>
                <Icon className="text-2xl" />
            </div>
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{value}</h3>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
    const { admin } = useAuth();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        getAdminDashboardStats().then(setStats);
    }, []);

    if (!stats) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Ringkasan Desa</h1>
                <p className="text-slate-500">Selamat datang kembali, {admin?.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Pendapatan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon={CurrencyDollarIcon}
                    theme="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                    title="Total Tunggakan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalDebt)}
                    icon={BanknotesIcon}
                    theme="bg-rose-50 text-rose-600"
                />
                <StatCard 
                    title="Saldo Kas" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.balance)}
                    icon={ScaleBalancedIcon}
                    theme="bg-blue-50 text-blue-600"
                />
                <StatCard 
                    title="Total Warga" 
                    value={String(stats.totalWarga)}
                    icon={UsersIcon}
                    theme="bg-violet-50 text-violet-600"
                />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Grafik Transaksi</h3>
                <div className="h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-medium italic">
                    Visualisasi data akan tampil di sini
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

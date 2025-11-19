import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon } from '@/components/icons';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode, loading?: boolean }> = ({ title, value, icon, loading }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-5">
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-lg">
          {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? 
                <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mt-1"></div> :
                <p className="text-3xl md:text-2xl font-bold font-display text-slate-800 break-all">{value}</p>
            }
        </div>
    </div>
);


const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpense: 0,
        balance: 0,
        totalWarga: 0,
        totalPetugas: 0,
        monthlyRevenue: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAdminDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h1 className="text-3xl font-bold font-display text-slate-800">Dashboard</h1>
                <p className="mt-1 text-slate-500">Ringkasan data SapaDesa.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Pemasukan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon={<div className="p-3 bg-primary-light rounded-lg"><CurrencyDollarIcon className="text-3xl text-primary"/></div>}
                    loading={loading}
                />
                 <StatCard 
                    title="Total Pengeluaran" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalExpense)}
                    icon={<div className="p-3 bg-red-100 rounded-lg"><BanknotesIcon className="text-3xl text-red-600"/></div>}
                    loading={loading}
                />
                 <StatCard 
                    title="Saldo Akhir" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.balance)}
                    icon={<div className="p-3 bg-emerald-100 rounded-lg"><ScaleBalancedIcon className="text-3xl text-emerald-600"/></div>}
                    loading={loading}
                />
                 <StatCard 
                    title="Jumlah Warga" 
                    value={`${stats.totalWarga} Orang`}
                    icon={<div className="p-3 bg-sky-100 rounded-lg"><UsersIcon className="text-3xl text-sky-600"/></div>}
                    loading={loading}
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                <h3 className="font-bold font-display text-xl mb-1 text-slate-800">Pemasukan Bulanan</h3>
                <p className="text-slate-500 mb-6 text-sm">Grafik pemasukan retribusi per bulan.</p>
                <div style={{ width: '100%', height: 400 }}>
                    {loading ? <div className="w-full h-full bg-slate-200 rounded-lg animate-pulse"></div> : (
                        <ResponsiveContainer>
                            <BarChart data={stats.monthlyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }}/>
                                <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    formatter={(value) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value as number), 'Pemasukan']}
                                />
                                <Legend wrapperStyle={{ fontSize: '14px', color: '#334152', paddingTop: '10px' }} />
                                <Bar dataKey="pemasukan" fill="#0d9488" name="Pemasukan" radius={[6, 6, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
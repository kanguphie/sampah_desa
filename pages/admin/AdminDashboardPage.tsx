
import React, { useState, useEffect, useMemo } from 'react';
import { getAdminDashboardStats, getReports } from '@/services/api';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard: React.FC<{ title: string; value: string; icon: any; theme: string }> = ({ title, value, icon: Icon, theme }) => (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${theme}`}>
                <Icon className="text-2xl" />
            </div>
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">{value}</h3>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
    const { admin } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            const dashboardStats = await getAdminDashboardStats();
            setStats(dashboardStats);

            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 6);
            
            const reports = await getReports({ startDate: start, endDate: end });
            
            const days = [];
            for (let i = 0; i <= 6; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                const total = reports
                    .filter(r => new Date(r.timestamp).toDateString() === d.toDateString())
                    .reduce((sum, r) => sum + r.amount, 0);
                
                days.push({ name: dateStr, total });
            }
            setChartData(days);
        };
        loadDashboardData();
    }, []);

    // Memoize the chart to prevent unnecessary flickers
    const chartContent = useMemo(() => {
        if (chartData.length === 0) return null;
        return (
            <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                            dy={15}
                        />
                        <YAxis 
                            hide 
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px'}}
                            formatter={(value: number) => [`Rp${value.toLocaleString('id-ID')}`, 'Pemasukan']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorTotal)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }, [chartData]);

    if (!stats) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Menghubungkan ke Server...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ringkasan Desa</h1>
                    <p className="text-slate-500 font-medium">Selamat datang kembali, <span className="text-primary font-bold">{admin?.name}</span></p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sistem Rowosari Aktif</span>
                </div>
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
                    title="Saldo Kas Desa" 
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

            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Tren Pemasukan</h3>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Laporan 7 Hari Terakhir</p>
                    </div>
                </div>
                {chartContent || <div className="h-[350px] flex items-center justify-center text-slate-300 font-bold italic">Memuat grafik...</div>}
            </div>
        </div>
    );
};

export default AdminDashboardPage;

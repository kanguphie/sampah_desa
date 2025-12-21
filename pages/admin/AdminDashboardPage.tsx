
import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats, getReports } from '@/services/api';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
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

                // TRICK: Force a window resize event to trigger Recharts responsiveness
                // This solves the 0px width issue on initial load
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    if (!stats && loading) return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Menghubungkan Database...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ringkasan Desa</h1>
                    <p className="text-slate-500 font-medium">Sistem Informasi Pengelolaan Sampah <span className="text-primary font-bold">Desa Rowosari</span></p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Server Aktif</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Pendapatan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats?.totalRevenue || 0)}
                    icon={CurrencyDollarIcon}
                    theme="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                    title="Total Tunggakan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats?.totalDebt || 0)}
                    icon={BanknotesIcon}
                    theme="bg-rose-50 text-rose-600"
                />
                <StatCard 
                    title="Saldo Kas Desa" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats?.balance || 0)}
                    icon={ScaleBalancedIcon}
                    theme="bg-blue-50 text-blue-600"
                />
                <StatCard 
                    title="Total Warga" 
                    value={String(stats?.totalWarga || 0)}
                    icon={UsersIcon}
                    theme="bg-violet-50 text-violet-600"
                />
            </div>

            {/* Area Grafik Utama - Full Width */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <div className="mb-10 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tren Pemasukan Harian</h3>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Laporan Aktivitas 7 Hari Terakhir</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 hidden sm:block">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Status: </span>
                         <span className="text-[10px] font-black text-emerald-600 uppercase">Real-time Data</span>
                    </div>
                </div>
                
                {/* 
                    Kontainer dengan tinggi tetap wajib ada agar Recharts bisa kalkulasi dimensi. 
                    Key dinamis {chartData.length} memaksa render ulang saat data tersedia.
                */}
                <div className="h-[450px] w-full" style={{ minWidth: '100%' }}>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} key={chartData.length} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 800}} 
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}}
                                    tickFormatter={(val) => `Rp${val/1000}k`}
                                />
                                <Tooltip 
                                    cursor={{stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5'}}
                                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '20px'}}
                                    itemStyle={{fontWeight: 900, color: '#10b981', fontSize: '16px'}}
                                    labelStyle={{fontWeight: 700, color: '#64748b', marginBottom: '4px'}}
                                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pemasukan']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#10b981" 
                                    strokeWidth={5} 
                                    fillOpacity={1} 
                                    fill="url(#colorTotal)" 
                                    animationDuration={2000}
                                    animationEasing="ease-in-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <i className="fa-solid fa-chart-area text-6xl opacity-20"></i>
                            <p className="font-bold italic">Belum ada aktivitas transaksi terdeteksi</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

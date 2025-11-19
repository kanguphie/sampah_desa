
import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon, SparklesIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';

type ColorTheme = 'emerald' | 'rose' | 'blue' | 'violet';

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    loading?: boolean;
    theme: ColorTheme;
}> = ({ title, value, icon, loading, theme }) => {
    
    // Color Mapping Logic
    const themeStyles = {
        emerald: {
            bg: 'from-emerald-500/20 to-teal-500/5',
            iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
            glow: 'bg-emerald-400',
            shadow: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
            text: 'text-slate-800'
        },
        rose: {
            bg: 'from-rose-500/20 to-pink-500/5',
            iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white',
            glow: 'bg-rose-400',
            shadow: 'shadow-rose-500/20 hover:shadow-rose-500/40',
            text: 'text-slate-800'
        },
        blue: {
            bg: 'from-blue-500/20 to-indigo-500/5',
            iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
            glow: 'bg-blue-400',
            shadow: 'shadow-blue-500/20 hover:shadow-blue-500/40',
            text: 'text-slate-800'
        },
        violet: {
            bg: 'from-violet-500/20 to-purple-500/5',
            iconBg: 'bg-violet-50 text-violet-600 group-hover:bg-violet-500 group-hover:text-white',
            glow: 'bg-violet-400',
            shadow: 'shadow-violet-500/20 hover:shadow-violet-500/40',
            text: 'text-slate-800'
        }
    };

    const style = themeStyles[theme];

    return (
        <div className={`group relative overflow-hidden rounded-[2.5rem] bg-white border border-white/60 p-1 transition-all duration-500 hover:-translate-y-2 shadow-xl ${style.shadow}`}>
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl z-0"></div>
            <div className={`absolute -right-12 -top-12 h-48 w-48 rounded-full ${style.glow} blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-700`}></div>
            <div className={`absolute -left-10 -bottom-10 h-40 w-40 rounded-full ${style.glow} blur-[50px] opacity-5 group-hover:opacity-15 transition-opacity duration-700`}></div>

            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3.5 rounded-2xl transition-all duration-500 shadow-sm ${style.iconBg} ring-1 ring-black/5 group-hover:ring-transparent group-hover:scale-110 group-hover:rotate-3`}>
                        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "text-2xl" }) : icon}
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                         <SparklesIcon className="text-xs text-amber-400" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
                    </div>
                </div>
                
                <div>
                    {loading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-10 w-3/4 bg-slate-200/70 rounded-xl"></div>
                        </div>
                    ) : (
                        <h3 className={`text-2xl sm:text-3xl xl:text-2xl 2xl:text-3xl leading-tight font-extrabold tracking-tight ${style.text} break-words`} title={value}>
                            {value}
                        </h3>
                    )}
                </div>
            </div>
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { admin } = useAuth();
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat Pagi";
        if (hour < 18) return "Selamat Siang";
        return "Selamat Malam";
    };

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="relative">
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-400/20 blur-3xl rounded-full"></div>
                    <h1 className="relative text-4xl md:text-5xl font-bold font-display text-slate-800 tracking-tight">
                        {getGreeting()}, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">{admin?.name}</span>
                    </h1>
                    <p className="relative mt-3 text-slate-500 text-lg">Ringkasan aktivitas keuangan dan data terkini.</p>
                </div>
                <div className="hidden md:block">
                    <div className="glass px-6 py-3 rounded-full shadow-sm border border-white/50 flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Pemasukan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon={<CurrencyDollarIcon />}
                    loading={loading}
                    theme="emerald"
                />
                 <StatCard 
                    title="Pengeluaran" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalExpense)}
                    icon={<BanknotesIcon />}
                    loading={loading}
                    theme="rose"
                />
                 <StatCard 
                    title="Saldo Kas" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.balance)}
                    icon={<ScaleBalancedIcon />}
                    loading={loading}
                    theme="blue"
                />
                 <StatCard 
                    title="Total Warga" 
                    value={`${stats.totalWarga}`}
                    icon={<UsersIcon />}
                    loading={loading}
                    theme="violet"
                />
            </div>

            {/* Chart Section - Modern Glass */}
            <div className="relative bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-1 border border-white/60 shadow-xl shadow-slate-200/40">
                 <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent rounded-[2.5rem] pointer-events-none"></div>
                 <div className="relative z-10 p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h3 className="font-bold font-display text-2xl text-slate-800">Analitik Pemasukan</h3>
                            <p className="text-slate-500 mt-1">Tren pembayaran retribusi sampah 6 bulan terakhir.</p>
                        </div>
                        <div className="bg-slate-100/50 p-1 rounded-xl flex">
                             <button className="px-4 py-1.5 bg-white text-slate-800 shadow-sm rounded-lg text-xs font-bold">6 Bulan</button>
                             <button className="px-4 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-bold transition-colors">Tahun Ini</button>
                        </div>
                    </div>
                    
                    <div style={{ width: '100%', height: 400 }}>
                        {loading ? <div className="w-full h-full bg-slate-100/50 rounded-3xl animate-pulse"></div> : (
                            <ResponsiveContainer>
                                <AreaChart data={stats.monthlyRevenue} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} 
                                    />
                                    <Tooltip 
                                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.5)', 
                                            borderRadius: '16px', 
                                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', 
                                            padding: '12px 20px' 
                                        }}
                                        itemStyle={{ color: '#10b981', fontWeight: 700 }}
                                        labelStyle={{ color: '#334152', fontWeight: '800', marginBottom: '5px' }}
                                        formatter={(value) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value as number), 'Pemasukan']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="pemasukan" 
                                        stroke="#10b981" 
                                        strokeWidth={4}
                                        fillOpacity={1} 
                                        fill="url(#colorPemasukan)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

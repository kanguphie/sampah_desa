
import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    loading?: boolean;
    colorClass: string;
    shadowClass: string;
}> = ({ title, value, icon, loading, colorClass, shadowClass }) => (
    <div className={`relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 hover:-translate-y-2 transition-all duration-500 ease-out group ${shadowClass}`}>
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform scale-150 -translate-y-2 translate-x-2 ${colorClass}`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "text-9xl" }) : icon}
        </div>
        
        <div className="relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${colorClass} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            {loading ? 
                <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse mt-1"></div> :
                <h3 className="text-4xl font-extrabold font-display text-slate-800 tracking-tight">{value}</h3>
            }
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
            <div className={`h-full ${colorClass} w-0 group-hover:w-full transition-all duration-700 ease-out opacity-50`}></div>
        </div>
    </div>
);


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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-display text-slate-800 tracking-tight">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">{admin?.name}</span>
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg">Berikut adalah ringkasan aktivitas SapaDesa hari ini.</p>
                </div>
                <div className="hidden md:block">
                    <span className="glass-card px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Pemasukan" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon={<CurrencyDollarIcon className="text-3xl"/>}
                    loading={loading}
                    colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
                    shadowClass="shadow-emerald-500/10 hover:shadow-emerald-500/20"
                />
                 <StatCard 
                    title="Pengeluaran" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.totalExpense)}
                    icon={<BanknotesIcon className="text-3xl"/>}
                    loading={loading}
                    colorClass="bg-gradient-to-br from-rose-400 to-rose-600"
                    shadowClass="shadow-rose-500/10 hover:shadow-rose-500/20"
                />
                 <StatCard 
                    title="Saldo Kas" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.balance)}
                    icon={<ScaleBalancedIcon className="text-3xl"/>}
                    loading={loading}
                    colorClass="bg-gradient-to-br from-blue-400 to-blue-600"
                    shadowClass="shadow-blue-500/10 hover:shadow-blue-500/20"
                />
                 <StatCard 
                    title="Total Warga" 
                    value={`${stats.totalWarga}`}
                    icon={<UsersIcon className="text-3xl"/>}
                    loading={loading}
                    colorClass="bg-gradient-to-br from-violet-400 to-violet-600"
                    shadowClass="shadow-violet-500/10 hover:shadow-violet-500/20"
                />
            </div>

            <div className="glass-card p-8 rounded-3xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="font-bold font-display text-xl text-slate-800">Analitik Pemasukan</h3>
                        <p className="text-slate-500 text-sm">Tren pemasukan retribusi sampah 6 bulan terakhir.</p>
                    </div>
                    <select className="bg-white/50 border border-slate-200 text-slate-600 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none shadow-sm">
                        <option>6 Bulan Terakhir</option>
                    </select>
                </div>
                
                <div style={{ width: '100%', height: 400 }}>
                    {loading ? <div className="w-full h-full bg-slate-100/50 rounded-2xl animate-pulse"></div> : (
                        <ResponsiveContainer>
                            <BarChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} 
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px 20px' }}
                                    itemStyle={{ color: '#10b981', fontWeight: 700 }}
                                    labelStyle={{ color: '#334152', fontWeight: '800', marginBottom: '5px' }}
                                    formatter={(value) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value as number), 'Pemasukan']}
                                />
                                <Bar 
                                    dataKey="pemasukan" 
                                    fill="url(#colorPemasukan)" 
                                    radius={[8, 8, 8, 8]} 
                                    barSize={48}
                                    activeBar={{ fill: '#059669' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

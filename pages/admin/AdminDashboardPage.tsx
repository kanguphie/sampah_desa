
import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats, getReports } from '@/services/api';
import { UsersIcon, CurrencyDollarIcon, BanknotesIcon, ScaleBalancedIcon, ChartBarIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    const [isChartReady, setIsChartReady] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Ambil Statistik Utama
                const dashboardStats = await getAdminDashboardStats();
                setStats(dashboardStats);

                // 2. Ambil Data 7 Hari Terakhir untuk Grafik
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                
                const reports = await getReports({ startDate: start, endDate: end });
                
                const days = [];
                for (let i = 0; i <= 6; i++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);
                    
                    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                    
                    // Bandingkan dengan format string toDateString untuk keamanan
                    const dayTotal = reports
                        .filter(r => {
                            const rDate = new Date(r.timestamp);
                            return rDate.toDateString() === d.toDateString();
                        })
                        .reduce((sum, r) => sum + r.amount, 0);
                        
                    days.push({ name: dateStr, total: dayTotal });
                }
                setChartData(days);

                // 3. Trick: Recharts butuh waktu untuk kalkulasi layout
                setTimeout(() => {
                    setIsChartReady(true);
                    window.dispatchEvent(new Event('resize')); // Paksa hitung ulang dimensi
                }, 800);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // Loader Utama Halaman
    if (loading && !stats) return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Menghubungkan ke Desa...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ringkasan Desa</h1>
                    <p className="text-slate-500 font-medium">Layanan Digital <span className="text-primary font-bold">Desa Rowosari</span></p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Sistem Aktif</span>
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

            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <div className="mb-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <ChartBarIcon className="text-primary" />
                            Grafik Pemasukan Harian
                        </h3>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">Laporan Aktivitas 7 Hari Terakhir</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">Live Database</span>
                    </div>
                </div>
                
                {/* 
                    Kontainer harus memiliki tinggi tetap (height) secara eksplisit 
                    agar ResponsiveContainer bisa menghitung lebarnya.
                */}
                <div className="w-full" style={{ height: '400px', minHeight: '400px' }}>
                    {isChartReady && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
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
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px'}}
                                    itemStyle={{fontWeight: 900, color: '#10b981', fontSize: '14px'}}
                                    labelStyle={{fontWeight: 700, color: '#64748b', marginBottom: '4px'}}
                                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pemasukan']}
                                />
                                <Bar 
                                    dataKey="total" 
                                    radius={[12, 12, 12, 12]} 
                                    barSize={40}
                                    animationDuration={1500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.total > 0 ? '#10b981' : '#f1f5f9'} 
                                            fillOpacity={entry.total > 0 ? 1 : 0.5}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                            <p className="font-bold italic text-sm tracking-wide animate-pulse">Menyusun Visualisasi Grafik...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

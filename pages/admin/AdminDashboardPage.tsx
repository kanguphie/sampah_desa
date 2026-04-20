
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
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isChartReady, setIsChartReady] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Ambil Statistik Utama
                const dashboardStats = await getAdminDashboardStats();
                setStats(dashboardStats);

                // 2. Ambil Data Transaksi untuk Grafik
                const now = new Date();
                
                // Data 7 Hari Terakhir
                const startDaily = new Date();
                startDaily.setDate(startDaily.getDate() - 6);
                const dailyReports = await getReports({ startDate: startDaily, endDate: now });
                
                const days = [];
                for (let i = 0; i <= 6; i++) {
                    const d = new Date(startDaily);
                    d.setDate(startDaily.getDate() + i);
                    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                    
                    const dayTotal = (dailyReports || [])
                        .filter((r: any) => {
                            if (!r.timestamp || r.status !== 'paid') return false;
                            const rDate = new Date(r.timestamp);
                            return rDate.getDate() === d.getDate() && 
                                   rDate.getMonth() === d.getMonth() && 
                                   rDate.getFullYear() === d.getFullYear();
                        })
                        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
                        
                    days.push({ name: dateStr, total: dayTotal });
                }
                setDailyData(days);

                // Data Bulanan (Tahun Berjalan)
                const currentYear = now.getFullYear();
                const yearReports = await getReports({ 
                    startDate: new Date(currentYear, 0, 1), 
                    endDate: new Date(currentYear, 11, 31) 
                });
                
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const monthly = months.map((m, idx) => {
                    const monthTotal = (yearReports || [])
                        .filter((r: any) => {
                            if (!r.timestamp || r.status !== 'paid') return false;
                            const rDate = new Date(r.timestamp);
                            return rDate.getMonth() === idx && rDate.getFullYear() === currentYear;
                        })
                        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
                    return { name: m, total: monthTotal };
                });
                setMonthlyData(monthly);

                // 3. Trick: Recharts butuh waktu untuk kalkulasi layout
                setTimeout(() => {
                    setIsChartReady(true);
                    window.dispatchEvent(new Event('resize')); 
                }, 1000);
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
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Mengambil Data Desa...</p>
        </div>
    );

    const currentChartData = activeTab === 'daily' ? dailyData : monthlyData;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ringkasan Desa</h1>
                    <p className="text-slate-500 font-medium">Layanan Digital <span className="text-emerald-500 font-bold">Pengelolaan Sampah</span></p>
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
                <div className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <ChartBarIcon className="text-emerald-500" />
                            Grafik Pemasukan {activeTab === 'daily' ? 'Harian' : 'Bulanan'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mt-1">
                            {activeTab === 'daily' ? 'Laporan Aktivitas 7 Hari Terakhir' : `Laporan Pendapatan Tahun ${new Date().getFullYear()}`}
                        </p>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-stretch lg:self-auto">
                        <button 
                            onClick={() => setActiveTab('daily')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'daily' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            7 HARI
                        </button>
                        <button 
                            onClick={() => setActiveTab('monthly')}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            TAHUNAN
                        </button>
                    </div>
                </div>
                
                <div className="w-full" style={{ height: '400px', minHeight: '400px' }}>
                    {isChartReady && currentChartData.some(d => d.total > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentChartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
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
                                    tickFormatter={(val) => val >= 1000 ? `${val/1000}rb` : val}
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
                                    barSize={activeTab === 'daily' ? 45 : 30}
                                    animationDuration={1500}
                                >
                                    {currentChartData.map((entry, index) => (
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
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                            {loading ? (
                                <>
                                    <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <p className="font-bold italic text-sm tracking-wide animate-pulse text-slate-400">Menyusun Visualisasi Grafik...</p>
                                </>
                            ) : (
                                <>
                                    <div className="p-5 bg-white rounded-full shadow-sm border border-slate-100">
                                        <ChartBarIcon className="text-4xl text-slate-200" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Tidak Ada Data</p>
                                        <p className="text-[11px] text-slate-400">Belum ada transaksi terekam untuk periode ini.</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;

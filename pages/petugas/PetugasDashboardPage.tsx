
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getPetugasDailySummary } from '@/services/api';
import { CollectionIcon, QrCodeIcon, CurrencyDollarIcon, UsersIcon } from '@/components/icons';

const PetugasDashboardPage: React.FC = () => {
    const { petugas } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState({ total: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchSummary = async () => {
            if (petugas) {
                try {
                    const data = await getPetugasDailySummary(petugas.id);
                    setSummary(data);
                } catch (error) {
                    console.error("Failed to fetch summary", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSummary();
    }, [petugas]);

    if (loading && !petugas) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-display text-slate-800">Halo, {petugas?.name}</h1>
                <p className="text-slate-500">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="bg-primary-light p-3 rounded-lg">
                        <CurrencyDollarIcon className="text-2xl text-primary" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Pemasukan Hari Ini</p>
                        {loading ? <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mt-1"></div> : 
                        <p className="text-2xl font-bold font-display text-slate-800">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(summary.total)}
                        </p>
                        }
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                        <UsersIcon className="text-2xl text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Warga Tercatat</p>
                        {loading ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-1"></div> : 
                            <p className="text-2xl font-bold font-display text-slate-800">{summary.count} <span className="text-base font-medium text-slate-500">Warga</span></p>
                        }
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button 
                    onClick={() => navigate('/petugas/scan')}
                    className="w-full bg-gradient-to-br from-primary to-teal-500 text-primary-content font-bold py-4 px-6 rounded-xl text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:scale-[1.02] duration-300 ease-in-out flex items-center justify-center gap-3"
                >
                    <QrCodeIcon className="text-2xl" />
                    Mulai Pencatatan
                </button>
            </div>
        </div>
    );
};

export default PetugasDashboardPage;

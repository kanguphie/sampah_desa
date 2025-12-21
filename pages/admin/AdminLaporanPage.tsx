
import React, { useState } from 'react';
import DailyReport from './reports/DailyReport';
import MonthlyReport from './reports/MonthlyReport';
import YearlyReport from './reports/YearlyReport';
import RegionReport from './reports/RegionReport';
import UnpaidReport from './reports/UnpaidReport';
import ParticipationReport from './reports/ParticipationReport';

const AdminLaporanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'tahunan' | 'wilayah' | 'tunggakan' | 'partisipasi'>('harian');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'harian': return <DailyReport />;
            case 'bulanan': return <MonthlyReport />;
            case 'tahunan': return <YearlyReport />;
            case 'wilayah': return <RegionReport />;
            case 'tunggakan': return <UnpaidReport />;
            case 'partisipasi': return <ParticipationReport />;
            default: return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Laporan & Rekapitulasi</h1>
                <p className="mt-1 text-slate-500 font-medium">Analisis keuangan dan status retribusi desa Rowosari.</p>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden min-h-[600px]">
                <div className="border-b border-slate-100 bg-slate-50/50 p-2">
                    <nav className="flex space-x-1" aria-label="Tabs">
                        {[
                            {id:'harian', label:'Harian'},
                            {id:'bulanan', label:'Bulanan'},
                            {id:'tahunan', label:'Tahunan'},
                            {id:'wilayah', label:'Wilayah'},
                            {id:'tunggakan', label:'Piutang'},
                            {id:'partisipasi', label:'Keaktifan'}
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-[10px] transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6 md:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminLaporanPage;

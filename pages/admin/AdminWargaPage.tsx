
import React, { useState, useEffect, useMemo } from 'react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, SearchIcon, ChevronDownIcon } from '@/components/icons';

const AdminWargaPage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', dukuhId: 'all' });

    const fetchData = async () => {
        setLoading(true);
        const [w, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
        setWargaList(w);
        setDukuhList(d);
        setRtList(r);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const filteredWarga = useMemo(() => {
        return wargaList.filter(w => {
            const matchSearch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            return matchSearch && matchDukuh;
        });
    }, [wargaList, filters]);

    const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
    const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Data Warga</h1>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold">+ Warga Baru</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau ID..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <select 
                    className="p-2 border border-slate-200 rounded-lg focus:outline-none"
                    onChange={(e) => setFilters({...filters, dukuhId: e.target.value})}
                >
                    <option value="all">Semua Dukuh</option>
                    {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Nama</th>
                            <th className="p-4">Wilayah</th>
                            <th className="p-4 text-right">Tarif</th>
                            <th className="p-4 text-right">Tunggakan</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredWarga.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-mono text-slate-500">{w.id}</td>
                                <td className="p-4 font-bold text-slate-800">{w.name}</td>
                                <td className="p-4 text-slate-500">RT {getRTNumber(w.rtId)}, {getDukuhName(w.dukuhId)}</td>
                                <td className="p-4 text-right font-mono">Rp{w.dailyFee.toLocaleString()}</td>
                                <td className={`p-4 text-right font-mono font-bold ${w.totalDebt > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                    Rp{w.totalDebt.toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button className="p-1 text-blue-500"><PencilIcon /></button>
                                        <button className="p-1 text-red-500"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWargaPage;


import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updatePetugasProfile } from '@/services/api';
import { CheckCircleIcon, UserIcon } from '@/components/icons';

const PetugasProfilePage: React.FC = () => {
    const { petugas, loginPetugas } = useAuth();
    const [name, setName] = useState(petugas?.name || '');
    const [phone, setPhone] = useState(petugas?.phone || '');
    const [pin, setPin] = useState(petugas?.pin || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (pin.length !== 6) {
            setMessage({ type: 'error', text: 'PIN harus tepat 6 digit angka.' });
            return;
        }

        setLoading(true);
        try {
            if (petugas) {
                const updatedPetugas = await updatePetugasProfile(petugas.id, name, phone, pin);
                loginPetugas(updatedPetugas);
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
             <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <h1 className="text-2xl font-bold font-display text-slate-800">Profil Saya</h1>
                <p className="text-slate-500">Kelola data diri dan PIN login.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                {message && (
                    <div className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.type === 'success' && <CheckCircleIcon />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ID Petugas</label>
                        <input type="text" value={petugas?.id || ''} disabled className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PIN Login (Harus 6 Digit)</label>
                        <input type="text" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary font-mono tracking-widest" required />
                        <p className="text-xs text-slate-400 mt-1">Jaga kerahasiaan PIN Anda demi keamanan sistem.</p>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-focus transition-colors disabled:bg-slate-400 mt-4">
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PetugasProfilePage;

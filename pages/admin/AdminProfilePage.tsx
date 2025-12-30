
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateAdminProfile } from '@/services/api';
import { UserIcon, CheckCircleIcon } from '@/components/icons';

const AdminProfilePage: React.FC = () => {
    const { admin, loginAdmin } = useAuth();
    const [name, setName] = useState(admin?.name || '');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        // Jika field PIN diisi, validasi harus 6 digit
        if (pin) {
            if (pin.length !== 6) {
                setMessage({ type: 'error', text: 'PIN baru harus tepat 6 digit angka.' });
                return;
            }
            if (pin !== confirmPin) {
                setMessage({ type: 'error', text: 'Konfirmasi PIN tidak cocok.' });
                return;
            }
        }

        setLoading(true);
        try {
            if (admin) {
                const updatedAdmin = await updateAdminProfile(admin.id, name, pin || undefined);
                loginAdmin(updatedAdmin); // Update context & session
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
                setPin('');
                setConfirmPin('');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (val: string, setter: (v: string) => void) => {
        const numericValue = val.replace(/\D/g, '').slice(0, 6);
        setter(numericValue);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">Profil Saya</h1>
                <p className="text-slate-500 text-sm mt-1">Kelola informasi akun administrator desa.</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="flex justify-center mb-10">
                    <div className="relative">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-emerald-500/20">
                            {admin?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-slate-100">
                            <div className="w-4 h-4 bg-emerald-400 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 mb-8 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in ${
                        message.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                        {message.type === 'success' ? <CheckCircleIcon /> : <i className="fa-solid fa-circle-exclamation"></i>}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                        <input 
                            type="text" 
                            value={admin?.username || ''} 
                            disabled 
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 cursor-not-allowed font-bold" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" 
                            required 
                        />
                    </div>
                    
                    <div className="border-t border-slate-100 pt-8 mt-4">
                        <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Ganti PIN Akses (Opsional)</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Baru (6 Digit)</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={pin} 
                                    onChange={e => handlePinChange(e.target.value, setPin)} 
                                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold tracking-[0.5em] text-center text-lg" 
                                    placeholder="••••••"
                                    maxLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmasi PIN Baru</label>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={confirmPin} 
                                    onChange={e => handlePinChange(e.target.value, setConfirmPin)} 
                                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold tracking-[0.5em] text-center text-lg" 
                                    placeholder="••••••"
                                    maxLength={6}
                                />
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 ml-1 italic tracking-tight">* Kosongkan jika tidak ingin mengganti PIN</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:bg-slate-300 mt-4 uppercase tracking-[0.1em] text-sm"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Menyimpan...
                            </div>
                        ) : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminProfilePage;

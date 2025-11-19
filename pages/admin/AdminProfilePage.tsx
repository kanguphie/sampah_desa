
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateAdminProfile } from '@/services/api';
import { UserIcon, CheckCircleIcon } from '@/components/icons';

const AdminProfilePage: React.FC = () => {
    const { admin, loginAdmin } = useAuth();
    const [name, setName] = useState(admin?.name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
            return;
        }

        setLoading(true);
        try {
            if (admin) {
                const updatedAdmin = await updateAdminProfile(admin.id, name, password || undefined);
                loginAdmin(updatedAdmin); // Update context
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
                setPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h1 className="text-2xl font-bold font-display text-slate-800">Profil Saya</h1>
                <p className="text-slate-500 mt-1">Kelola informasi akun administrator.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-emerald-500/20">
                        {admin?.name?.charAt(0) || 'A'}
                    </div>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.type === 'success' && <CheckCircleIcon />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input type="text" value={admin?.username || ''} disabled className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" required />
                    </div>
                    
                    <div className="border-t border-slate-200 pt-6 mt-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Ganti Password (Opsional)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="Biarkan kosong jika tidak ingin mengganti" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="Ulangi password baru" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-focus transition-colors disabled:bg-slate-400">
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminProfilePage;

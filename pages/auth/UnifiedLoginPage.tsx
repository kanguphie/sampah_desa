import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginAdmin, loginPetugas } from '@/services/api';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

const UnifiedLoginPage: React.FC = () => {
    const [credential, setCredential] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loginAdmin: authLoginAdmin, loginPetugas: authLoginPetugas } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credential) {
            setError('PIN atau Password tidak boleh kosong.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            // Try to login as Petugas first
            const petugas = await loginPetugas(credential);
            if (petugas) {
                authLoginPetugas(petugas);
                navigate('/petugas/dashboard');
                return;
            }

            // If not Petugas, try to login as Admin
            const admin = await loginAdmin('admin', credential);
            if (admin) {
                authLoginAdmin(admin);
                navigate('/admin/dashboard');
                return;
            }

            // If both fail
            setError('PIN atau Password salah.');
            setCredential('');

        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
            setCredential('');
        } finally {
            setLoading(false);
        }
    };
    
    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">SapaDesa</h1>
                    <p className="text-gray-600">Login Petugas / Admin</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="credential">
                            PIN / Password
                        </label>
                        <div className="relative">
                             <input
                                id="credential"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-primary"
                                aria-label="Toggle password visibility"
                            >
                                {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-gray-400 transition-colors duration-300"
                        >
                            {loading ? 'Mencoba Masuk...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UnifiedLoginPage;
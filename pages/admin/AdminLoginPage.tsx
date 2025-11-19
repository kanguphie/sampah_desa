import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginAdmin as apiLoginAdmin } from '@/services/api';

const AdminLoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loginAdmin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const admin = await apiLoginAdmin('admin', password);
            if (admin) {
                loginAdmin(admin);
                navigate('/admin/dashboard');
            } else {
                setError('Password salah.');
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-primary mb-2">SapaDesa</h1>
                <p className="text-center text-gray-600 mb-8">Admin Panel Login</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-6">
                    <Link to="/petugas/login" className="text-sm text-primary hover:underline">
                        Bukan Admin? Login sebagai Petugas
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
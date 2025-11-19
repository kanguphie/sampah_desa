import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginPetugas as apiLoginPetugas } from '@/services/api';

const PetugasLoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginPetugas } = useAuth();

  const handlePinChange = (value: string) => {
    if (pin.length < 6) {
      setPin(pin + value);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async () => {
    if (pin.length < 4) {
        setError('PIN minimal 4 digit.');
        return;
    }
    setLoading(true);
    setError('');
    try {
        const petugas = await apiLoginPetugas(pin);
        if (petugas) {
            loginPetugas(petugas);
            navigate('/petugas/dashboard');
        } else {
            setError('PIN Salah. Silakan coba lagi.');
            setPin('');
        }
    } catch (e) {
        setError('Terjadi kesalahan. Silakan coba lagi.');
        setPin('');
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm mx-auto bg-white shadow-xl rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">SapaDesa</h1>
        <p className="text-gray-600 mb-8">Login Petugas</p>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-4 h-16 flex items-center justify-center">
          <p className="text-4xl tracking-[1rem] font-mono">
            {pin.split('').map((_, i) => '*').join('')}
          </p>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <button key={i+1} onClick={() => handlePinChange(String(i+1))} className="text-3xl font-bold p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">
              {i+1}
            </button>
          ))}
          <button onClick={handleDelete} className="text-xl font-bold p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">HAPUS</button>
          <button onClick={() => handlePinChange('0')} className="text-3xl font-bold p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">0</button>
          <button onClick={handleLogin} disabled={loading} className="text-xl font-bold p-4 rounded-lg bg-primary text-white hover:bg-primary-focus transition-colors disabled:bg-gray-400">
            {loading ? '...' : 'LOGIN'}
          </button>
        </div>
        <div className="mt-6">
            <Link to="/admin/login" className="text-sm text-primary hover:underline">
                Login sebagai Admin
            </Link>
        </div>
      </div>
    </div>
  );
};

export default PetugasLoginPage;

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicHomePage from './pages/public/PublicHomePage';
import PublicReportPage from './pages/public/PublicReportPage';
import TipsPage from './pages/public/TipsPage';
import ContactPage from './pages/public/ContactPage';
import UnifiedLoginPage from './pages/auth/UnifiedLoginPage';
import PetugasLayout from './pages/petugas/PetugasLayout';
import PetugasDashboardPage from './pages/petugas/PetugasDashboardPage';
import PetugasScanPage from './pages/petugas/PetugasScanPage';
import PetugasBelumBayarPage from './pages/petugas/PetugasBelumBayarPage';
import PetugasProfilePage from './pages/petugas/PetugasProfilePage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminWargaPage from './pages/admin/AdminWargaPage';
import AdminPetugasPage from './pages/admin/AdminPetugasPage';
import AdminLaporanPage from './pages/admin/AdminLaporanPage';
import AdminDukuhPage from './pages/admin/AdminDukuhPage';
import AdminCetakBarcodePage from './pages/admin/AdminCetakBarcodePage';
import AdminPengaturanPage from './pages/admin/AdminPengaturanPage';
import AdminKeuanganPage from './pages/admin/AdminKeuanganPage';
import AdminRiwayatTransaksiPage from './pages/admin/AdminRiwayatTransaksiPage';
import AdminInboxPage from './pages/admin/AdminInboxPage';
import AdminPengumumanPage from './pages/admin/AdminPengumumanPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VillageProfileProvider } from './context/VillageProfileContext';

const PetugasRoutes: React.FC = () => {
    const { petugas } = useAuth();
    return petugas ? (
        <PetugasLayout>
            <Routes>
                <Route path="/dashboard" element={<PetugasDashboardPage />} />
                <Route path="/scan" element={<PetugasScanPage />} />
                <Route path="/belum-bayar" element={<PetugasBelumBayarPage />} />
                <Route path="/profile" element={<PetugasProfilePage />} />
                <Route path="/*" element={<Navigate to="/petugas/dashboard" />} />
            </Routes>
        </PetugasLayout>
    ) : (
        <Navigate to="/login" />
    );
};

const AdminRoutes: React.FC = () => {
    const { admin } = useAuth();
    return admin ? (
        <AdminLayout>
            <Routes>
                <Route path="/dashboard" element={<AdminDashboardPage />} />
                <Route path="/dukuh" element={<AdminDukuhPage />} />
                <Route path="/warga" element={<AdminWargaPage />} />
                <Route path="/petugas" element={<AdminPetugasPage />} />
                <Route path="/riwayat" element={<AdminRiwayatTransaksiPage />} />
                <Route path="/laporan" element={<AdminLaporanPage />} />
                <Route path="/keuangan" element={<AdminKeuanganPage />} />
                <Route path="/inbox" element={<AdminInboxPage />} />
                <Route path="/pengumuman" element={<AdminPengumumanPage />} />
                <Route path="/cetak-barcode" element={<AdminCetakBarcodePage />} />
                <Route path="/pengaturan" element={<AdminPengaturanPage />} />
                <Route path="/profile" element={<AdminProfilePage />} />
                <Route path="/*" element={<Navigate to="/admin/dashboard" />} />
            </Routes>
        </AdminLayout>
    ) : (
        <Navigate to="/login" />
    );
};


const App: React.FC = () => {
  return (
    <VillageProfileProvider>
      <AuthProvider>
        <HashRouter>
            <Routes>
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/laporan-publik" element={<PublicReportPage />} />
                <Route path="/tips" element={<TipsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<UnifiedLoginPage />} />
                <Route path="/petugas/*" element={<PetugasRoutes />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
                {/* Legacy redirects */}
                <Route path="/admin/login" element={<Navigate to="/login" />} />
                <Route path="/petugas/login" element={<Navigate to="/login" />} />
            </Routes>
        </HashRouter>
      </AuthProvider>
    </VillageProfileProvider>
  );
};

export default App;

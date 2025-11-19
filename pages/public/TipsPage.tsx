
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RecycleIcon, LeafIcon, SparklesIcon, ShoppingBagIcon, BanknotesIcon, TrashIcon, MenuIcon, XIcon } from '@/components/icons';

const tips = [
  {
    icon: <RecycleIcon className="text-5xl text-primary" />,
    title: 'Pisahkan Sampah',
    description: 'Selalu pisahkan sampah organik (sisa makanan, daun) dan anorganik (plastik, kertas, kaleng). Ini adalah langkah pertama dan terpenting.',
  },
  {
    icon: <LeafIcon className="text-5xl text-green-600" />,
    title: 'Buat Kompos Sendiri',
    description: 'Manfaatkan sampah organik dari dapur Anda untuk membuat pupuk kompos. Baik untuk tanaman dan mengurangi volume sampah.',
  },
  {
    icon: <ShoppingBagIcon className="text-5xl text-sky-600" />,
    title: 'Terapkan 3R',
    description: 'Reduce (Kurangi), Reuse (Gunakan Kembali), dan Recycle (Daur Ulang). Bawa tas belanja sendiri, gunakan botol minum isi ulang, dan pilih produk daur ulang.',
  },
  {
    icon: <SparklesIcon className="text-5xl text-amber-500" />,
    title: 'Gunakan Kembali (Reuse)',
    description: 'Ubah botol bekas menjadi pot tanaman, atau kaleng susu menjadi tempat pensil. Jadilah kreatif untuk memberi kehidupan kedua pada barang-barang bekas.',
  },
  {
    icon: <BanknotesIcon className="text-5xl text-emerald-600" />,
    title: 'Jual ke Bank Sampah',
    description: 'Kumpulkan sampah organik yang masih memiliki nilai jual seperti botol plastik, kardus, dan logam. Setorkan ke bank sampah untuk ditukar dengan uang.',
  },
  {
    icon: <TrashIcon className="text-5xl text-slate-500" />,
    title: 'Hindari Sekali Pakai',
    description: 'Kurangi penggunaan produk sekali pakai seperti sedotan plastik, piring kertas, dan kantong kresek. Pilih alternatif yang bisa digunakan berulang kali.',
  },
];

const TipCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-bold font-display text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
);


const TipsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-4 bg-teal-400"></div>
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">
                        SapaDesa
                    </div>
                </Link>
                 <nav className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">Home</Link>
                    <Link to="/tips" className="text-primary font-semibold transition-colors">Tips Sampah</Link>
                    <Link to="/contact" className="text-slate-600 hover:text-primary transition-colors font-medium">Kontak</Link>
                </nav>
                <div className="flex items-center gap-4">
                     <button 
                      onClick={() => navigate('/')}
                      className="hidden sm:block bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
                    >
                      Kembali ke Home
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-primary" aria-label="Open menu">
                        <MenuIcon className="text-2xl" />
                    </button>
                </div>
            </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in md:hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">
                        SapaDesa
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600" aria-label="Close menu">
                        <XIcon className="text-2xl" />
                    </button>
                </div>
                <nav className="flex flex-col items-center justify-center flex-grow space-y-8">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-slate-700 hover:text-primary">Home</Link>
                    <Link to="/tips" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-primary hover:text-primary">Tips Sampah</Link>
                    <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-slate-700 hover:text-primary">Kontak</Link>
                </nav>
            </div>
        )}

        <main className="flex-grow">
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
                        Tips Cerdas Mengelola <span className="text-primary">Sampah</span> di Rumah
                    </h1>
                    <p className="mt-4 text-slate-600 text-lg">
                        Langkah-langkah kecil dari rumah dapat memberikan dampak besar bagi lingkungan kita. Yuk, jadi pahlawan lingkungan dari sekarang!
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {tips.map((tip, index) => (
                        <TipCard key={index} {...tip} />
                    ))}
                </div>
            </section>
        </main>

        <footer className="bg-slate-800 text-slate-400 py-8 mt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p>&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
};

export default TipsPage;


import React from 'react';
import { Link } from 'react-router-dom';
import { RecycleIcon, LeafIcon, SparklesIcon, ShoppingBagIcon, BanknotesIcon, TrashIcon } from '@/components/icons';
import PublicHeader from '@/components/PublicHeader';

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
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-4 bg-teal-400"></div>
        <PublicHeader />

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

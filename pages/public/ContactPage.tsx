
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, PhoneIcon } from '@/components/icons';
import { sendMessage } from '@/services/api';
import PublicHeader from '@/components/PublicHeader';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.contact || !formData.message) return;
      
      setLoading(true);
      try {
          await sendMessage(formData);
          setSuccess(true);
          setFormData({ name: '', contact: '', message: '' });
          setTimeout(() => setSuccess(false), 5000);
      } catch (error) {
          console.error("Failed to send message", error);
          alert("Gagal mengirim pesan. Silakan coba lagi.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-4 bg-teal-400"></div>
        <PublicHeader />

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
                    Hubungi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Kami</span>
                </h1>
                <p className="mt-4 text-slate-600 text-lg">
                    Punya pertanyaan seputar retribusi sampah atau layanan SapaDesa? Kami siap membantu Anda.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Contact Info & Map */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-card p-6 rounded-2xl bg-white/60 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                <HomeIcon className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Karang Taruna Mahardika</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Sekretariat: Kantor Desa Rowosari<br/>
                                2W3M+JW8, Pencar, Rowosari,<br/>
                                Kec. Limpung, Kab. Batang,<br/>
                                Jawa Tengah 51271
                            </p>
                        </div>
                        <div className="glass-card p-6 rounded-2xl bg-white/60 hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600 mb-4">
                                <PhoneIcon className="text-2xl" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Layanan Warga</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                WhatsApp: +62 812-3456-7890<br/>
                                Email: admin@sapadesa.id<br/>
                                Jam Kerja: 08.00 - 15.00 WIB
                            </p>
                        </div>
                    </div>

                    {/* Map Embed */}
                    <div className="glass-card p-2 rounded-2xl bg-white/60 h-80 w-full overflow-hidden">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31678.54264625336!2d109.90784168370973!3d-7.023066491562325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e703f816623181d%3A0x5027a76e3566880!2sRowosari%2C%20Limpung%2C%20Batang%20Regency%2C%20Central%20Java!5e0!3m2!1sen!2sid!4v1680000000000!5m2!1sen!2sid" 
                            width="100%" 
                            height="100%" 
                            style={{border:0, borderRadius: '1rem'}} 
                            allowFullScreen 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Peta Lokasi Rowosari, Limpung"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="glass-card p-8 rounded-3xl bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-20 blur-3xl"></div>
                    
                    <h3 className="text-2xl font-bold font-display text-slate-800 mb-6 relative z-10">Kirim Pesan</h3>
                    
                    {success ? (
                         <div className="bg-green-100 border border-green-200 text-green-800 p-6 rounded-xl text-center animate-fade-in relative z-10">
                            <p className="font-bold text-lg mb-2">Pesan Terkirim!</p>
                            <p>Terima kasih telah menghubungi kami. Kami akan segera merespon pesan Anda.</p>
                            <button 
                                onClick={() => setSuccess(false)}
                                className="mt-4 text-green-700 font-semibold hover:underline"
                            >
                                Kirim pesan lain
                            </button>
                        </div>
                    ) : (
                         <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Nama Anda" 
                                    className="w-full px-4 py-3 bg-slate-50 border-b-2 border-slate-200 focus:border-emerald-500 rounded-t-lg focus:bg-white outline-none transition-all placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Email / WhatsApp</label>
                                <input 
                                    type="text" 
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="kontak@email.com atau 08..." 
                                    className="w-full px-4 py-3 bg-slate-50 border-b-2 border-slate-200 focus:border-emerald-500 rounded-t-lg focus:bg-white outline-none transition-all placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Pesan</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows={4}
                                    placeholder="Tulis pesan Anda di sini..." 
                                    className="w-full px-4 py-3 bg-slate-50 border-b-2 border-slate-200 focus:border-emerald-500 rounded-t-lg focus:bg-white outline-none transition-all placeholder-slate-400 resize-none"
                                ></textarea>
                            </div>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {loading ? 'Mengirim...' : 'Kirim Pesan'}
                            </button>
                        </form>
                    )}
                   
                </div>
            </div>
        </main>

        <footer className="bg-slate-800 text-slate-400 py-8 mt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p>&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari. All rights reserved.</p>
            </div>
        </footer>
    </div>
  );
};

export default ContactPage;

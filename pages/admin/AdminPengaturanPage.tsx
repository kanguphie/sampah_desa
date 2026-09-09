
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSchedule, updateSchedule, getAllDukuh, markDayAsSkipped, getVillageProfile, updateVillageProfile, exportFullBackup, importFullBackup, recalculateDebt, uploadLogoFile, removeLogo } from '@/services/api';
import Modal from '@/components/Modal';
import { PencilIcon, HomeIcon, ClockIcon, XIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon, DatabaseIcon, DownloadIcon, UploadIcon, ScaleBalancedIcon, InfoIcon, AlertCircleIcon } from '@/components/icons';
import { useVillageProfile } from '@/context/VillageProfileContext';
import { BrandLogo } from '@/components/BrandLogo';
import { Upload, Trash2, Image as ImageIcon, Check, Sparkles, FolderCheck, ArrowUpRight, AlertCircle } from 'lucide-react';
import type { Dukuh, VillageProfile } from '@/types';

type Schedule = Record<string, number[] | 'libur'>;

const ScheduleForm: React.FC<{
  day: string;
  currentSchedule: number[] | 'libur';
  onSave: (day: string, newSchedule: number[] | 'libur') => void;
  onCancel: () => void;
  dukuhList: Dukuh[];
}> = ({ day, currentSchedule, onSave, onCancel, dukuhList }) => {
  const isHoliday = currentSchedule === 'libur';
  const [selectedDukuhIds, setSelectedDukuhIds] = useState<number[]>(isHoliday ? [] : (currentSchedule as number[] || []));
  const [isHolidayChecked, setIsHolidayChecked] = useState(isHoliday);

  const handleDukuhChange = (dukuhId: number) => {
    setSelectedDukuhIds(prev => {
      const current = prev || [];
      return current.includes(dukuhId) ? current.filter(id => id !== dukuhId) : [...current, dukuhId];
    });
  };

  const handleHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHolidayChecked(checked);
    if (checked) {
      setSelectedDukuhIds([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(day, isHolidayChecked ? 'libur' : selectedDukuhIds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Wilayah Pengambilan - {day}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {dukuhList.map(dukuh => (
                 <label key={dukuh.id} className="flex items-center p-3 rounded-lg hover:bg-slate-100 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                      checked={selectedDukuhIds.includes(dukuh.id)}
                      onChange={() => handleDukuhChange(dukuh.id)}
                      disabled={isHolidayChecked}
                    />
                    <span className="ml-3 text-slate-700">{dukuh.name}</span>
                 </label>
            ))}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
         <label className="flex items-center p-3 rounded-lg hover:bg-slate-100 cursor-pointer">
            <input 
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-amber-500"
              checked={isHolidayChecked}
              onChange={handleHolidayChange}
            />
            <span className="ml-3 font-semibold text-slate-700">Jadikan Hari Libur</span>
         </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg">Simpan</button>
      </div>
    </form>
  );
};

interface LogoUploadBoxProps {
    title: string;
    subtitle: string;
    type: 'logo_app' | 'logo_horizontal';
    currentUrl?: string;
    aspectRatio: 'square' | 'horizontal';
    onUploaded: (url: string) => void;
    onRemoved: () => void;
    onNotify: (type: 'success' | 'error', text: string) => void;
}

const LogoUploadBox: React.FC<LogoUploadBoxProps> = ({
    title,
    subtitle,
    type,
    currentUrl,
    aspectRatio,
    onUploaded,
    onRemoved,
    onNotify
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [imgLoadError, setImgLoadError] = useState(false);

    // Validate that currentUrl is a valid file path, not corrupted shifted text
    const isValidImg = Boolean(
        currentUrl && 
        typeof currentUrl === 'string' && 
        (currentUrl.startsWith('/uploads/') || currentUrl.startsWith('http') || currentUrl.startsWith('data:'))
    );
    const effectiveUrl = isValidImg ? currentUrl : null;

    useEffect(() => {
        setImgLoadError(false);
    }, [currentUrl]);

    const handleFile = async (file: File) => {
        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|svg)$/i)) {
            onNotify('error', 'Format file tidak didukung! Harap unggah format JPG, PNG, WebP, atau SVG.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            onNotify('error', 'Ukuran file terlalu besar! Maksimal 5MB.');
            return;
        }

        setUploading(true);
        try {
            const res = await uploadLogoFile(file, type);
            if (res.url) {
                setImgLoadError(false);
                onUploaded(res.url);
                onNotify('success', `${title} berhasil disimpan di folder /uploads/!`);
            } else {
                throw new Error(res.error || 'Gagal mengunggah');
            }
        } catch (err: any) {
            console.error('Upload logo error:', err);
            onNotify('error', err.message || 'Terjadi kesalahan saat mengunggah file.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleRemove = async () => {
        try {
            await removeLogo(type);
            onRemoved();
            onNotify('success', `${title} berhasil dihapus.`);
        } catch (err) {
            onNotify('error', 'Gagal menghapus logo.');
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-teal-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-teal-600" />
                        {title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {aspectRatio === 'square' ? '1:1 Bulat/Kotak' : 'Horizontal'}
                </span>
            </div>

            {/* Preview Box & Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-all p-4 flex flex-col items-center justify-center text-center ${
                    isDragging
                        ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
                        : effectiveUrl
                        ? 'border-emerald-200 bg-slate-50/80 hover:bg-teal-50/30'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                } ${aspectRatio === 'square' ? 'min-h-[160px]' : 'min-h-[130px]'}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-teal-700">Menyimpan file ke folder server...</span>
                    </div>
                ) : effectiveUrl && !imgLoadError ? (
                    <div className="flex flex-col items-center gap-2 w-full py-1">
                        <div className={`flex items-center justify-center p-2 rounded-xl bg-white shadow-sm border border-slate-200/80 ${
                            aspectRatio === 'square' ? 'w-24 h-24' : 'w-full max-w-xs h-20'
                        }`}>
                            <img
                                src={effectiveUrl}
                                alt={title}
                                className="max-h-full max-w-full object-contain"
                                onError={() => setImgLoadError(true)}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold mt-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Klik atau seret file baru untuk mengganti</span>
                        </div>
                    </div>
                ) : effectiveUrl && imgLoadError ? (
                    <div className="flex flex-col items-center gap-2 w-full py-3 text-amber-700">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/70 border border-amber-300 flex items-center justify-center text-amber-700">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-800 block">File gambar belum ditemukan di container ini</span>
                            <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">Klik di sini untuk unggah ulang file logo Anda</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-slate-500">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-700 block">Pilih File atau Seret ke Sini</span>
                            <span className="text-[11px] text-slate-400">PNG, JPG, WebP, atau SVG (Maks. 5MB)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Storage Info Badge & Delete Action */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                {effectiveUrl ? (
                    <>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 truncate max-w-[240px]">
                            <FolderCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate" title={`File fisik: ${effectiveUrl}`}>
                                Folder: <code className="font-mono text-[10px]">{effectiveUrl}</code>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                        </button>
                    </>
                ) : (
                    <div className="text-[11px] text-slate-400 italic">
                        Belum ada logo terunggah (menggunakan visual default)
                    </div>
                )}
            </div>
        </div>
    );
};

const VillageProfileForm: React.FC = () => {
    const { refreshProfile } = useVillageProfile();
    const [profile, setProfile] = useState<Omit<VillageProfile, 'id' | 'lastUpdated'>>({
        name: '',
        district: '',
        regency: '',
        address: '',
        phone: '',
        email: '',
        branding_title: 'SapaDesa',
        branding_subtitle: 'Platform Pengelolaan Sampah Desa',
        logo_url: '',
        logo_horizontal_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVillageProfile();
            if (data) {
                const { id, lastUpdated, ...cleanProfile } = data;
                
                // Sanitize corrupted/shifted fields so they never display in input fields
                const name = (cleanProfile.name && cleanProfile.name !== '1' && !cleanProfile.name.startsWith('/uploads/')) 
                    ? cleanProfile.name : 'Rowosari';
                const district = (cleanProfile.district && !cleanProfile.district.startsWith('/uploads/')) 
                    ? cleanProfile.district : 'Limpung';
                const regency = (cleanProfile.regency && cleanProfile.regency !== '1') 
                    ? cleanProfile.regency : 'Batang';
                const address = (cleanProfile.address === 'Batang' || cleanProfile.address === 'Rowosari') 
                    ? '' : (cleanProfile.address || '');
                const phone = (cleanProfile.phone === 'Batang' || cleanProfile.phone === '0') 
                    ? '' : (cleanProfile.phone || '');
                const email = (cleanProfile.email === '0' || cleanProfile.email === 'Rowosari') 
                    ? '' : (cleanProfile.email || '');

                const logo_url = (cleanProfile.logo_url && (cleanProfile.logo_url.startsWith('/uploads/') || cleanProfile.logo_url.startsWith('http') || cleanProfile.logo_url.startsWith('data:'))) 
                    ? cleanProfile.logo_url : '';
                const logo_horizontal_url = (cleanProfile.logo_horizontal_url && (cleanProfile.logo_horizontal_url.startsWith('/uploads/') || cleanProfile.logo_horizontal_url.startsWith('http') || cleanProfile.logo_horizontal_url.startsWith('data:'))) 
                    ? cleanProfile.logo_horizontal_url : '';

                setProfile({
                    name,
                    district,
                    regency,
                    address,
                    phone,
                    email,
                    branding_title: cleanProfile.branding_title || 'SapaDesa',
                    branding_subtitle: cleanProfile.branding_subtitle || 'Platform Pengelolaan Sampah Desa',
                    logo_url,
                    logo_horizontal_url
                });
            }
        } catch (err) {
            console.error('Error fetching village profile:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            // Clean accidental image path inputs from branding title and subtitle
            const cleanTitle = (profile.branding_title && !profile.branding_title.startsWith('/uploads/') && !profile.branding_title.match(/\.(png|jpe?g|webp|svg)$/i))
                ? profile.branding_title.trim()
                : 'SapaDesa';
            const cleanSubtitle = (profile.branding_subtitle && !profile.branding_subtitle.startsWith('/uploads/') && !profile.branding_subtitle.match(/\.(png|jpe?g|webp|svg)$/i))
                ? profile.branding_subtitle.trim()
                : 'Platform Pengelolaan Sampah Desa';

            const payload = {
                ...profile,
                branding_title: cleanTitle,
                branding_subtitle: cleanSubtitle
            };
            setProfile(payload);
            await updateVillageProfile(payload);
            await refreshProfile();
            showNotification('success', 'Profil Desa dan pengaturan logo berhasil disimpan!');
        } catch (err) {
            showNotification('error', 'Gagal memperbarui profil desa.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Profil Desa & Logo...</div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto">
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-fade-in ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                    {message.type === 'success' ? <CheckCircleIcon /> : <XIcon />}
                    {message.text}
                </div>
            )}

            {/* Visual Branding Comparison / Live Preview Box */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-800/40 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Live Brand Preview</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-white mt-0.5">Identitas Visual & Logo Sistem</h3>
                    </div>
                    <div className="text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersimpan di Disk Folder /public/uploads/ (Bukan Base64)</span>
                    </div>
                </div>

                {/* Side-by-side preview mimicking the user reference image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Left preview: Emblem Logo */}
                    <div className="bg-white/95 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg border border-white/20 min-h-[190px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Preview 1: Logo Aplikasi (Emblem)
                        </span>
                        <div className="h-28 flex items-center justify-center">
                            <BrandLogo variant="emblem" showTagline={false} imageClassName="h-28 w-28 drop-shadow-md rounded-xl" />
                        </div>
                        <span className="font-extrabold text-slate-800 text-sm mt-3 tracking-tight">
                            {(profile.branding_title && !profile.branding_title.startsWith('/uploads/') && !profile.branding_title.match(/\.(png|jpe?g|webp|svg)$/i))
                                ? profile.branding_title
                                : 'SapaDesa'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                            {(profile.branding_subtitle && !profile.branding_subtitle.startsWith('/uploads/') && !profile.branding_subtitle.match(/\.(png|jpe?g|webp|svg)$/i))
                                ? profile.branding_subtitle
                                : 'Platform Pengelolaan Sampah Desa'}
                        </span>
                    </div>

                    {/* Right preview: Horizontal Branding Wordmark */}
                    <div className="bg-white/95 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg border border-white/20 min-h-[190px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Preview 2: Tulisan Branding Logo (Horizontal)
                        </span>
                        <div className="h-24 w-full flex items-center justify-center px-4">
                            <BrandLogo variant="horizontal" showTagline={true} />
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold mt-3">
                            Header & Kop Laporan Desa {profile.name || 'Rowosari'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dual Logo Upload Boxes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                        Unggah File Logo (Tersimpan ke Folder Server)
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                        File disimpan langsung di folder <code className="text-teal-700 font-bold">/public/uploads/</code>
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LogoUploadBox
                        title="Logo Aplikasi (Emblem / Lambang)"
                        subtitle="Format proporsional 1:1. Tampil di ikon aplikasi, avatar sistem, & mobile header."
                        type="logo_app"
                        aspectRatio="square"
                        currentUrl={profile.logo_url}
                        onUploaded={(url) => {
                            setProfile(prev => ({ ...prev, logo_url: url }));
                            refreshProfile();
                        }}
                        onRemoved={() => {
                            setProfile(prev => ({ ...prev, logo_url: '' }));
                            refreshProfile();
                        }}
                        onNotify={showNotification}
                    />

                    <LogoUploadBox
                        title="Tulisan Branding Logo (Horizontal)"
                        subtitle="Format memanjang (wordmark/tipografi). Tampil di navbar desktop & kop laporan."
                        type="logo_horizontal"
                        aspectRatio="horizontal"
                        currentUrl={profile.logo_horizontal_url}
                        onUploaded={(url) => {
                            setProfile(prev => ({ ...prev, logo_horizontal_url: url }));
                            refreshProfile();
                        }}
                        onRemoved={() => {
                            setProfile(prev => ({ ...prev, logo_horizontal_url: '' }));
                            refreshProfile();
                        }}
                        onNotify={showNotification}
                    />
                </div>
            </div>

            {/* Tulisan Branding Fields */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Kustomisasi Teks Branding & Tagline
                    </h4>
                    {(profile.branding_title?.includes('/uploads/') || profile.branding_subtitle?.includes('/uploads/') || profile.branding_title?.match(/\.(png|jpe?g|webp|svg)$/i)) && (
                        <button
                            type="button"
                            onClick={() => setProfile(prev => ({ ...prev, branding_title: 'SapaDesa', branding_subtitle: 'Platform Pengelolaan Sampah Desa' }))}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                        >
                            Reset ke SapaDesa
                        </button>
                    )}
                </div>

                {(profile.branding_title?.includes('/uploads/') || profile.branding_subtitle?.includes('/uploads/') || profile.branding_title?.match(/\.(png|jpe?g|webp|svg)$/i)) && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <strong className="block font-bold">Kolom ini khusus Teks Nama & Slogan, bukan file gambar.</strong>
                            <span>File gambar logo diunggah pada kotak upload di atas. Klik tombol <b>"Reset ke SapaDesa"</b> untuk mengembalikan teks judul.</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Nama Branding Aplikasi
                        </label>
                        <input
                            type="text"
                            value={profile.branding_title || ''}
                            onChange={e => setProfile({ ...profile, branding_title: e.target.value })}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700"
                            placeholder="Contoh: SapaDesa"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Tagline / Sub-Branding
                        </label>
                        <input
                            type="text"
                            value={profile.branding_subtitle || ''}
                            onChange={e => setProfile({ ...profile, branding_subtitle: e.target.value })}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700"
                            placeholder="Contoh: Platform Pengelolaan Sampah Desa"
                        />
                    </div>
                </div>
            </div>

            {/* Informasi Administrasi Desa */}
            <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                    Informasi Wilayah & Administrasi Desa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Desa</label>
                        <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Contoh: Rowosari" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                        <input type="text" value={profile.district} onChange={e => setProfile({...profile, district: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Limpung" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kabupaten</label>
                        <input type="text" value={profile.regency} onChange={e => setProfile({...profile, regency: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Batang" required />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Sekretariat</label>
                        <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700 resize-none" placeholder="Alamat kantor desa..." required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Layanan</label>
                        <div className="relative">
                            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="08123..." required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Resmi</label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="desa@gmail.com" required />
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.98] transition-all disabled:bg-slate-300 uppercase tracking-widest flex items-center justify-center gap-3"
            >
                {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <CheckCircleIcon />
                )}
                Simpan Profil Desa & Logo
            </button>
        </form>
    );
};

const DatabaseManager: React.FC<{
    onNotify: (type: 'success' | 'error', text: string) => void;
    onConfirm: (title: string, text: string, action: () => void) => void;
}> = ({ onNotify, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const data = await exportFullBackup();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SapaDesa_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onNotify('success', 'Backup berhasil diunduh!');
        } catch (err) {
            onNotify('error', 'Gagal membuat backup data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const input = e.target;
        onConfirm(
            "Konfirmasi Restore",
            "PERINGATAN: Restore data akan memperbarui database dengan data dari file JSON. Lanjutkan?",
            async () => {
                setLoading(true);
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const json = JSON.parse(event.target?.result as string);
                        const result = await importFullBackup(json);
                        
                        if (result.errors.length === 0) {
                            onNotify('success', `Restore berhasil! ${result.success.length} tabel diperbarui.`);
                        } else {
                            onNotify('error', `Gagal memulihkan ${result.errors.length} tabel. Periksa konsol.`);
                            console.error("Restore Errors:", result.errors);
                        }
                    } catch (err) {
                        onNotify('error', 'File JSON tidak valid atau rusak.');
                    } finally {
                        setLoading(false);
                        input.value = '';
                    }
                };
                reader.readAsText(file);
            }
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col justify-between items-start gap-6">
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary mb-4">
                            <DownloadIcon className="text-xl" />
                        </div>
                        <h3 className="font-black text-slate-800 text-lg">Backup Data</h3>
                        <p className="text-slate-500 text-sm mt-1">Unduh semua data Master, Transaksi, dan Pengaturan dalam format JSON untuk cadangan atau migrasi server.</p>
                    </div>
                    <button 
                        onClick={handleDownload}
                        disabled={loading}
                        className="w-full py-4 bg-white border border-slate-200 hover:bg-primary hover:text-white hover:border-primary text-slate-600 font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : (
                            <>
                                <DownloadIcon />
                                Unduh JSON
                            </>
                        )}
                    </button>
                </div>

                {/* Restore Card */}
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col justify-between items-start gap-6">
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-500 mb-4">
                            <UploadIcon className="text-xl" />
                        </div>
                        <h3 className="font-black text-slate-800 text-lg">Restore Data</h3>
                        <p className="text-slate-500 text-sm mt-1">Unggah file JSON backup untuk memulihkan data. Sistem akan melakukan 'upsert' (update jika ada, insert jika baru).</p>
                    </div>
                    <label className="w-full">
                        <input type="file" accept=".json" onChange={handleRestore} disabled={loading} className="hidden" />
                        <div className="w-full py-4 bg-white border border-slate-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 text-slate-600 font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50">
                            <UploadIcon />
                            Pilih File
                        </div>
                    </label>
                </div>

                {/* Sync Debt Card */}
                <div className="md:col-span-2 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
                            <ScaleBalancedIcon className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">Sinkronisasi Tunggakan</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Kalkulasi ulang saldo tunggakan warga berdasarkan seluruh riwayat transaksi. Gunakan jika data tunggakan dirasa tidak sesuai.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            onConfirm(
                                "Sinkronisasi Tunggakan",
                                "Kalkulasi ulang seluruh saldo tunggakan warga berdasarkan riwayat transaksi? Data saldo akan dikoreksi otomatis.",
                                async () => {
                                    setLoading(true);
                                    try {
                                        await recalculateDebt();
                                        onNotify('success', 'Sinkronisasi tunggakan berhasil!');
                                    } catch (e) {
                                        onNotify('error', 'Gagal melakukan sinkronisasi.');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            );
                        }}
                        disabled={loading}
                        className="px-8 py-3.5 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all uppercase tracking-widest text-[10px] whitespace-nowrap"
                    >
                        {loading ? 'Proses...' : 'Mulai Sinkron'}
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4">
                 <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0">
                    <XIcon className="text-xs" />
                 </div>
                 <div>
                    <h4 className="font-black text-amber-800 text-sm">Peringatan Penting</h4>
                    <p className="text-amber-700/80 text-xs mt-1 leading-relaxed">
                        Fitur restore ini dirancang untuk memudahkan migrasi antar database (misal dari Supabase Cloud ke Proxmox Lokal). Pastikan file JSON yang Anda gunakan adalah asli hasil backup aplikasi ini untuk menghindari kerusakan struktur data.
                    </p>
                 </div>
            </div>
        </div>
    );
};

const AdminPengaturanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'jadwal' | 'profil' | 'database'>('jadwal');
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dayToEdit, setDayToEdit] = useState<{ day: string; schedule: number[] | 'libur' } | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    // Global Message & Confirm States
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [confirm, setConfirm] = useState<{ title: string, text: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [scheduleData, dukuhData] = await Promise.all([getSchedule(), getAllDukuh()]);
            setSchedule(scheduleData as Schedule);
            setDukuhList(dukuhData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSchedule = async (day: string, newSchedule: number[] | 'libur') => {
        await updateSchedule(day, newSchedule);
        fetchData();
        setIsModalOpen(false);
        setMessage({ type: 'success', text: `Jadwal ${day} berhasil diperbarui.` });
    };

    const openFormModal = (day: string, currentSchedule: number[] | 'libur') => {
        setDayToEdit({ day, schedule: currentSchedule });
        setIsModalOpen(true);
    };

    const handleSkipToday = async () => {
        if (!schedule) return;
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        const currentSched = (schedule as any)[todayName];

        if (currentSched === 'libur' || !currentSched || !currentSched.length) {
            setMessage({ type: 'error', text: 'Hari ini adalah hari libur, tidak ada pengambilan yang bisa dibatalkan.' });
            return;
        }

        setConfirm({
            title: "Batalkan Pengambilan",
            text: `Batalkan pengambilan iuran hari ini (${todayName})? Seluruh warga di wilayah terjadwal akan otomatis dicatat sebagai tunggakan (Hutang).`,
            onConfirm: async () => {
                setConfirm(null);
                setIsSkipping(true);
                try {
                    await markDayAsSkipped(currentSched);
                    setMessage({ type: 'success', text: 'Berhasil! Iuran hari ini dialihkan ke tunggakan.' });
                } catch (err) {
                    setMessage({ type: 'error', text: 'Gagal memproses data.' });
                } finally {
                    setIsSkipping(false);
                }
            }
        });
    };

    const getScheduleDisplay = (scheduleData: number[] | 'libur') => {
        if (scheduleData === 'libur' || !scheduleData || scheduleData.length === 0) {
            return <span className="text-amber-600 font-semibold italic text-sm">Libur Pengambilan</span>;
        }
        return (scheduleData as number[])
            .map(id => dukuhList.find(d => d.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const scheduleOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const todayName = scheduleOrder[(new Date().getDay() + 6) % 7];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                  <p className="mt-1 text-slate-500 text-sm">Konfigurasi operasional dan identitas desa.</p>
                </div>
                {activeTab === 'jadwal' && (
                    <button 
                        onClick={handleSkipToday}
                        disabled={isSkipping}
                        className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2"
                    >
                        <XIcon className="text-sm" /> Batal Ambil Hari Ini
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
                    <button onClick={() => setActiveTab('jadwal')} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'jadwal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        <ClockIcon className="text-lg" /> Jadwal Pengambilan
                    </button>
                    <button onClick={() => setActiveTab('profil')} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'profil' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        <HomeIcon className="text-lg" /> Profil Desa
                    </button>
                    <button onClick={() => setActiveTab('database')} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'database' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        <DatabaseIcon className="text-lg" /> Database
                    </button>
                </div>

                <div className="p-6 md:p-10 animate-fade-in min-h-[400px]">
                    {activeTab === 'jadwal' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse"></div>)
                                ) : schedule && scheduleOrder.map((day) => (
                                    <div key={day} className={`group p-5 border rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${day === todayName ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{day.substring(0,3)}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-800 text-lg">{day}</h4>
                                                    {day === todayName && <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Hari Ini</span>}
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium line-clamp-1">{getScheduleDisplay(schedule[day])}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => openFormModal(day, schedule[day])} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 shadow-sm text-sm">
                                            <PencilIcon /> Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeTab === 'profil' ? (
                        <VillageProfileForm />
                    ) : (
                        <DatabaseManager 
                            onNotify={(type, text) => setMessage({ type, text })}
                            onConfirm={(title, text, action) => setConfirm({ title, text, onConfirm: action })}
                        />
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Edit Jadwal - ${dayToEdit?.day}`}>
                {dayToEdit && (
                    <ScheduleForm 
                        day={dayToEdit.day}
                        currentSchedule={dayToEdit.schedule}
                        onSave={handleSaveSchedule}
                        onCancel={() => setIsModalOpen(false)} 
                        dukuhList={dukuhList}
                    />
                )}
            </Modal>

            {/* CONFIRM MODAL */}
            <Modal isOpen={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title || 'Konfirmasi'}>
                <div className="space-y-6">
                    <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mt-2">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-amber-500">
                            <InfoIcon className="text-xl" />
                        </div>
                        <p className="text-sm text-amber-900 font-medium leading-relaxed">{confirm?.text}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setConfirm(null)}
                            className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={() => confirm?.onConfirm()}
                            className="flex-1 px-6 py-3.5 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all uppercase tracking-widest text-[10px]"
                        >
                            Konfirmasi
                        </button>
                    </div>
                </div>
            </Modal>

            {/* NOTIFICATION TOAST */}
            {message && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-slide-in-up">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                        {message.type === 'success' ? <CheckCircleIcon className="text-xl text-emerald-500" /> : <AlertCircleIcon className="text-xl text-rose-500" />}
                        <p className="text-xs font-black uppercase tracking-tight">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                            <XIcon className="text-lg" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPengaturanPage;


import * as XLSX from 'xlsx';
import type { Warga } from '@/types';

// Fungsi untuk mengekspor data ke Excel
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Fungsi untuk membaca data Warga dari file Excel
export const readWargaExcel = (file: File): Promise<Partial<Warga>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (!workbook.SheetNames.length) {
                    reject(new Error("File Excel kosong atau tidak memiliki sheet."));
                    return;
                }

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Konversi ke JSON (raw)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as any[];
                
                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // Logika Pemetaan Kolom Berdasarkan Gambar User
                const wargaList: Partial<Warga>[] = jsonData.map((row: any) => {
                    const findValue = (possibleKeys: string[]) => {
                        // Normalisasi kunci di row: hapus spasi, ubah ke lowercase
                        const rowKeys = Object.keys(row);
                        const matchedKey = rowKeys.find(k => {
                            const cleanK = k.toLowerCase().trim();
                            return possibleKeys.some(pk => pk.toLowerCase().trim() === cleanK || pk.toLowerCase().replace(/\s/g, '') === cleanK.replace(/\s/g, ''));
                        });
                        return matchedKey ? row[matchedKey] : undefined;
                    };

                    // Sesuai Gambar: Nama, Tarif, Kode Dukuh, Kode RT, Tipe Pembayaran, Tarif Bulanan
                    const id = findValue(['ID', 'ID Warga', 'Kode Warga', 'Id', 'id_warga', 'Nomor ID', 'ID_Warga']);
                    const name = findValue(['Nama', 'Nama Lengkap', 'Name']);
                    const dailyFee = findValue(['Tarif', 'Iuran', 'Daily Fee', 'Fee', 'Tarif Harian']);
                    const dukuhId = findValue(['Kode Dukuh', 'Dukuh ID', 'DukuhId', 'Dukuh']);
                    const rtId = findValue(['Kode RT', 'RT ID', 'RtId', 'RT']);
                    const billingTypeRaw = findValue(['Tipe Pembayaran', 'Tipe', 'Billing Type', 'Jenis Pembayaran', 'Paket']);
                    const monthlyFee = findValue(['Tarif Bulanan', 'Monthly Fee', 'Iuran Bulanan', 'Tarif Sebulan']);
                    const address = findValue(['Alamat', 'Address']);
                    const phone = findValue(['No HP', 'No. HP', 'Nomor HP', 'Telepon', 'Phone']);
                    const totalDebt = findValue(['Tunggakan', 'Total Tunggakan', 'Hutang', 'Debt']);

                    let billingType: 'HARIAN' | 'BULANAN' = 'HARIAN';
                    if (billingTypeRaw) {
                        const btStr = String(billingTypeRaw).toUpperCase().trim();
                        if (btStr.includes('BULAN')) {
                            billingType = 'BULANAN';
                        }
                    }

                    return {
                        id: id ? String(id).trim() : undefined,
                        name: name ? String(name).trim() : undefined,
                        address: address ? String(address).trim() : undefined,
                        phone: phone ? String(phone).trim() : undefined,
                        dailyFee: (dailyFee !== null && dailyFee !== undefined && !isNaN(Number(dailyFee))) ? Number(dailyFee) : 2000,
                        billingType: billingType,
                        monthlyFee: (monthlyFee !== null && monthlyFee !== undefined && !isNaN(Number(monthlyFee))) ? Number(monthlyFee) : (billingType === 'BULANAN' ? 25000 : 0),
                        dukuhId: (dukuhId !== null && dukuhId !== undefined) ? Number(dukuhId) : undefined,
                        rtId: (rtId !== null && rtId !== undefined) ? Number(rtId) : undefined,
                        totalDebt: (totalDebt !== null && totalDebt !== undefined && !isNaN(Number(totalDebt))) ? Number(totalDebt) : undefined
                    };
                });
                
                resolve(wargaList);
            } catch (error) {
                console.error("Excel Parsing Error:", error);
                reject(new Error("Format file tidak didukung. Gunakan .xlsx atau .xls"));
            }
        };
        
        reader.onerror = () => reject(new Error("Gagal membaca file."));
        reader.readAsArrayBuffer(file);
    });
};

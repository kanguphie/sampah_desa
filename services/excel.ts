
import * as XLSX from 'xlsx';
import type { Warga, Transaksi, Pengeluaran } from '@/types';

// Utility to export data to Excel
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Utility to read Warga data from Excel file
export const readWargaExcel = (file: File): Promise<Partial<Warga>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // Map to Warga Type (assuming columns: Name, RT, DukuhId, Fee)
                // This is a basic mapping, in real world validation is needed
                const wargaList: Partial<Warga>[] = jsonData.map((row: any) => ({
                    name: row['Nama'] || row['name'],
                    dailyFee: row['Tarif'] || row['dailyFee'],
                    // We assume IDs for Dukuh/RT are passed or need mapping logic in the component
                    dukuhId: row['Kode Dukuh'] || row['dukuhId'],
                    rtId: row['Kode RT'] || row['rtId']
                }));
                
                resolve(wargaList);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

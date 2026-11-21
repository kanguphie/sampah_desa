import * as XLSX from 'xlsx';

// Helper export Excel untuk halaman Laporan SapaDesa.
// Menghasilkan file .xlsx yang tertata rapi: judul + periode, lebar kolom
// otomatis mengikuti isi, angka uang sebagai angka asli berformat ribuan,
// baris total, dan freeze di bawah baris header pertama.
//
// Catatan: paket `xlsx` (community) tidak mendukung styling sel (bold/warna),
// jadi kerapian dicapai lewat struktur: judul, lebar kolom, format angka,
// merge, dan freeze panes.

export interface ExcelSection {
    /** Judul seksi (baris tersendiri, mis. "RINCIAN IURAN WARGA (TUNAI)"). */
    title?: string;
    /** Header kolom, mis. ['No', 'Nama', 'Nominal']. */
    headers: string[];
    /** Baris data; angka uang diisi sebagai number (bukan string "Rp..."). */
    rows: (string | number)[][];
    /** Baris total (panjang sama dengan headers), mis. ['TOTAL', '', '', 123000]. */
    totals?: (string | number)[];
    /** Index kolom (0-based) yang berisi uang — diberi format ribuan #,##0. */
    moneyCols?: number[];
}

export interface ExportReportOptions {
    /** Judul laporan, mis. "Laporan Harian SapaDesa". */
    title: string;
    /** Keterangan periode, mis. "Tanggal: 21 November 2026". */
    subtitle?: string;
    sections: ExcelSection[];
    /** Nama file tanpa .xlsx, mis. "Laporan-Harian-2026-11-21". */
    filename: string;
    /** Nama sheet (maks 31 karakter, default = title). */
    sheetName?: string;
}

const NUM_FMT = '#,##0';

export function exportReportToExcel(opts: ExportReportOptions) {
    const { title, subtitle, sections, filename } = opts;
    const colCount = Math.max(1, ...sections.map((s) => s.headers.length));
    const aoa: (string | number)[][] = [];
    const merges: XLSX.Range[] = [];
    const moneyCells = new Set<string>();
    const mergedRows = new Set<number>();

    const pushMergedRow = (value: string) => {
        const r = aoa.length;
        const row: (string | number)[] = new Array(colCount).fill('');
        row[0] = value;
        aoa.push(row);
        mergedRows.add(r);
        if (colCount > 1) merges.push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
    };

    // Kop laporan
    pushMergedRow(title.toUpperCase());
    if (subtitle) pushMergedRow(subtitle);
    pushMergedRow(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`);
    aoa.push(new Array(colCount).fill(''));

    sections.forEach((sec) => {
        if (sec.title) pushMergedRow(sec.title);
        aoa.push([...sec.headers]);
        if (sec.rows.length === 0) {
            const row: (string | number)[] = new Array(colCount).fill('');
            row[0] = 'Tidak ada data';
            aoa.push(row);
        } else {
            sec.rows.forEach((row) => {
                const r = aoa.length;
                aoa.push([...row]);
                (sec.moneyCols || []).forEach((c) => {
                    if (typeof row[c] === 'number') moneyCells.add(`${r},${c}`);
                });
            });
        }
        if (sec.totals) {
            const r = aoa.length;
            aoa.push([...sec.totals]);
            (sec.moneyCols || []).forEach((c) => {
                if (typeof sec.totals![c] === 'number') moneyCells.add(`${r},${c}`);
            });
        }
        aoa.push(new Array(colCount).fill(''));
    });
    // Buang baris kosong terakhir
    if (aoa.length > 0 && aoa[aoa.length - 1].every((v) => v === '')) aoa.pop();

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (merges.length > 0) ws['!merges'] = merges;
    // Catatan: freeze panes tidak didukung paket `xlsx` community (0.18.5)
    // — penulisannya diabaikan, jadi tidak dipakai di sini.

    // Lebar kolom otomatis dari isi terpanjang (judul merged tidak dihitung)
    const widths: number[] = new Array(colCount).fill(10);
    const displayLen = (v: string | number) =>
        typeof v === 'number' ? v.toLocaleString('id-ID').length : String(v).length;
    aoa.forEach((row, r) => {
        if (mergedRows.has(r)) return;
        row.forEach((v, c) => {
            if (v === '' || v == null) return;
            widths[c] = Math.max(widths[c], Math.min(48, displayLen(v) + 2));
        });
    });
    ws['!cols'] = widths.map((w) => ({ wch: w }));

    // Format ribuan untuk sel uang
    moneyCells.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.z = NUM_FMT;
    });

    const wb = XLSX.utils.book_new();
    const sheetName = (opts.sheetName || title).replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Laporan';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

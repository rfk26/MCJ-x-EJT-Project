import React, { useState, useEffect } from "react";
import { FileSpreadsheet, X, Check, AlertCircle, Plus, Trash2, Calendar, Clipboard, HelpCircle } from "lucide-react";
import { PetyCashItem, Category } from "../types";

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: PetyCashItem[]) => void;
  categories: string[];
  defaultDate: string;
}

interface ParsedRow {
  id: string;
  selected: boolean;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export function parseDateString(str: string, fallbackDate: string): string {
  if (!str) return fallbackDate;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (dmy) {
    let day = parseInt(dmy[1], 10);
    let month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    if (month > 12 && day <= 12) {
      const tmp = day; day = month; month = tmp;
    }
    if (month < 1 || month > 12) return fallbackDate;
    if (day < 1 || day > 31) return fallbackDate;
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  // YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const mm = String(parseInt(ymd[2], 10)).padStart(2, "0");
    const dd = String(parseInt(ymd[3], 10)).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  return fallbackDate;
}

export function parseAmountNumber(str: string): number {
  if (!str) return 0;
  let cleaned = str.replace(/rp/gi, "").replace(/\s+/g, "");
  if (/\d+\.\d{3},\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/\d+,\d{3}\.\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (/\d+\.\d{3}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  } else if (/\d+,\d{3}$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, "");
  } else {
    cleaned = cleaned.replace(/[^0-9.]/g, "");
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export default function ExcelPasteModal({
  isOpen,
  onClose,
  onImport,
  categories,
  defaultDate,
}: ExcelPasteModalProps) {
  const [pasteText, setPasteText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [colMapping, setColMapping] = useState<{ [key: number]: "desc" | "amount" | "date" | "category" | "ignore" }>({
    0: "date",
    1: "category",
    2: "desc",
    3: "amount",
  });
  const [fallbackDate, setFallbackDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (defaultDate) {
      setFallbackDate(defaultDate);
    }
  }, [defaultDate]);

  // Auto-parse pasted text
  useEffect(() => {
    if (!pasteText.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = pasteText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const newRows: ParsedRow[] = [];

    lines.forEach((line, index) => {
      // Split by Tab or comma/semicolon if no tab
      let cols = line.split("\t");
      if (cols.length === 1 && line.includes(";")) {
        cols = line.split(";");
      } else if (cols.length === 1 && line.includes(",")) {
        // If csv line
        cols = line.split(",");
      }

      let desc = "";
      let amt = 0;
      let dateStr = fallbackDate;
      let cat = categories[0] || "Consumable";

      cols.forEach((colVal, colIdx) => {
        const val = colVal.trim();
        if (!val) return;

        const role = colMapping[colIdx];
        if (role === "desc") {
          desc = desc ? `${desc} ${val}` : val;
        } else if (role === "amount") {
          amt = parseAmountNumber(val);
        } else if (role === "date") {
          dateStr = parseDateString(val, fallbackDate);
        } else if (role === "category") {
          // Check if val matches a category
          const foundCat = categories.find(c => c.toLowerCase() === val.toLowerCase());
          cat = foundCat || val;
        }
      });

      // Fallback if role auto detection is needed or role unspecified
      if (!desc && cols[0]) desc = cols[0].trim();

      newRows.push({
        id: `excel-row-${Date.now()}-${index}-${Math.random()}`,
        selected: true,
        description: desc,
        amount: amt,
        date: dateStr,
        category: cat,
      });
    });

    setParsedRows(newRows);
  }, [pasteText, colMapping, fallbackDate, categories]);

  if (!isOpen) return null;

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleUpdateRow = (id: string, field: keyof ParsedRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddEmptyRow = () => {
    setParsedRows((prev) => [
      ...prev,
      {
        id: `excel-row-${Date.now()}-${Math.random()}`,
        selected: true,
        description: "",
        amount: 0,
        date: fallbackDate,
        category: categories[0] || "Consumable",
      },
    ]);
  };

  const selectedRows = parsedRows.filter((r) => r.selected && r.description.trim());
  const totalAmount = selectedRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleConfirmImport = () => {
    if (selectedRows.length === 0) {
      alert("Harap pilih minimal 1 item dengan deskripsi yang valid!");
      return;
    }

    const itemsToImport: PetyCashItem[] = selectedRows.map((r) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      description: r.description.trim(),
      amount: Number(r.amount) || 0,
      date: r.date || fallbackDate,
      category: r.category || categories[0] || "Consumable",
    }));

    onImport(itemsToImport);
    setPasteText("");
    setParsedRows([]);
    onClose();
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                Copy &amp; Paste Data Item dari Excel / Spreadsheet
              </h3>
              <p className="text-[11px] text-emerald-100">
                Salin kolom tabel dari Microsoft Excel atau Google Sheets lalu paste langsung di sini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          {/* Default Fallback Date & Guide toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Tanggal Default Item:</span>
              <input
                type="date"
                value={fallbackDate}
                onChange={(e) => setFallbackDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-slate-500 italic">(Dipakai jika baris Excel tidak memiliki tanggal)</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showInstructions ? "Sembunyikan Panduan" : "Lihat Panduan Format Excel"}</span>
            </button>
          </div>

          {/* Instructions Box */}
          {showInstructions && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2 animate-fade-in">
              <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                <Clipboard className="w-4 h-4" /> Cara Menggunakan:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-800 leading-relaxed">
                <li>Buka Microsoft Excel, Google Sheets, atau aplikasi Spreadsheet Anda.</li>
                <li>Atur kolom Excel dalam urutan: <strong className="font-semibold bg-emerald-100 px-1 rounded text-emerald-900">1. Tanggal | 2. Kategori | 3. Deskripsi | 4. Nominal (Rp)</strong>.</li>
                <li>Pilih (block) baris &amp; kolom data tersebut lalu tekan <strong className="font-mono bg-emerald-100 px-1 rounded">Ctrl+C</strong> (Copy).</li>
                <li>Kembali ke sini, klik di dalam kotak teks di bawah, lalu tekan <strong className="font-mono bg-emerald-100 px-1 rounded">Ctrl+V</strong> (Paste).</li>
                <li>Jika urutan kolom di Excel Anda berbeda, Anda bisa menyesuaikan menu <strong>Pengaturan Urutan Kolom (Mapping)</strong> di bawah.</li>
              </ol>
            </div>
          )}

          {/* Paste Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Paste Sel Data Excel Di Sini (Format: Tanggal | Kategori | Deskripsi | Nominal):</span>
              {pasteText && (
                <button
                  type="button"
                  onClick={() => setPasteText("")}
                  className="text-[10px] text-red-600 hover:underline cursor-pointer"
                >
                  Bersihkan Teks
                </button>
              )}
            </label>
            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Contoh salinan Excel (Tanggal [Tab] Kategori [Tab] Deskripsi [Tab] Nominal):&#10;20/07/2026&#9;Consumable&#9;Bensin Mobil Avanza&#9;150.000&#10;21/07/2026&#9;Material&#9;Semen Padang 5 Sak&#9;350.000&#10;22/07/2026&#9;Konsumsi&#9;Makan Lembur Tim&#9;85.000"
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner"
            />
          </div>

          {/* Column remapping control */}
          {pasteText.trim() && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                ⚙️ Pengaturan Urutan Kolom Excel (Mapping):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((colIdx) => (
                  <div key={colIdx} className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold block">Kolom {colIdx + 1} Excel</span>
                    <select
                      value={colMapping[colIdx] || "ignore"}
                      onChange={(e) =>
                        setColMapping((prev) => ({
                          ...prev,
                          [colIdx]: e.target.value as any,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="desc">Deskripsi</option>
                      <option value="amount">Nominal (Rp)</option>
                      <option value="date">Tanggal</option>
                      <option value="category">Kategori</option>
                      <option value="ignore">Abaikan</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋 Pratinjau Item Hasil Import ({parsedRows.length} Baris)</span>
              </h4>

              <button
                type="button"
                onClick={handleAddEmptyRow}
                className="text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Manual
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-2 w-10 text-center">No</th>
                      <th className="p-2 w-32">Tanggal Item</th>
                      <th className="p-2">Deskripsi Barang / Keperluan</th>
                      <th className="p-2 w-36">Kategori</th>
                      <th className="p-2 w-36 text-right">Nominal (Rp)</th>
                      <th className="p-2 w-10 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-medium italic">
                          Belum ada data. Silakan paste teks dari Excel pada kotak di atas.
                        </td>
                      </tr>
                    ) : (
                      parsedRows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !row.selected ? "opacity-40 bg-slate-50" : ""
                          }`}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => handleUpdateRow(row.id, "selected", e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => handleUpdateRow(row.id, "date", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleUpdateRow(row.id, "description", e.target.value)}
                              placeholder="Deskripsi item..."
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                            />
                          </td>
                          <td className="p-1.5">
                            <select
                              value={row.category}
                              onChange={(e) => handleUpdateRow(row.id, "category", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] focus:bg-white focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.amount ? new Intl.NumberFormat("id-ID").format(row.amount) : ""}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, "");
                                handleUpdateRow(row.id, "amount", clean ? Number(clean) : 0);
                              }}
                              placeholder="0"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-right focus:bg-white focus:ring-1 focus:ring-emerald-500 text-slate-900"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Siap diimpor: <span className="font-extrabold text-emerald-700 font-mono">{selectedRows.length} item</span> | Total Nominal:{" "}
            <span className="font-extrabold text-slate-900 font-mono">{formatIDR(totalAmount)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedRows.length === 0}
              className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRows.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <Check className="w-4 h-4" /> Import {selectedRows.length} Item Ke Tabel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

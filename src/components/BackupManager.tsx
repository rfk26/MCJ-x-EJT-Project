import React from "react";
import { Project, Transaction, ActivityLog, ProjectStatus } from "../types";
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  Trash2, 
  FileJson, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from "lucide-react";

interface BackupManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  activities?: ActivityLog[];
  setActivities?: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  categories?: string[];
  setCategories?: React.Dispatch<React.SetStateAction<string[]>>;
  setAppToast: (toast: { message: string; type: "success" | "info" } | null) => void;
}

interface LocalBackup {
  id: string;
  timestamp: string;
  projectCount: number;
  transactionCount: number;
  projects: Project[];
  transactions: Transaction[];
  activities?: ActivityLog[];
  categories?: string[];
}

export default function BackupManager({
  projects,
  setProjects,
  transactions,
  setTransactions,
  activities = [],
  setActivities,
  categories = [],
  setCategories,
  setAppToast,
}: BackupManagerProps) {
  const [autoBackups, setAutoBackups] = React.useState<LocalBackup[]>([]);
  const [lastAutoBackupTime, setLastAutoBackupTime] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Load backups list on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("mcj_auto_backups_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAutoBackups(parsed);
          if (parsed.length > 0) {
            setLastAutoBackupTime(parsed[0].timestamp);
          }
        }
      } catch (e) {
        console.error("Failed to parse auto-backups", e);
      }
    }
  }, []);

  // AUTO-BACKUP TRIGGER: Automatically run a silent backup in localStorage on modifications
  React.useEffect(() => {
    if (projects.length === 0 && transactions.length === 0) return;

    const saved = localStorage.getItem("mcj_auto_backups_history");
    let currentHistory: LocalBackup[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          currentHistory = parsed;
        }
      } catch (e) {}
    }

    // Verify if current state differs from the latest backup in history
    if (currentHistory.length > 0) {
      const latest = currentHistory[0];
      const isIdentical = 
        latest.projectCount === projects.length && 
        latest.transactionCount === transactions.length &&
        JSON.stringify(latest.projects) === JSON.stringify(projects) &&
        JSON.stringify(latest.transactions) === JSON.stringify(transactions);
      
      if (isIdentical) {
        return; // Skip duplicating
      }
    }

    const timestampStr = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newBackup: LocalBackup = {
      id: "backup_" + Date.now(),
      timestamp: timestampStr,
      projectCount: projects.length,
      transactionCount: transactions.length,
      projects: JSON.parse(JSON.stringify(projects)),
      transactions: JSON.parse(JSON.stringify(transactions)),
      activities: JSON.parse(JSON.stringify(activities)),
      categories: JSON.parse(JSON.stringify(categories)),
    };

    const updatedHistory = [newBackup, ...currentHistory].slice(0, 5);
    localStorage.setItem("mcj_auto_backups_history", JSON.stringify(updatedHistory));
    setAutoBackups(updatedHistory);
    setLastAutoBackupTime(timestampStr);
  }, [projects, transactions, activities, categories]);

  // Download complete dataset as JSON file
  const handleDownloadBackup = () => {
    const backupData = {
      appName: "CV MCJ x EJT Expense Tracker",
      version: "1.0",
      createdAt: new Date().toISOString(),
      dataset: {
        projects,
        transactions,
        activities,
        categories,
      },
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `BACKUP_MCJ_EJT_${dateStr}_${timeStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setAppToast({
      message: "File backup JSON berhasil diunduh ke komputer Anda.",
      type: "success",
    });
  };

  // Helper function to validate, sanitize, and restore backup data object
  const validateAndRestore = (data: any): boolean => {
    if (!data || typeof data !== "object") return false;

    let targetProjects: any[] = [];
    let targetTransactions: any[] = [];
    let targetActivities: any[] = [];
    let targetCategories: any[] = [];

    // Extract dataset arrays from standard envelope or direct object root
    if (data.dataset && typeof data.dataset === "object") {
      if (Array.isArray(data.dataset.projects)) targetProjects = data.dataset.projects;
      if (Array.isArray(data.dataset.transactions)) targetTransactions = data.dataset.transactions;
      if (Array.isArray(data.dataset.activities)) targetActivities = data.dataset.activities;
      if (Array.isArray(data.dataset.categories)) targetCategories = data.dataset.categories;
    } else {
      if (Array.isArray(data.projects)) targetProjects = data.projects;
      if (Array.isArray(data.transactions)) targetTransactions = data.transactions;
      if (Array.isArray(data.activities)) targetActivities = data.activities;
      if (Array.isArray(data.categories)) targetCategories = data.categories;
    }

    if (!Array.isArray(targetProjects) || !Array.isArray(targetTransactions)) {
      return false;
    }

    // Sanitize and normalize every project object to guarantee safe properties
    const sanitizedProjects: Project[] = targetProjects.map((p: any, idx: number) => {
      if (!p || typeof p !== "object") {
        return {
          id: `proj-${Date.now()}-${idx}`,
          name: `Proyek Restored ${idx + 1}`,
          code: `PRJ-${idx + 1}`,
          manager: "Admin",
          pic: "Admin",
          status: ProjectStatus.PROGRES,
          startDate: new Date().toISOString().split("T")[0],
          expectedProfitPercent: 35,
          contractValue: { piping: 0, electrical: 0, mechanical: 0, scafolder: 0, welder: 0 },
          ppnPercent: 11,
          pphPercent: 4,
          budgetThresholdPercent: 85,
        };
      }

      return {
        id: String(p.id || `proj-${Date.now()}-${idx}`),
        name: String(p.name || `Proyek Restored ${idx + 1}`),
        code: String(p.code || p.name || `PRJ-${idx + 1}`),
        manager: String(p.manager || "Admin"),
        pic: String(p.pic || p.manager || "Admin"),
        status: p.status || ProjectStatus.PROGRES,
        startDate: p.startDate || new Date().toISOString().split("T")[0],
        expectedProfitPercent: Number(p.expectedProfitPercent) || 35,
        contractValue: {
          piping: Number(p.contractValue?.piping) || 0,
          electrical: Number(p.contractValue?.electrical) || 0,
          mechanical: Number(p.contractValue?.mechanical) || 0,
          scafolder: Number(p.contractValue?.scafolder) || 0,
          welder: Number(p.contractValue?.welder) || 0,
        },
        ppnPercent: Number(p.ppnPercent) || 11,
        pphPercent: Number(p.pphPercent) || 4,
        budgetThresholdPercent: Number(p.budgetThresholdPercent) || 85,
        notes: p.notes || "",
        contractNames: p.contractNames || {},
        company: p.company || "",
        poNo: p.poNo || "",
        customContractItems: Array.isArray(p.customContractItems) ? p.customContractItems : [],
        targetCompletionDate: p.targetCompletionDate || "",
      };
    });

    // Sanitize and normalize every transaction object
    const sanitizedTransactions: Transaction[] = targetTransactions.map((t: any, idx: number) => {
      if (!t || typeof t !== "object") {
        return {
          id: `tx-${Date.now()}-${idx}`,
          projectId: sanitizedProjects[0]?.id || "unknown",
          type: "PetyCash",
          pic: "Admin",
          date: new Date().toISOString().split("T")[0],
          amount: 0,
          status: "Selesai",
          description: "Transaksi restored",
          category: "Lain - Lain",
        };
      }

      return {
        id: String(t.id || `tx-${Date.now()}-${idx}`),
        projectId: String(t.projectId || sanitizedProjects[0]?.id || ""),
        type: t.type || "PetyCash",
        pic: String(t.pic || "Admin"),
        date: t.date || new Date().toISOString().split("T")[0],
        amount: Number(t.amount) || 0,
        status: t.status || "Selesai",
        description: t.description || "",
        invoiceNo: t.invoiceNo || "",
        petyCashNo: t.petyCashNo || "",
        poNo: t.poNo || "",
        supplier: t.supplier || "",
        paymentMethod: t.paymentMethod || "",
        category: t.category || "Lain - Lain",
        items: Array.isArray(t.items) ? t.items : [],
        contractItems: Array.isArray(t.contractItems) ? t.contractItems : [],
        company: t.company || "",
        requestId: t.requestId || "",
        transferProof: t.transferProof || "",
      };
    });

    try {
      localStorage.setItem("mcj_projects", JSON.stringify(sanitizedProjects));
      localStorage.setItem("mcj_transactions", JSON.stringify(sanitizedTransactions));
      if (targetActivities.length > 0) {
        localStorage.setItem("mcj_activities", JSON.stringify(targetActivities));
      }
      if (targetCategories.length > 0) {
        localStorage.setItem("mcj_categories", JSON.stringify(targetCategories));
      }

      setProjects(sanitizedProjects);
      setTransactions(sanitizedTransactions);

      if (setActivities && targetActivities.length > 0) {
        setActivities(targetActivities);
      }
      if (setCategories && targetCategories.length > 0) {
        setCategories(targetCategories);
      }
      return true;
    } catch (err) {
      console.error("Error setting restored state:", err);
      return false;
    }
  };

  // Handle File Upload Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = validateAndRestore(json);
        if (success) {
          setAppToast({
            message: "Berhasil memulihkan seluruh data dari file JSON backup!",
            type: "success",
          });
        } else {
          alert("Gagal memulihkan: Format file JSON tidak valid atau struktur data tidak sesuai.");
        }
      } catch (err) {
        alert("Gagal membaca file: File tidak berupa JSON yang valid.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Restore state from rolling browser snapshot history
  const handleRestoreFromLocal = (backup: LocalBackup) => {
    if (window.confirm(`Apakah Anda yakin ingin memulihkan data ke kondisi tanggal ${backup.timestamp}? Data saat ini akan digantikan.`)) {
      const success = validateAndRestore({
        projects: backup.projects,
        transactions: backup.transactions,
        activities: backup.activities,
        categories: backup.categories,
      });

      if (success) {
        setAppToast({
          message: `Berhasil memulihkan data ke snapshot ${backup.timestamp}`,
          type: "success",
        });
      } else {
        alert("Gagal memulihkan snapshot lokal.");
      }
    }
  };

  // Delete specific backup in list
  const handleDeleteLocalBackup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = autoBackups.filter((b) => b.id !== id);
    localStorage.setItem("mcj_auto_backups_history", JSON.stringify(updated));
    setAutoBackups(updated);
    setAppToast({
      message: "Snapshot backup lokal berhasil dihapus.",
      type: "info",
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Pusat Pengamanan &amp; Backup Data
            </h2>
            <p className="text-xs text-gray-500 max-w-xl">
              Gunakan fitur ini untuk mencadangkan seluruh data proyek konstruksi, pengajuan petty cash, belanja riil, dan invoice ke dalam file lokal untuk pengamanan ganda.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistem Auto-Backup Aktif secara Lokal</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DOWNLOAD CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Ekspor File Backup (Unduh)</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Unduh file <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-red-600">.json</code> utuh berisi seluruh data proyek dan transaksi yang ada di memori aplikasi saat ini. Simpan file ini dengan aman di komputer Anda.
              </p>
            </div>
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 space-y-1.5 text-[10px] text-blue-800">
              <div className="flex justify-between">
                <span>Total Proyek Terdeteksi:</span>
                <span className="font-bold">{projects.length} Proyek</span>
              </div>
              <div className="flex justify-between">
                <span>Total Transaksi Terdeteksi:</span>
                <span className="font-bold">{transactions.length} Item</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-md"
          >
            <Download className="w-4 h-4" /> Unduh Backup JSON Sekarang
          </button>
        </div>

        {/* RESTORE CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Import File Backup (Restore)</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Kembalikan data Anda yang hilang dengan cara mengupload kembali file backup <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-indigo-600">.json</code> yang sudah pernah diunduh sebelumnya.
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[90px] ${
                isDragOver
                  ? "border-blue-500 bg-blue-50/40"
                  : "border-gray-200 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <FileJson className="w-6 h-6 text-indigo-500" />
              <span className="text-[10px] font-bold text-gray-700">
                {isDragOver ? "Letakkan file di sini!" : "Klik atau Tarik file JSON ke sini"}
              </span>
              <span className="text-[9px] text-gray-400">Hanya file berekstensi .json hasil ekspor</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Pilih File JSON Lokal
          </button>
        </div>

        {/* INFO AND CAUTION CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Petunjuk Penting Keamanan</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Aplikasi ini bekerja sepenuhnya offline dan menyimpan data di memori penyimpanan browser lokal (localStorage).
              </p>
            </div>
            <div className="space-y-2 text-[10px] text-gray-600 leading-relaxed">
              <div className="flex gap-2">
                <span className="font-extrabold text-amber-600 shrink-0">⚠️ PENTING:</span>
                <span>Membersihkan riwayat browser (Clear Cache / Browser Storage) dapat menghapus data Anda secara permanen.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-extrabold text-blue-600 shrink-0">💡 TIPS:</span>
                <span>Lakukan pengunduhan backup JSON secara berkala setelah melakukan banyak inputan proyek maupun pengeluaran kas baru.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-gray-100 flex items-center gap-2 text-[10px] text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Terakhir Auto-Save: <strong className="text-gray-700 font-mono">{lastAutoBackupTime || "Belum ada"}</strong></span>
          </div>
        </div>

      </div>

      {/* AUTO-BACKUP SNAPSHOT HISTORY (ROLLING 5 RECENT STATE SNAPSHOTS) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
            Riwayat Snapshot Auto-Backup Lokal (Rolling 5 Versi Terbaru)
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Sistem secara otomatis mengabadikan kondisi data sesaat setelah Anda mengedit atau menambahkan data. Anda bisa langsung kembali ke versi ini jika terjadi kesalahan input.
          </p>
        </div>

        {autoBackups.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            Belum ada riwayat snapshot otomatis yang terekam. Masukkan beberapa data untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <th className="p-3">Waktu Pencadangan</th>
                  <th className="p-3">Jumlah Proyek</th>
                  <th className="p-3">Jumlah Transaksi</th>
                  <th className="p-3 text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {autoBackups.map((backup, idx) => (
                  <tr key={backup.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 flex items-center gap-2 font-semibold">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{backup.timestamp}</span>
                      {idx === 0 && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Terbaru
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{backup.projectCount} Proyek</td>
                    <td className="p-3 text-slate-500">{backup.transactionCount} Transaksi</td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreFromLocal(backup)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Rollback Ke Sini
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLocalBackup(backup.id, e)}
                          title="Hapus snapshot ini"
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

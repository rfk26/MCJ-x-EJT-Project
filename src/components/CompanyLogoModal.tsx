import React, { useState, useEffect } from "react";
import { Upload, X, Check, Image as ImageIcon, RotateCcw, AlertCircle, Building2, Sparkles, HelpCircle } from "lucide-react";

interface CompanyLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customLogo: string | null;
  customLogoEJT: string | null;
  onSaveLogo: (logoMCJ: string | null, logoEJT: string | null) => void;
}

export default function CompanyLogoModal({
  isOpen,
  onClose,
  customLogo,
  customLogoEJT,
  onSaveLogo,
}: CompanyLogoModalProps) {
  const [logoMCJInput, setLogoMCJInput] = useState<string | null>(customLogo || null);
  const [logoEJTInput, setLogoEJTInput] = useState<string | null>(customLogoEJT || null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInputMCJ, setUrlInputMCJ] = useState("");
  const [urlInputEJT, setUrlInputEJT] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLogoMCJInput(customLogo || null);
    setLogoEJTInput(customLogoEJT || null);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [customLogo, customLogoEJT, isOpen]);

  if (!isOpen) return null;

  // File Upload Handler (reads file as Base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "MCJ" | "EJT") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Harap pilih file gambar yang valid (PNG, JPG, SVG, WEBP, GIF).");
      return;
    }

    // Limit size to 3MB
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg("Ukuran file gambar maksimal 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (target === "MCJ") {
          setLogoMCJInput(result);
        } else {
          setLogoEJTInput(result);
        }
        setErrorMsg(null);
        setSuccessMsg(`Logo ${target} berhasil diunggah! Klik Simpan untuk menerapkan.`);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (target: "MCJ" | "EJT") => {
    const url = target === "MCJ" ? urlInputMCJ.trim() : urlInputEJT.trim();
    if (!url) {
      setErrorMsg("Harap masukkan URL gambar yang valid.");
      return;
    }

    if (target === "MCJ") {
      setLogoMCJInput(url);
      setUrlInputMCJ("");
    } else {
      setLogoEJTInput(url);
      setUrlInputEJT("");
    }
    setErrorMsg(null);
    setSuccessMsg(`URL logo ${target} berhasil dimuat!`);
  };

  const handleResetDefault = () => {
    setLogoMCJInput(null);
    setLogoEJTInput(null);
    setErrorMsg(null);
    setSuccessMsg("Logo dikembalikan ke format vektor default.");
  };

  const handleSave = () => {
    onSaveLogo(logoMCJInput, logoEJTInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/60 rounded-xl border border-blue-600/50">
              <Building2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">
                Pengaturan Logo Perusahaan (Upload Manual)
              </h3>
              <p className="text-[11px] text-blue-100">
                Ganti logo CV. Mandiri Cipta Jaya &amp; PT. Elqia Jaya Teknik secara manual
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-[80vh]">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Logo Preview Area */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Pratinjau Logo Saat Ini:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo 1 (MCJ / Primary) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2 text-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Logo CV. Mandiri Cipta Jaya (MCJ)
                </span>
                <div className="w-28 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                  {logoMCJInput ? (
                    <img
                      src={logoMCJInput}
                      alt="Preview Logo MCJ"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold italic">Logo Default Vektor</div>
                  )}
                </div>
                {logoMCJInput && (
                  <button
                    type="button"
                    onClick={() => setLogoMCJInput(null)}
                    className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Hapus Logo kustom
                  </button>
                )}
              </div>

              {/* Logo 2 (EJT / Secondary) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2 text-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Logo PT. Elqia Jaya Teknik (EJT)
                </span>
                <div className="w-28 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-center shadow-inner relative overflow-hidden">
                  {logoEJTInput ? (
                    <img
                      src={logoEJTInput}
                      alt="Preview Logo EJT"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold italic">Logo Default Vektor</div>
                  )}
                </div>
                {logoEJTInput && (
                  <button
                    type="button"
                    onClick={() => setLogoEJTInput(null)}
                    className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Hapus Logo kustom
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upload Method Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "upload"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File dari Komputer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "url"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Tempel URL Gambar
              </button>
            </div>

            {/* Upload File Tab */}
            {activeTab === "upload" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload MCJ */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Upload Logo MCJ:
                  </span>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-850">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Pilih File Logo MCJ</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WEBP (Maks 3MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "MCJ")}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Upload EJT */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Upload Logo EJT:
                  </span>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-850">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Pilih File Logo EJT</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG, WEBP (Maks 3MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "EJT")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* URL Input Tab */}
            {activeTab === "url" && (
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Logo MCJ:</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://domain.com/logo-mcj.png"
                      value={urlInputMCJ}
                      onChange={(e) => setUrlInputMCJ(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyUrl("MCJ")}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Logo EJT:</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://domain.com/logo-ejt.png"
                      value={urlInputEJT}
                      onChange={(e) => setUrlInputEJT(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyUrl("EJT")}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke Logo Default
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Simpan Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

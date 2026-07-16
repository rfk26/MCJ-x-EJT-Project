/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction } from "../types";
import { Plus, ListFilter, Search, FileText, Trash2, Printer, CheckCircle2, AlertTriangle, Calendar, Landmark, CheckSquare, Clock, ArrowUpRight, Grid, Table, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InvoiceManagerProps {
  projects: Project[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  selectedProjectId: string;
  isReadOnly?: boolean;
  onAddActivity?: (
    type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice",
    action: string,
    description: string,
    pic: string,
    projectId?: string
  ) => void;
}

export default function InvoiceManager({
  projects,
  transactions,
  setTransactions,
  selectedProjectId,
  onAddActivity,
  isReadOnly = false,
}: InvoiceManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"table" | "list">("table");

  // Form Fields
  const [projectId, setProjectId] = React.useState(selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id || ""));
  const [invoiceNo, setInvoiceNo] = React.useState("");
  const [recipient, setRecipient] = React.useState(""); // Owner Name
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = React.useState<number>(0);
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("Sudah Dikirim");
  const [company, setCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [customCompany, setCustomCompany] = React.useState("");

  // Filter States
  const [filterProject, setFilterProject] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Custom Modal Confirmation for Delete & Alert States
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<Transaction | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Automatically adjust Client Recipient & Company based on selected project
  React.useEffect(() => {
    if (projectId) {
      const selectedProj = projects.find((p) => p.id === projectId);
      if (selectedProj) {
        // Find owner or fallback to custom PIC
        setRecipient(selectedProj.pic || selectedProj.manager || "");
        if (selectedProj.company) {
          if (selectedProj.company === "CV. Mandiri Cipta Jaya" || selectedProj.company === "PT. Elqia Jaya Teknik") {
            setCompany(selectedProj.company);
          } else {
            setCompany("Lainnya");
            setCustomCompany(selectedProj.company);
          }
        }
      }
    }
  }, [projectId, projects]);

  // Generate automated invoice number suggestion
  React.useEffect(() => {
    if (showAddForm && !invoiceNo && !editingInvoiceId) {
      const invoiceTxs = transactions.filter((t) => t.type === "Invoice");
      const nextNum = invoiceTxs.length + 1;
      setInvoiceNo(`INV/MCJ-EJT/${String(nextNum).padStart(3, "0")}/2026`);
    }
  }, [showAddForm, transactions, editingInvoiceId]);

  const handleEditInvoice = (inv: Transaction) => {
    setEditingInvoiceId(inv.id);
    setProjectId(inv.projectId);
    setInvoiceNo(inv.invoiceNo || "");
    setRecipient(inv.supplier || "");
    setDate(inv.date || "");
    setAmount(inv.amount || 0);
    // Strip "[Invoice Sent] " prefix if present to keep description clean
    const cleanDesc = inv.description?.replace("[Invoice Sent] ", "") || "";
    setDescription(cleanDesc);
    setStatus(inv.status || "Sudah Dikirim");
    if (inv.company) {
      if (inv.company === "CV. Mandiri Cipta Jaya" || inv.company === "PT. Elqia Jaya Teknik") {
        setCompany(inv.company);
      } else {
        setCompany("Lainnya");
        setCustomCompany(inv.company);
      }
    }
    setShowAddForm(true);
    // Scroll to form smoothly
    setTimeout(() => {
      const el = document.getElementById("invoice-form-card");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleCancelEdit = () => {
    setEditingInvoiceId(null);
    setInvoiceNo("");
    setAmount(0);
    setDescription("");
    setStatus("Sudah Dikirim");
    setShowAddForm(false);
  };

  // Handle invoice submission
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !invoiceNo || !recipient || !description) {
      setValidationError("Harap lengkapi semua isian wajib (Proyek, Nomor Invoice, Owner, Deskripsi)!");
      return;
    }

    if (amount <= 0) {
      setValidationError("Nilai Invoice Tagihan harus lebih dari Rp 0!");
      return;
    }

    setValidationError(null);

    if (editingInvoiceId) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === editingInvoiceId) {
            return {
              ...t,
              projectId,
              date,
              invoiceNo,
              supplier: recipient,
              status,
              description: description.startsWith("[Invoice Sent] ") ? description : `[Invoice Sent] ${description}`,
              amount,
              company: company === "Lainnya" ? customCompany : company,
            };
          }
          return t;
        })
      );
      if (onAddActivity) {
        const proj = projects.find((p) => p.id === projectId);
        const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
        onAddActivity(
          "invoice",
          "Invoice Diperbarui",
          `Memperbarui invoice tagihan [${invoiceNo}] menjadi sebesar ${displayAmt} untuk owner/klien "${recipient}"`,
          "Finance Admin",
          projectId
        );
      }
      setAlertMessage("Invoice berhasil diperbarui!");
      setEditingInvoiceId(null);
      setInvoiceNo("");
      setAmount(0);
      setDescription("");
      setStatus("Sudah Dikirim");
      setShowAddForm(false);
      return;
    }

    const newInvoice: Transaction = {
      id: `invoice-${Date.now()}`,
      projectId,
      type: "Invoice",
      pic: "Finance Admin",
      date,
      invoiceNo,
      supplier: recipient, // Owner name
      status, // "Sudah Dikirim" / "Belum Dikirim"
      description: `[Invoice Sent] ${description}`,
      category: "Material", // required by Category type
      amount,
      company: company === "Lainnya" ? customCompany : company,
    };

    setTransactions((prev) => [newInvoice, ...prev]);
    if (onAddActivity) {
      const proj = projects.find((p) => p.id === projectId);
      const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
      onAddActivity(
        "invoice",
        "Invoice Diinput",
        `Mencatat invoice tagihan [${invoiceNo}] sebesar ${displayAmt} untuk owner/klien "${recipient}"`,
        "Finance Admin",
        projectId
      );
    }
    setAlertMessage("Invoice berhasil dicatat!");

    // Reset Form fields
    setInvoiceNo("");
    setAmount(0);
    setDescription("");
    setStatus("Sudah Dikirim");
    setShowAddForm(false);
  };

  const triggerDeleteInvoice = (inv: Transaction) => {
    setInvoiceToDelete(inv);
  };

  const confirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    const inv = invoiceToDelete;
    setTransactions((prev) => prev.filter((t) => t.id !== inv.id));
    setInvoiceToDelete(null);
    setAlertMessage(`Invoice "${inv.invoiceNo}" berhasil dihapus.`);
  };

  const updateInvoiceStatus = (id: string, newStatus: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // List of Invoices
  const invoiceList = transactions.filter((t) => t.type === "Invoice");

  const filteredInvoices = invoiceList.filter((inv) => {
    // Project filter
    if (filterProject !== "all" && inv.projectId !== filterProject) return false;

    // Status filter
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const invNoMatch = inv.invoiceNo?.toLowerCase().includes(q);
      const recipientMatch = inv.supplier?.toLowerCase().includes(q);
      const descMatch = inv.description?.toLowerCase().includes(q);
      return invNoMatch || recipientMatch || descMatch;
    }

    return true;
  });

  // Calculate invoice statistics
  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalSent = filteredInvoices.filter((inv) => inv.status !== "Belum Dikirim").reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnsent = filteredInvoices.filter((inv) => inv.status === "Belum Dikirim").reduce((sum, inv) => sum + inv.amount, 0);

  // Print single Invoice details
  const printInvoiceVoucher = (inv: Transaction, proj?: Project) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pencetakan. Harap izinkan popup di browser Anda.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Bukti Pengiriman Invoice - ${inv.invoiceNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .company-sub { font-size: 11px; color: #666; margin-top: 5px; }
            .title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 30px 0; letter-spacing: 1.5px; text-decoration: underline; }
            .info-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .info-table td { padding: 6px 0; font-size: 13px; vertical-align: top; }
            .info-table td.label { font-weight: bold; width: 150px; }
            .info-table td.colon { width: 15px; text-align: center; }
            .items-table th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 12px; font-size: 12px; font-weight: bold; text-align: left; }
            .items-table td { border: 1px solid #ddd; padding: 12px; font-size: 12px; }
            .total-row td { font-weight: bold; font-size: 14px; background-color: #fafafa; }
            .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 220px; text-align: center; font-size: 13px; }
            .signature-space { height: 80px; }
            .footer-note { text-align: center; font-size: 10px; color: #999; margin-top: 100px; border-top: 1px solid #eee; padding-top: 10px; }
            @media print {
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${inv.company || "CV. MANDIRI CIPTA JAYA"}</div>
            <div class="company-sub">SISTEM MANAJEMEN KEUANGAN KONSTRUKSI &amp; PROJECT TRACKER</div>
          </div>

          <div class="title">BUKTI PENCATATAN INVOICE (KIRIM TAGIHAN)</div>

          <table class="info-table">
            <tr>
              <td class="label">Nomor Invoice</td>
              <td class="colon">:</td>
              <td style="font-family: monospace; font-weight: bold; font-size: 14px;">${inv.invoiceNo}</td>
            </tr>
            <tr>
              <td class="label">Tanggal Pengiriman</td>
              <td class="colon">:</td>
              <td>${inv.date}</td>
            </tr>
            <tr>
              <td class="label">Proyek Terkait</td>
              <td class="colon">:</td>
              <td><strong>[${proj?.code || "N/A"}] ${proj?.name || "Proyek Dihapus"}</strong></td>
            </tr>
            <tr>
              <td class="label">Owner</td>
              <td class="colon">:</td>
              <td>${inv.supplier}</td>
            </tr>
            <tr>
              <td class="label">Status Invoice</td>
              <td class="colon">:</td>
              <td><span style="border: 1px solid #333; padding: 2px 8px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${inv.status}</span></td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">No</th>
                <th>Deskripsi Pekerjaan / Tagihan</th>
                <th style="width: 200px; text-align: right;">Jumlah Nominal (IDR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td>${inv.description}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatIDR(inv.amount)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right; text-transform: uppercase;">Total Piutang Tagihan:</td>
                <td style="text-align: right; font-family: monospace; color: #d32f2f;">${formatIDR(inv.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-area">
            <div class="signature-box">
              <p>Disiapkan Oleh,</p>
              <div class="signature-space"></div>
              <p style="text-decoration: underline; font-weight: bold;">Finance &amp; Admin Dept</p>
              <p style="font-size: 11px; color: #777;">CV. Mandiri Cipta Jaya</p>
            </div>
            <div class="signature-box">
              <p>Diketahui Oleh,</p>
              <div class="signature-space"></div>
              <p style="text-decoration: underline; font-weight: bold;">${proj?.manager || "Project Manager"}</p>
              <p style="font-size: 11px; color: #777;">Manager Proyek Lapangan</p>
            </div>
          </div>

          <div class="footer-note">
            Dokumen cetakan komputer ini sah sebagai tanda bukti pengiriman invoice internal sistem. Dicetak tanggal: ${new Date().toLocaleString("id-ID")}
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Cetak Dokumen</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="invoice-manager-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5.5 h-5.5 text-blue-600" />
            Manajemen Invoice (Tagihan Dikirim) {isReadOnly && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">ReadOnly</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Catat invoice yang telah dikirim ke Owner/Client. Data tagihan ini otomatis memengaruhi perhitungan pendapatan masuk dan analisis proyek.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Input Invoice Baru
          </button>
        )}
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            📄
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Nilai Invoice</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">{formatIDR(totalInvoiced)}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">{filteredInvoices.length} Lembar Tagihan</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            ✓
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sudah Dikirim</p>
            <p className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">{formatIDR(totalSent)}</p>
            <p className="text-[10px] text-emerald-600/70 mt-1 font-bold">
              {totalInvoiced > 0 ? ((totalSent / totalInvoiced) * 100).toFixed(0) : 0}% Terkirim ke Owner
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            ⏳
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Belum Dikirim</p>
            <p className="text-lg font-extrabold text-amber-600 font-mono mt-0.5">{formatIDR(totalUnsent)}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">Draf / Menunggu Dikirim</p>
          </div>
        </div>
      </div>

      {/* NEW INVOICE FORM */}
      {showAddForm && (
        <motion.div
          id="invoice-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-blue-500/20 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-blue-500/5 p-4 border-b border-blue-500/10 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900">
              {editingInvoiceId ? "Form Edit Invoice Tagihan" : "Form Pencatatan Invoice Baru"}
            </h3>
          </div>

          <form onSubmit={handleCreateInvoice} className="p-6 space-y-5">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Project Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Hubungkan Ke Proyek <span className="text-red-500">*</span></label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="" disabled>-- Pilih Proyek Terkait --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nomor Invoice Tagihan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: INV/MCJ-EJT/045/2026"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              {/* Recipient */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Owner <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT SMART MARUNDA"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tanggal Pengiriman <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nominal Tagihan (Rp) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 15.000.000"
                  value={amount ? new Intl.NumberFormat("id-ID").format(amount) : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setAmount(clean ? Number(clean) : 0);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-gray-400 font-mono block mt-1">{formatIDR(amount)}</span>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="Sudah Dikirim">Sudah Dikirim</option>
                  <option value="Belum Dikirim">Belum Dikirim</option>
                </select>
              </div>

              {/* Company Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nama Perusahaan Penagih</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
                  <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
                  <option value="Lainnya">Nama Perusahaan Kustom</option>
                </select>
                {company === "Lainnya" && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik Nama Perusahaan..."
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs mt-1.5 focus:ring-1 focus:ring-blue-600"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Rincian Pekerjaan / Termin Penagihan <span className="text-red-500">*</span></label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Penagihan Termin I (DP 30%) Proyek Piping PT SMART Marunda"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (editingInvoiceId) {
                    handleCancelEdit();
                  } else {
                    setShowAddForm(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingInvoiceId ? "Simpan Perubahan Invoice" : "Kirim & Catat Tagihan"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* FILTER PANEL */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <ListFilter className="w-4 h-4 text-blue-600" /> Saring &amp; Cari Invoice Tagihan
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Tabel
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> List Kartu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Berdasarkan Proyek</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Status Invoice</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="Sudah Dikirim">Sudah Dikirim</option>
              <option value="Belum Dikirim">Belum Dikirim</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Cari Owner / No Invoice / Deskripsi</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500">
            Ditemukan <strong className="text-gray-900">{filteredInvoices.length}</strong> invoice dari total{" "}
            <strong>{invoiceList.length}</strong>
          </span>
          <span className="text-slate-500 font-semibold">
            Total Saringan Tagihan: <strong className="text-blue-600 font-mono text-sm">{formatIDR(totalInvoiced)}</strong>
          </span>
        </div>
      </div>

      {/* RECORDINGS DISPLAY (LIST AND TABLE VIEW) */}
      {viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Nomor Invoice</th>
                  <th className="p-3.5">Owner</th>
                  <th className="p-3.5">Proyek Terkait</th>
                  <th className="p-3.5">Deskripsi Tagihan</th>
                  <th className="p-3.5 text-right">Nominal Tagihan</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                      Tidak ditemukan data Invoice Tagihan.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const proj = projects.find((p) => p.id === inv.projectId);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        {/* Date */}
                        <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono">
                          {inv.date}
                        </td>

                        {/* Invoice No */}
                        <td className="p-3.5 whitespace-nowrap font-mono space-y-0.5">
                          <div className="font-bold text-slate-700">{inv.invoiceNo}</div>
                          {inv.company && (
                            <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider font-sans">
                              🏢 {inv.company}
                            </div>
                          )}
                        </td>

                        {/* Client */}
                        <td className="p-3.5 font-bold text-slate-800">
                          {inv.supplier}
                        </td>

                        {/* Project */}
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-700 truncate max-w-[140px]" title={proj?.name}>
                            {proj ? proj.name : "Proyek Dihapus"}
                          </p>
                          <p className="text-[9px] text-gray-400 font-mono">CODE: {proj?.code || "-"}</p>
                        </td>

                        {/* Description */}
                        <td className="p-3.5 max-w-xs">
                          <p className="text-slate-900 font-medium leading-relaxed" style={{ wordBreak: "break-word" }}>
                            {inv.description.replace("[Invoice Sent] ", "")}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="p-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                          {formatIDR(inv.amount)}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {isReadOnly ? (
                            <span
                              className={`text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border ${
                                inv.status === "Sudah Dikirim"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {inv.status === "Sudah Dikirim" ? "✓ Sudah Dikirim" : "⏳ Belum Dikirim"}
                            </span>
                          ) : inv.status === "Belum Dikirim" ? (
                            <button
                              onClick={() => updateInvoiceStatus(inv.id, "Sudah Dikirim")}
                              className="bg-amber-50 hover:bg-emerald-500 hover:text-white text-amber-800 border border-amber-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                              title="Tandai Sudah Dikirim"
                            >
                              ⏳ Belum Dikirim
                            </button>
                          ) : (
                            <button
                              onClick={() => updateInvoiceStatus(inv.id, "Belum Dikirim")}
                              className="bg-emerald-50 hover:bg-amber-500 hover:text-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                              title="Tandai Belum Dikirim"
                            >
                              ✓ Sudah Dikirim
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => printInvoiceVoucher(inv, proj)}
                              className="text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Cetak Bukti Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => handleEditInvoice(inv)}
                                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Invoice"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => triggerDeleteInvoice(inv)}
                                  className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Hapus Invoice"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* LIST / CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-200 p-8 rounded-2xl text-center text-gray-400 font-medium">
              Tidak ditemukan data Invoice Tagihan.
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const proj = projects.find((p) => p.id === inv.projectId);
              const isSent = inv.status !== "Belum Dikirim";

              return (
                <div
                  key={inv.id}
                  className={`bg-white border rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden ${
                    isSent ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/10" : "border-gray-200"
                  }`}
                >
                  {/* Status Indicator Strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${isSent ? "bg-emerald-500" : "bg-amber-500"}`} />

                  {/* Top Row: Date & Invoice No */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-mono block">{inv.date}</span>
                      <p className="font-mono font-extrabold text-slate-800 text-sm leading-tight">{inv.invoiceNo}</p>
                      {inv.company && <p className="text-[9px] font-bold text-blue-700 uppercase">{inv.company}</p>}
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        isSent
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Project Info */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Proyek Terkait</p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={proj?.name}>
                      {proj ? proj.name : "Proyek Dihapus"}
                    </p>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>KODE: {proj?.code || "-"}</span>
                      <span>PM: {proj?.manager || "-"}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi Tagihan</p>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed" title={inv.description}>
                      {inv.description.replace("[Invoice Sent] ", "")}
                    </p>
                  </div>

                  {/* Recipient Client */}
                  <div className="flex justify-between items-center text-[11px] text-gray-500 border-t border-gray-100 pt-3">
                    <span>Owner:</span>
                    <strong className="text-slate-800">{inv.supplier}</strong>
                  </div>

                  {/* Total Value & Action Row */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Nilai Tagihan</p>
                      <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{formatIDR(inv.amount)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isReadOnly ? (
                        <span
                          className={`text-[9px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider border ${
                            isSent
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isSent ? "✓ Terkirim" : "⏳ Draft"}
                        </span>
                      ) : !isSent ? (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, "Sudah Dikirim")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-sm transition-all cursor-pointer flex items-center gap-1"
                          title="Tandai Sudah Dikirim"
                        >
                          Kirim
                        </button>
                      ) : (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, "Belum Dikirim")}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-sm transition-all cursor-pointer flex items-center gap-1"
                          title="Tandai Belum Dikirim"
                        >
                          Draft
                        </button>
                      )}
                      <button
                        onClick={() => printInvoiceVoucher(inv, proj)}
                        className="text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-gray-200"
                        title="Cetak Bukti"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-gray-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDeleteInvoice(inv)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer border border-gray-200"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {invoiceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Hapus Invoice?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus invoice {invoiceToDelete.invoiceNo} ini secara permanen?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteInvoice}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT TOAST NOTIFICATION */}
      {alertMessage && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 z-50 border border-slate-800 animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed text-slate-200">{alertMessage}</p>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-white font-bold text-sm shrink-0 hover:bg-slate-800/50 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

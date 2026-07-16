/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, Category } from "../types";
import { Plus, ListFilter, Search, Coins, Trash2, HelpCircle, AlertTriangle, ShieldCheck, Landmark, CheckSquare, Calendar, ChevronDown, ChevronUp, Printer, User, DollarSign, Calculator, Percent, FileText, Edit, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SalaryManagerProps {
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

export const printSalarySlip = (tx: Transaction, project: Project | undefined, companyName: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan di browser Anda.");
    return;
  }

  const formatIDRPrint = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak Slip Gaji - ${tx.petyCashNo || tx.id}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 40px;
          line-height: 1.4;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .header-title {
          font-size: 18px;
          font-weight: bold;
          text-align: right;
          color: #1e3a8a;
        }
        .header-subtitle {
          font-size: 11px;
          color: #6b7280;
          text-align: right;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        .company-sub {
          font-size: 10px;
          color: #6b7280;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .meta-table td {
          padding: 10px 15px;
          font-size: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .meta-label {
          font-weight: bold;
          color: #4b5563;
          width: 150px;
        }
        .meta-value {
          color: #111827;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }
        .items-table th {
          background-color: #1f2937;
          color: #ffffff;
          padding: 10px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
        }
        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row {
          background-color: #f9fafb;
          font-weight: bold;
          font-size: 13px;
        }
        .signatures-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 60px;
          font-size: 12px;
        }
        .signatures-table td {
          text-align: center;
          width: 33%;
          padding-bottom: 70px;
          color: #4b5563;
        }
        .sign-line {
          width: 150px;
          border-bottom: 1px solid #333;
          margin: 0 auto 5px auto;
        }
        @media print {
          body { margin: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body onload="window.print()">
      <table class="header-table">
        <tr>
          <td>
            <div class="company-name">${companyName}</div>
            <div class="company-sub">Sistem Penggajian &amp; Pembayaran Proyek</div>
          </td>
          <td>
            <div class="header-title">SLIP GAJI KARYAWAN</div>
            <div class="header-subtitle">Pembayaran Pengeluaran Gaji Proyek</div>
          </td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Nomor Slip Gaji</td>
          <td class="meta-value" style="font-family: monospace; font-weight: bold;">${tx.petyCashNo || tx.id}</td>
          <td class="meta-label">Tanggal Pembayaran</td>
          <td class="meta-value">${tx.date}</td>
        </tr>
        <tr>
          <td class="meta-label">Nama Karyawan / Penerima</td>
          <td class="meta-value" style="font-weight: bold;">${tx.pic}</td>
          <td class="meta-label">Proyek Terkait</td>
          <td class="meta-value">${project ? `[${project.code}] ${project.name}` : "-"}</td>
        </tr>
        <tr>
          <td class="meta-label">Metode Pembayaran</td>
          <td class="meta-value">${tx.paymentMethod || "Transfer / Tunai"}</td>
          <td class="meta-label">Keterangan</td>
          <td class="meta-value">${tx.description}</td>
        </tr>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">No</th>
            <th style="text-align: left;">Rincian Komponen Gaji</th>
            <th style="width: 30%; text-align: right;">Nominal</th>
          </tr>
        </thead>
        <tbody>
          ${(tx.items || []).map((item, idx) => `
            <tr style="${item.amount < 0 ? 'color: #dc2626;' : ''}">
              <td style="text-align: center;">${idx + 1}</td>
              <td>${item.description}</td>
              <td style="text-align: right; font-family: monospace;">
                ${item.amount < 0 ? '-' : ''}${formatIDRPrint(Math.abs(item.amount))}
              </td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">TOTAL GAJI BERSIH (NETTO):</td>
            <td style="padding: 12px; text-align: right; font-family: monospace; color: #1e3a8a; font-size: 14px;">${formatIDRPrint(tx.amount)}</td>
          </tr>
        </tbody>
      </table>

      <table class="signatures-table">
        <tr>
          <td>
            <p>Disetujui Oleh,</p>
            <div style="height: 60px;"></div>
            <div class="sign-line"></div>
            <p style="font-weight: bold; margin: 0;">Manager Keuangan</p>
          </td>
          <td>
            <p>Dibayar Oleh,</p>
            <div style="height: 60px;"></div>
            <div class="sign-line"></div>
            <p style="font-weight: bold; margin: 0;">Kasir / Bendahara</p>
          </td>
          <td>
            <p>Diterima Oleh,</p>
            <div style="height: 60px;"></div>
            <p style="font-weight: bold; color: #111827; text-decoration: underline; margin: 0;">${tx.pic}</p>
            <p style="margin: 0; font-size: 10px;">Karyawan Bersangkutan</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export default function SalaryManager({
  projects,
  transactions,
  setTransactions,
  selectedProjectId,
  isReadOnly = false,
  onAddActivity,
}: SalaryManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingSalaryId, setEditingSalaryId] = React.useState<string | null>(null);

  // Form Fields State
  const [projectId, setProjectId] = React.useState(
    selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id || "")
  );

  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const [employeeName, setEmployeeName] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = React.useState("Transfer Bank");
  const [description, setDescription] = React.useState("");

  // Dynamic Salary Components Builders (Like Petty Cash Request Items)
  const [currentItems, setCurrentItems] = React.useState<Array<{ id: string; description: string; amount: number; isDeduction: boolean }>>([
    { id: "comp-1", description: "Gaji Pokok", amount: 0, isDeduction: false },
    { id: "comp-2", description: "Tunjangan Makan & Transport", amount: 0, isDeduction: false },
    { id: "comp-3", description: "Uang Lembur (Overtime)", amount: 0, isDeduction: false },
    { id: "comp-4", description: "Tunjangan Lainnya", amount: 0, isDeduction: false },
    { id: "comp-5", description: "Potongan Gaji", amount: 0, isDeduction: true },
  ]);

  // Company Selector
  const [company, setCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [customCompany, setCustomCompany] = React.useState("");

  // Validation Error & Success Alerts
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [salaryToDelete, setSalaryToDelete] = React.useState<string | null>(null);

  // Auto company selector based on project
  React.useEffect(() => {
    if (projectId) {
      const selectedProj = projects.find((p) => p.id === projectId);
      if (selectedProj?.company) {
        if (selectedProj.company === "CV. Mandiri Cipta Jaya" || selectedProj.company === "PT. Elqia Jaya Teknik") {
          setCompany(selectedProj.company);
        } else {
          setCompany("Lainnya");
          setCustomCompany(selectedProj.company);
        }
      }
    }
  }, [projectId, projects]);

  // Auto toast auto dismiss
  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Filters State
  const [filterProject, setFilterProject] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Expands row mapping
  const [expandedSalaries, setExpandedSalaries] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedSalaries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Compute Net Salary based on components builder
  const netSalary = React.useMemo(() => {
    let total = 0;
    currentItems.forEach((it) => {
      if (it.isDeduction) {
        total -= Number(it.amount || 0);
      } else {
        total += Number(it.amount || 0);
      }
    });
    return Math.max(0, total);
  }, [currentItems]);

  // Handle Add custom component line
  const handleAddRow = () => {
    setCurrentItems((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: "",
        amount: 0,
        isDeduction: false,
      },
    ]);
  };

  // Handle Delete component line
  const handleDeleteRow = (id: string) => {
    setCurrentItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Handle Edit component row field
  const handleUpdateRowField = (id: string, field: "description" | "amount" | "isDeduction", value: any) => {
    setCurrentItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Handle Edit Salary Slip
  const handleStartEdit = (tx: Transaction) => {
    setEditingSalaryId(tx.id);
    setProjectId(tx.projectId);
    setEmployeeName(tx.pic);
    setDate(tx.date);
    setPaymentMethod(tx.paymentMethod || "Transfer Bank");
    setDescription(tx.description || "");
    
    if (tx.company === "CV. Mandiri Cipta Jaya" || tx.company === "PT. Elqia Jaya Teknik") {
      setCompany(tx.company);
    } else {
      setCompany("Lainnya");
      setCustomCompany(tx.company || "");
    }

    // Populate components
    if (tx.items && tx.items.length > 0) {
      setCurrentItems(
        tx.items.map((it, idx) => ({
          id: it.id || `comp-${idx}-${Date.now()}`,
          description: it.description,
          amount: Math.abs(it.amount),
          isDeduction: it.amount < 0,
        }))
      );
    } else {
      // Fallback
      setCurrentItems([
        { id: "comp-1", description: "Gaji Pokok", amount: tx.amount, isDeduction: false },
      ]);
    }

    setValidationError(null);
    setShowAddForm(true);
    
    // Smooth scroll to form
    const container = document.getElementById("salary-form-top");
    if (container) {
      container.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle Submit Salary input (Save or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      setValidationError("Akses Ditolak: Anda sedang dalam mode peninjau (Direktur).");
      return;
    }
    if (!projectId) {
      setValidationError("Harap pilih Project terkait!");
      return;
    }
    if (!employeeName.trim()) {
      setValidationError("Harap masukkan Nama Karyawan!");
      return;
    }
    if (netSalary <= 0) {
      setValidationError("Total Gaji Bersih (Netto) harus lebih besar dari Rp 0!");
      return;
    }

    // Validate empty descriptions in rows
    const hasEmptyDesc = currentItems.some((it) => !it.description.trim());
    if (hasEmptyDesc) {
      setValidationError("Deskripsi komponen gaji rincian tidak boleh kosong!");
      return;
    }

    setValidationError(null);

    const yearMonth = date.substring(0, 7).replace("-", "");
    const totalGajiTransactionsCount = transactions.filter(t => t.category === "Gaji").length + 1;
    const slipNo = editingSalaryId 
      ? (transactions.find(t => t.id === editingSalaryId)?.petyCashNo || `PAY-${yearMonth}-${String(totalGajiTransactionsCount).padStart(3, "0")}`)
      : `PAY-${yearMonth}-${String(totalGajiTransactionsCount).padStart(3, "0")}`;

    const selectedProj = projects.find((p) => p.id === projectId);
    const finalCompanyName = company === "Lainnya" ? customCompany : company;

    // Convert current items array to Transaction item style (minus for deductions)
    const salaryItems = currentItems.map((it) => ({
      id: it.id,
      description: it.description.trim(),
      category: "Gaji" as Category,
      amount: it.isDeduction ? -Math.abs(Number(it.amount || 0)) : Math.abs(Number(it.amount || 0)),
    }));

    const descriptionText = description.trim() || `Pembayaran Gaji Karyawan - ${employeeName}`;

    if (editingSalaryId) {
      // Edit existing transaction
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === editingSalaryId
            ? {
                ...tx,
                projectId,
                pic: employeeName,
                date,
                company: finalCompanyName,
                amount: netSalary,
                description: descriptionText,
                paymentMethod,
                items: salaryItems,
              }
            : tx
        )
      );

      if (onAddActivity) {
        onAddActivity(
          "petycash_expense",
          "Edit Slip Gaji",
          `Memperbarui slip gaji [${slipNo}] atas nama ${employeeName} sebesar ${formatIDR(netSalary)}`,
          "Administrator",
          projectId
        );
      }

      setAlertMessage(`Gaji karyawan "${employeeName}" (Slip No: ${slipNo}) berhasil diperbarui.`);
    } else {
      // Create new transaction
      const newSalaryTransaction: Transaction = {
        id: `sal-${Date.now()}`,
        projectId,
        type: "PetyCash", // Processed as direct spending
        category: "Gaji",
        pic: employeeName,
        date,
        petyCashNo: slipNo,
        company: finalCompanyName,
        amount: netSalary,
        description: descriptionText,
        paymentMethod,
        status: "Sudah Proses",
        items: salaryItems,
      };

      setTransactions((prev) => [newSalaryTransaction, ...prev]);

      // Activity log
      if (onAddActivity) {
        onAddActivity(
          "petycash_expense",
          "Penggajian Karyawan",
          `Membayar gaji untuk ${employeeName} sebesar ${formatIDR(netSalary)} pada proyek "${selectedProj?.name || "Proyek"}"`,
          employeeName,
          projectId
        );
      }

      setAlertMessage(`Gaji karyawan "${employeeName}" berhasil terekam dengan No Slip: ${slipNo}`);
    }

    // Reset Form fields
    setEmployeeName("");
    setEditingSalaryId(null);
    setCurrentItems([
      { id: "comp-1", description: "Gaji Pokok", amount: 0, isDeduction: false },
      { id: "comp-2", description: "Tunjangan Makan & Transport", amount: 0, isDeduction: false },
      { id: "comp-3", description: "Uang Lembur (Overtime)", amount: 0, isDeduction: false },
      { id: "comp-4", description: "Tunjangan Lainnya", amount: 0, isDeduction: false },
      { id: "comp-5", description: "Potongan Gaji", amount: 0, isDeduction: true },
    ]);
    setDescription("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) {
      alert("Akses Ditolak: Mode peninjau (Direktur) tidak diizinkan menghapus data.");
      return;
    }
    const targetTx = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    
    if (targetTx && onAddActivity) {
      onAddActivity(
        "petycash_expense",
        "Penghapusan Log Gaji",
        `Menghapus rekaman slip gaji [${targetTx.petyCashNo}] atas nama ${targetTx.pic}`,
        "Administrator",
        targetTx.projectId
      );
    }

    setAlertMessage("Data pembayaran gaji berhasil dihapus dari proyek.");
    setSalaryToDelete(null);
  };

  // Retrieve Salary transactions list
  const salaryTransactions = transactions.filter(
    (t) => t.category === "Gaji" && t.type === "PetyCash"
  );

  // Filter list
  const filteredSalaries = salaryTransactions.filter((t) => {
    const projMatch = filterProject === "all" ? true : t.projectId === filterProject;
    const searchMatch = searchQuery.trim() === ""
      ? true
      : t.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.petyCashNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return projMatch && searchMatch;
  });

  // Calculate stats for salary
  const totalGajiPaid = filteredSalaries.reduce((sum, s) => sum + s.amount, 0);
  const averageGaji = filteredSalaries.length > 0 ? totalGajiPaid / filteredSalaries.length : 0;
  const maxGaji = filteredSalaries.length > 0 ? Math.max(...filteredSalaries.map((s) => s.amount)) : 0;

  return (
    <div className="space-y-6 font-sans" id="salary-form-top">
      {/* Toast Alert */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{alertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-sm border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Sistem Keuangan Proyek
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2 flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-blue-500" /> Input &amp; Manajemen Gaji
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Mencatat rincian gaji karyawan secara dinamis layaknya pety cash, membagi komponen upah, lembur, bonus, serta potongan secara rinci, dan melacak otomatis pengeluaran anggaran proyek (Kategori Gaji) secara real-time.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              setEditingSalaryId(null);
              setEmployeeName("");
              setCurrentItems([
                { id: "comp-1", description: "Gaji Pokok", amount: 0, isDeduction: false },
                { id: "comp-2", description: "Tunjangan Makan & Transport", amount: 0, isDeduction: false },
                { id: "comp-3", description: "Uang Lembur (Overtime)", amount: 0, isDeduction: false },
                { id: "comp-4", description: "Tunjangan Lainnya", amount: 0, isDeduction: false },
                { id: "comp-5", description: "Potongan Gaji", amount: 0, isDeduction: true },
              ]);
              setDescription("");
              setShowAddForm(!showAddForm);
              setValidationError(null);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/10 min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? "Tutup Form Input" : "Input Gaji Karyawan"}
          </button>
        )}
      </div>

      {/* TOP SUMMARY METRICS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Gaji Terbayar</p>
            <p className="text-xl font-bold text-slate-800">{formatIDR(totalGajiPaid)}</p>
            <p className="text-[10px] text-gray-400">Dari {filteredSalaries.length} slip gaji proyek ini</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Rata-Rata Slip Gaji</p>
            <p className="text-xl font-bold text-slate-800">{formatIDR(averageGaji)}</p>
            <p className="text-[10px] text-gray-400">Pembayaran per karyawan</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Pembayaran Gaji Tertinggi</p>
            <p className="text-xl font-bold text-slate-800">{formatIDR(maxGaji)}</p>
            <p className="text-[10px] text-gray-400">Komponen upah netto maksimal</p>
          </div>
        </div>
      </div>

      {/* INPUT SALARY FORM CONTAINER */}
      <AnimatePresence>
        {showAddForm && !isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                {editingSalaryId ? <Edit className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingSalaryId ? "Edit Rincian Slip Gaji Karyawan" : "Form Input Rincian Gaji Karyawan"}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {editingSalaryId ? "Sesuaikan rincian dan nominal komponen slip gaji terpilih." : "Sistem akan otomatis menghitung Gaji Bersih dan memasukkan pengeluaran ke Proyek terkait."}
                </p>
              </div>
            </div>

            {validationError && (
              <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Gagal Menyimpan:</span> {validationError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project Selector */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Pilih Project Terkait <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                  >
                    <option value="">-- Pilih Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee Name */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nama Karyawan / PIC <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan nama karyawan lengkap"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Tanggal Pembayaran Gaji <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SALARY COMPONENT DETAILS BUILDER */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 border-b border-gray-200/60 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" /> Rincian Rinci Komponen Gaji (Dinamis)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-xs bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Rincian Baru
                  </button>
                </div>

                {/* Dynamic Item Rows */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {currentItems.map((item, idx) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-gray-200/80 p-3 rounded-xl shadow-xs">
                      {/* Label index */}
                      <span className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 self-center">
                        {idx + 1}
                      </span>

                      {/* Description Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Masukkan rincian (misal: Bonus Proyek, Lemburan...)"
                          value={item.description}
                          onChange={(e) => handleUpdateRowField(item.id, "description", e.target.value)}
                          className="w-full bg-transparent border-b border-gray-200 hover:border-gray-400 focus:border-blue-500 px-1 py-1.5 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      {/* Amount Input */}
                      <div className="w-full sm:w-40 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400">Rp</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.amount || ""}
                          onChange={(e) => handleUpdateRowField(item.id, "amount", Math.max(0, Number(e.target.value)))}
                          className="w-full bg-transparent border-none text-xs font-mono font-bold px-1.5 py-1.5 focus:outline-none text-right text-slate-800"
                        />
                      </div>

                      {/* Deduction Toggle Select */}
                      <div className="w-full sm:w-36 shrink-0">
                        <select
                          value={item.isDeduction ? "true" : "false"}
                          onChange={(e) => handleUpdateRowField(item.id, "isDeduction", e.target.value === "true")}
                          className={`w-full text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                            item.isDeduction 
                              ? "bg-red-50 border-red-200 text-red-600" 
                              : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          <option value="false">Penambahan (+)</option>
                          <option value="true">Potongan (-)</option>
                        </select>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 flex items-center justify-center cursor-pointer transition-all self-center"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Calculation breakdown feedback panel */}
                <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 p-3 rounded-xl border border-gray-200/40">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Formula Perhitungan Otomatis:</p>
                    <div className="font-mono text-gray-600 text-[11px] space-x-1.5 flex flex-wrap items-center">
                      {currentItems.map((it, idx) => (
                        <React.Fragment key={it.id}>
                          {idx > 0 && <span className={it.isDeduction ? "text-red-500 font-bold" : "text-gray-400 font-bold"}>{it.isDeduction ? "-" : "+"}</span>}
                          <span className={it.isDeduction ? "text-red-600 bg-red-50 px-1 rounded" : "text-slate-800 bg-slate-100 px-1 rounded"}>
                            {it.description || "Komponen"} ({formatIDR(it.amount || 0)})
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="text-right border-l border-gray-200 pl-5 pr-2">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Gaji Bersih (Netto)</p>
                    <p className="text-xl font-black font-mono text-blue-600 animate-pulse">{formatIDR(netSalary)}</p>
                  </div>
                </div>
              </div>

              {/* SYSTEM DETAILS & OTHER SETTINGS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Company Name Selector */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Entitas Perusahaan Pembayar
                  </label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                  >
                    <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
                    <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
                    <option value="Lainnya">Lainnya (Tulis Manual)</option>
                  </select>
                </div>

                {company === "Lainnya" && (
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Nama Perusahaan Manual <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama perusahaan pembayar"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Metode Pembayaran Gaji
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="Cek Mandiri">Cek Mandiri</option>
                  </select>
                </div>

                {/* Description Notes */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                    Keterangan Tambahan / Catatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Gaji Bulan Juni 2026"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setValidationError(null);
                    setEditingSalaryId(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer border border-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/15 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${editingSalaryId ? "animate-spin" : ""}`} />
                  {editingSalaryId ? "Perbarui & Posting Gaji" : "Simpan & Posting Gaji"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER & HISTORY SECTION */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table / List Filter actions bar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans">Riwayat Rekapitulasi Slip Gaji Karyawan</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Daftar seluruh pembayaran upah, honor, dan gaji terstruktur yang dikeluarkan dari anggaran proyek.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scope filter */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase px-1">Scope:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[150px]"
              >
                <option value="all">Semua Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari slip, nama, atau ket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-44 md:w-56"
              />
            </div>
          </div>
        </div>

        {/* DATA TABLE STAGE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 text-white font-semibold border-b border-slate-900">
                <th className="p-4 w-10"></th>
                <th className="p-4">No Slip Gaji</th>
                <th className="p-4">Karyawan / PIC</th>
                <th className="p-4">Project Terkait</th>
                <th className="p-4">Tanggal Bayar</th>
                <th className="p-4">Entitas Perusahaan</th>
                <th className="p-4 text-right">Gaji Bersih (Netto)</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 italic bg-white">
                    Belum ada data rekapan gaji yang dimasukkan dalam sistem. Klik "Input Gaji Karyawan" untuk menambahkan baru.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((tx) => {
                  const isExpanded = expandedSalaries[tx.id] || false;
                  const project = projects.find((p) => p.id === tx.projectId);

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/40 transition-colors bg-white">
                        {/* Expand Button */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Slip No */}
                        <td className="p-4 font-mono font-bold text-gray-900">{tx.petyCashNo}</td>

                        {/* Employee Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                              {tx.pic.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900">{tx.pic}</span>
                              <p className="text-[10px] text-gray-400 truncate max-w-[150px]" title={tx.description}>
                                {tx.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Associated Project */}
                        <td className="p-4">
                          {project ? (
                            <div>
                              <span className="font-semibold text-slate-800 block">
                                [{project.code}]
                              </span>
                              <span className="text-[10px] text-gray-400 line-clamp-1">
                                {project.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Project tidak ditemukan</span>
                          )}
                        </td>

                        {/* Payment date */}
                        <td className="p-4 font-mono font-medium text-gray-600">{tx.date}</td>

                        {/* Company Entity */}
                        <td className="p-4">
                          <span className="inline-flex items-center text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {tx.company || "CV. Mandiri Cipta Jaya"}
                          </span>
                        </td>

                        {/* Net Salary Amount */}
                        <td className="p-4 text-right font-mono font-bold text-blue-700 text-sm">
                          {formatIDR(tx.amount)}
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => printSalarySlip(tx, project, tx.company || "CV. Mandiri Cipta Jaya")}
                              className="w-7 h-7 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 flex items-center justify-center transition-all cursor-pointer"
                              title="Cetak Slip Gaji Karyawan"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(tx)}
                                  className="w-7 h-7 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 flex items-center justify-center transition-all cursor-pointer"
                                  title="Edit Rincian Gaji"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setSalaryToDelete(tx.id)}
                                  className="w-7 h-7 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 flex items-center justify-center transition-all cursor-pointer"
                                  title="Hapus Data Gaji"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row with dynamic breakdown visual details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="p-5">
                            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs max-w-4xl">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                  <Calculator className="w-4 h-4 text-blue-600" /> Detail Komponen Upah Karyawan ({tx.pic})
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  Metode: <strong className="text-slate-700">{tx.paymentMethod || "Transfer bank"}</strong>
                                </span>
                              </div>

                              {/* Grid display for components */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(tx.items || []).map((item) => {
                                  const isNeg = item.amount < 0;
                                  return (
                                    <div key={item.id} className={`p-3 border rounded-xl space-y-1 ${isNeg ? "bg-red-50/40 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                                      <p className={`text-[9px] font-extrabold uppercase ${isNeg ? "text-red-500" : "text-gray-400"}`}>{item.description}</p>
                                      <p className={`font-mono font-bold ${isNeg ? "text-red-600" : "text-gray-800"}`}>
                                        {isNeg ? "-" : ""}{formatIDR(Math.abs(item.amount))}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                <p className="text-gray-400 italic">
                                  Catatan slip: <span className="text-slate-600 font-semibold">{tx.description}</span>
                                </p>
                                <p className="font-sans">
                                  Total Gaji Bersih diterima: <strong className="font-mono text-blue-600 text-xs">{formatIDR(tx.amount)}</strong>
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {salaryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">Hapus Log Pembayaran Gaji?</h4>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Aksi ini akan menghapus permanen rekaman slip pembayaran gaji ini dari pengeluaran anggaran proyek. Apakah Anda yakin?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSalaryToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(salaryToDelete)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer text-center shadow-lg shadow-red-500/15"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

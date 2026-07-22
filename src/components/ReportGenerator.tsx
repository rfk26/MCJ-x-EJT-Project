/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, Category } from "../types";
import { COMPANY_INFO, CATEGORIES } from "../data";
import { FileText, Printer, Calendar, ArrowRightLeft, CheckCircle2, TrendingUp, HelpCircle, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportGeneratorProps {
  projects: Project[];
  transactions: Transaction[];
  selectedProjectId: string;
}

export default function ReportGenerator({ projects, transactions, selectedProjectId }: ReportGeneratorProps) {
  const [selectedCompany, setSelectedCompany] = React.useState<string>("all");
  const [projectId, setProjectId] = React.useState(selectedProjectId || projects[0]?.id || "");
  const [reportType, setReportType] = React.useState<"weekly" | "monthly" | "custom_range">("monthly");
  const [startDate, setStartDate] = React.useState<string>("2026-04-01");
  const [endDate, setEndDate] = React.useState<string>("2026-04-30");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("April"); // Seed data is mostly March/April/Mei/Juni
  const [selectedWeek, setSelectedWeek] = React.useState<string>("1");
  const [directorName, setDirectorName] = React.useState<string>("Bpk. H. Ramdani Rifki");
  const [additionalNotes, setAdditionalNotes] = React.useState<string>(
    "Pekerjaan berjalan lancar sesuai estimasi. Pembayaran pety cash terkontrol dengan baik, dan penghematan material berhasil dicapai pada beberapa pos pekerjaan."
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState<boolean>(false);

  const [createdBy, setCreatedBy] = React.useState<string>("");
  const [createdRole, setCreatedRole] = React.useState<string>("Pengawas Lapangan");
  const [createdTitle, setCreatedTitle] = React.useState<string>("PIC Lapangan");
  const [checkedBy, setCheckedBy] = React.useState<string>("");
  const [checkedRole, setCheckedRole] = React.useState<string>("Manajer Keuangan Proyek");
  const [checkedTitle, setCheckedTitle] = React.useState<string>("Project Manager");

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const weeks = ["1", "2", "3", "4", "5"];

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDateID = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthName = months[monthIndex] || parts[1];
        return `${day} ${monthName} ${year}`;
      }
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Find the selected project
  const currentProject = projects.find((p) => p.id === projectId);

  // Sync creator and checker names based on selected project
  React.useEffect(() => {
    if (currentProject) {
      setCreatedBy(currentProject.pic || "P Ujang");
      setCheckedBy(currentProject.manager || "BPK. Ujang N");
    } else {
      setCreatedBy("P Ujang");
      setCheckedBy("BPK. Ujang N");
    }
  }, [projectId, projects, currentProject]);

  // Filter projects list for dropdown based on active company
  const filteredProjectsDropdown = projects.filter((p) => {
    if (selectedCompany === "all") return true;
    return p.company === selectedCompany;
  });

  const activeCompany = currentProject
    ? currentProject.company || "CV. Mandiri Cipta Jaya"
    : (selectedCompany !== "all" ? selectedCompany : "CV. MANDIRI CIPTA JAYA x PT. ELQIA JAYA TEKNIK");

  const getCompanyDetails = () => {
    if (activeCompany === "CV. Mandiri Cipta Jaya") {
      return {
        name: "CV. MANDIRI CIPTA JAYA",
        subName: "Civil - M&E - Perdagangan umum & Jasa",
        address: "Perum griya panorama indah Blok C9 No.26 Purwasari - Karawang",
        phone: "Hp : 0812 1960 5114",
        email: "mandiricipta_jaya@yahoo.com",
        initials: "MCJ",
      };
    } else if (activeCompany === "PT. Elqia Jaya Teknik") {
      return {
        name: "PT. ELQIA JAYA TEKNIK",
        subName: "M&E - Piping - Electrical - Mechanical & Jasa Konstruksi",
        address: "Perum griya panorama indah Blok C9 No.26 Purwasari - Karawang",
        phone: "Hp : 0812 1960 5114",
        email: "elqiajayateknik@gmail.com",
        initials: "EJT",
      };
    } else {
      return {
        name: "CV. MANDIRI CIPTA JAYA x PT. ELQIA JAYA TEKNIK",
        subName: "Civil - M&E - Perdagangan umum & Jasa",
        address: "Perum griya panorama indah Blok C9 No.26 Purwasari - Karawang",
        phone: "Hp : 0812 1960 5114",
        email: "mandiricipta_jaya@yahoo.com",
        initials: "MCJ x EJT",
      };
    }
  };

  const compDetails = getCompanyDetails();

  // Filter transactions based on project, company, month, and week
  const getFilteredTransactions = () => {
    let list = transactions;
    if (projectId !== "all") {
      list = list.filter((t) => t.projectId === projectId);
    } else if (selectedCompany !== "all") {
      const companyProjectIds = projects
        .filter((p) => p.company === selectedCompany)
        .map((p) => p.id);
      list = list.filter((t) => companyProjectIds.includes(t.projectId) || t.company === selectedCompany);
    }

    if (reportType === "custom_range") {
      if (startDate) {
        list = list.filter((t) => t.date >= startDate);
      }
      if (endDate) {
        list = list.filter((t) => t.date <= endDate);
      }
    } else {
      // Filter by Month
      list = list.filter((t) => {
        const txDate = new Date(t.date);
        const txMonthName = months[txDate.getMonth()];
        return txMonthName.toLowerCase() === selectedMonth.toLowerCase();
      });

      // If Weekly, filter by Week
      if (reportType === "weekly") {
        list = list.filter((t) => {
          const txDate = new Date(t.date);
          const dayOfMonth = txDate.getDate();
          // Calculate week (1-7 = week 1, 8-14 = week 2, 15-21 = week 3, 22-28 = week 4, 29+ = week 5)
          const weekNum = Math.ceil(dayOfMonth / 7);
          return weekNum.toString() === selectedWeek;
        });
      }
    }

    return list;
  };

  const filteredTxs = getFilteredTransactions();

  // Aggregate by Category (only for PetyCash actual expenditures, including any custom/manual ones)
  const categoryAggregate = (() => {
    const presentCategories = Array.from(
      new Set([
        ...CATEGORIES,
        ...filteredTxs.filter((t) => t.type === "PetyCash").map((t) => t.category || "Consumable")
      ])
    );
    return presentCategories.map((cat) => {
      const sum = filteredTxs
        .filter((t) => t.type === "PetyCash" && t.category === cat)
        .reduce((s, t) => s + t.amount, 0);
      return { category: cat, total: sum };
    }).filter((item) => item.total > 0);
  })();

  const grandTotal = categoryAggregate.reduce((sum, item) => sum + item.total, 0);

  // Group by pety cash submissions & invoices
  const petyCashTotal = filteredTxs.filter((t) => t.type === "PetyCash").reduce((s, t) => s + t.amount, 0);
  const poTotal = filteredTxs.filter((t) => t.type === "PO").reduce((s, t) => s + t.amount, 0);
  const invoiceTotal = filteredTxs.filter((t) => t.type === "Invoice").reduce((s, t) => s + t.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Keuangan</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; }
          td { padding: 8px; border: 1px solid #cbd5e1; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; text-align: center; }
          .subtitle { font-size: 11px; color: #64748b; margin-bottom: 12px; text-align: center; }
          .section-title { font-size: 12px; font-weight: bold; margin-top: 16px; margin-bottom: 6px; }
          .right { text-align: right; }
          .font-mono { font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="title">${compDetails.name}</div>
        <div class="subtitle">${compDetails.subName} - ${compDetails.address}</div>
        <div class="title" style="font-size:14px; margin-top:10px;">LAPORAN REKAPITULASI BIAYA PROYEK</div>
        <div class="subtitle">Periode: ${reportType === "monthly" ? `Bulan ${selectedMonth}` : reportType === "weekly" ? `Bulan ${selectedMonth} - Minggu ke-${selectedWeek}` : `${startDate} s.d. ${endDate}`}</div>
        <br/>
        
        <table style="margin-bottom: 20px;">
          <tr>
            <td><strong>Proyek:</strong></td>
            <td>${currentProject ? `[${currentProject.code}] ${currentProject.name}` : 'Semua Proyek'}</td>
            <td><strong>Manajer Proyek:</strong></td>
            <td>${currentProject?.manager || '-'}</td>
          </tr>
          <tr>
            <td><strong>PIC Lapangan:</strong></td>
            <td>${currentProject?.pic || '-'}</td>
            <td><strong>Status Proyek:</strong></td>
            <td>${currentProject?.status || '-'}</td>
          </tr>
        </table>

        <div class="section-title">A. Rincian Pengeluaran Berdasarkan Kategori</div>
        <table>
          <thead>
            <tr>
              <th style="background-color: #0f172a; color: #ffffff;">No</th>
              <th style="background-color: #0f172a; color: #ffffff;">Kategori Pengeluaran</th>
              <th style="background-color: #0f172a; color: #ffffff; text-align: right;">Total Biaya (RP)</th>
              <th style="background-color: #0f172a; color: #ffffff; text-align: right;">Persentase</th>
            </tr>
          </thead>
          <tbody>
    `;

    categoryAggregate.forEach((item, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${item.category}</strong></td>
          <td class="right font-mono">${formatIDR(item.total)}</td>
          <td class="right font-mono">${((item.total / grandTotal) * 100).toFixed(1)}%</td>
        </tr>
      `;
    });

    html += `
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="2">TOTAL SELURUH PENGELUARAN</td>
            <td class="right font-mono" style="color: #dc2626;">${formatIDR(grandTotal)}</td>
            <td class="right font-mono">100%</td>
          </tr>
        </tbody>
      </table>

      <br/>
      <div class="section-title">B. Log Buku Kas / Detail Transaksi Lapangan</div>
      <table>
        <thead>
          <tr>
            <th style="background-color: #0f172a; color: #ffffff;">Tanggal</th>
            <th style="background-color: #0f172a; color: #ffffff;">No Kas / Invoice</th>
            <th style="background-color: #0f172a; color: #ffffff;">PIC</th>
            <th style="background-color: #0f172a; color: #ffffff;">Deskripsi Pekerjaan / Belanja</th>
            <th style="background-color: #0f172a; color: #ffffff;">Kategori</th>
            <th style="background-color: #0f172a; color: #ffffff; text-align: right;">Jumlah (RP)</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredTxs.forEach((tx) => {
      html += `
        <tr>
          <td>${tx.date}</td>
          <td>${tx.petyCashNo || tx.invoiceNo || "-"}</td>
          <td>${tx.pic}</td>
          <td>${tx.description}</td>
          <td>${tx.category}</td>
          <td class="right font-mono">${formatIDR(tx.amount)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <br/>
      <p><strong>Catatan Tambahan:</strong> <em>"${additionalNotes}"</em></p>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Keuangan_${compDetails.initials.replace(/\\s+/g, '_')}_${reportType}_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("formal-document-view");
    if (!element) return;

    setIsGeneratingPDF(true);

    try {
      // 1. Temporarily apply styling for perfect A4 layout capture
      const originalStyle = element.getAttribute("style") || "";
      
      // We force a standard width of 794px which corresponds to an A4 layout at 96 DPI.
      // This guarantees tables, columns, text alignments and signature block wrap beautifully
      // and look identical regardless of screen size.
      element.style.width = "794px";
      element.style.maxWidth = "794px";
      element.style.minWidth = "794px";
      element.style.boxShadow = "none";
      element.style.border = "none";
      element.style.borderRadius = "0";

      // 2. Generate canvas with high-dpi scale for crisp vector-like typography
      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x scale gives super-crisp, high-definition text when printed/zoomed
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Restore original styling
      element.setAttribute("style", originalStyle);

      // 3. Setup PDF document parameters
      const imgWidth = 210; // A4 Width in mm
      const pageHeight = 297; // A4 Height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const doc = new jsPDF("p", "mm", "a4");
      let position = 0;

      // Convert canvas to premium JPEG image with high quality
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      // Add first page
      doc.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add remaining pages if content overflows A4 height
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // Shifts the canvas image upwards by one page-height
        doc.addPage();
        doc.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF with clear corporate descriptive name
      const fileName = `Laporan_Resmi_${compDetails.initials.replace(/\s+/g, '_')}_${selectedMonth}_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Gagal mengekspor PDF:", error);
      alert("Terjadi kesalahan saat membuat PDF. Silakan coba kembali.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16" id="report-generator-container">
      {/* CONTROL BOARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Pusat Pembuatan Laporan Project
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Konfigurasi dan ekspor laporan mingguan/bulanan formal untuk peninjauan keuangan proyek secara detail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {/* Company Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-blue-800">Filter Perusahaan</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCompany(val);
                setProjectId("all");
              }}
              className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 focus:ring-1 focus:ring-blue-600 focus:bg-white"
            >
              <option value="all">Semua Perusahaan (Gabung)</option>
              <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
              <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
            </select>
          </div>

          {/* Project select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Pilih Proyek</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
            >
              <option value="all">
                {selectedCompany === "all" ? "Semua Proyek (Konsolidasi)" : `Semua Proyek - ${selectedCompany}`}
              </option>
              {filteredProjectsDropdown.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Jenis Laporan</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setReportType("weekly")}
                className={`flex-1 min-w-[70px] px-2 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  reportType === "weekly"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setReportType("monthly")}
                className={`flex-1 min-w-[70px] px-2 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  reportType === "monthly"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setReportType("custom_range")}
                className={`flex-1 min-w-[100px] px-2 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  reportType === "custom_range"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Rentang Tanggal
              </button>
            </div>
          </div>

          {/* Month Select OR Start Date */}
          {reportType !== "custom_range" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Pilih Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-800">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-blue-950 font-bold"
              />
            </div>
          )}

          {/* Week Select OR End Date */}
          {reportType !== "custom_range" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Pilih Minggu {reportType === "monthly" && <span className="text-gray-400 font-normal">(Nonaktif)</span>}
              </label>
              <select
                disabled={reportType === "monthly"}
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {weeks.map((w) => (
                  <option key={w} value={w}>
                    Minggu ke-{w}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-800">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-blue-950 font-bold"
              />
            </div>
          )}
        </div>

        {/* METADATA FORM FOR SIGNATURE & NOTES */}
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Konfigurasi Penandatangan & Catatan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 border border-blue-100 p-2.5 rounded-xl bg-blue-50/10 flex flex-col justify-between">
              <label className="text-xs font-bold text-blue-800">Disetujui Oleh (Direksi)</label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Contoh: Bpk. H. Ramdani Rifki"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:ring-1 focus:ring-blue-600 font-bold"
                />
                <p className="text-[10px] text-gray-400 italic px-1 pt-1">
                  Disetujui oleh Direksi perusahaan aktif.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 border border-emerald-100 p-2.5 rounded-xl bg-emerald-50/10">
              <label className="text-xs font-bold text-emerald-800">Dibuat Oleh (PIC Lapangan)</label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={createdTitle}
                  onChange={(e) => setCreatedTitle(e.target.value)}
                  placeholder="Label Atas Ttd (contoh: PIC Lapangan)"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-blue-600 font-semibold text-emerald-700"
                />
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    placeholder="Nama Terang"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    value={createdRole}
                    onChange={(e) => setCreatedRole(e.target.value)}
                    placeholder="Jabatan Bawah"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 border border-red-100 p-2.5 rounded-xl bg-red-50/10">
              <label className="text-xs font-bold text-red-800">Diperiksa Oleh (Project Manager)</label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={checkedTitle}
                  onChange={(e) => setCheckedTitle(e.target.value)}
                  placeholder="Label Atas Ttd (contoh: Project Manager)"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-blue-600 font-semibold text-red-700"
                />
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={checkedBy}
                    onChange={(e) => setCheckedBy(e.target.value)}
                    placeholder="Nama Terang"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    value={checkedRole}
                    onChange={(e) => setCheckedRole(e.target.value)}
                    placeholder="Jabatan Bawah"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Catatan/Penjelasan Lapangan Tambahan</label>
            <textarea
              rows={1}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Ketik catatan situasi keuangan atau kemajuan proyek..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Ekspor Excel (.xls)
          </button>
          <button
            type="button"
            disabled={isGeneratingPDF}
            onClick={handleExportPDF}
            className={`font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              isGeneratingPDF
                ? "bg-rose-400 text-white cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengekspor ke PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Ekspor PDF Resmi (.pdf)
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* DYNAMIC METADATA PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SIDE BAR STATS PREVIEW (print:hidden) */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ringkasan Laporan Terpilih</h4>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Total Transaksi Pos</span>
                <span className="font-semibold text-gray-900">{filteredTxs.length} Transaksi</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Total Anggaran Keluar (Aktif)</span>
                <span className="font-bold text-red-600">{formatIDR(grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Dana Petty Cash Lapangan</span>
                <span className="font-semibold text-gray-900">{formatIDR(petyCashTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Anggaran Material PO</span>
                <span className="font-semibold text-gray-900">{formatIDR(poTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                <span className="text-gray-500">Realisasi Invoice Masuk</span>
                <span className="font-bold text-emerald-600">{formatIDR(invoiceTotal)}</span>
              </div>
            </div>

            {currentProject ? (
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Limit Kontrak Proyek</span>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total Kontrak:</span>
                  <span className="font-bold text-gray-900">
                    {formatIDR(
                      currentProject.customContractItems && currentProject.customContractItems.length > 0
                        ? currentProject.customContractItems.reduce((s, item) => s + Number(item.value || 0), 0)
                        : (currentProject.contractValue?.piping || 0) +
                          (currentProject.contractValue?.electrical || 0) +
                          (currentProject.contractValue?.mechanical || 0) +
                          (currentProject.contractValue?.scafolder || 0)
                    )}
                  </span>
                </div>
              </div>
            ) : selectedCompany !== "all" ? (
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Total Kontrak {selectedCompany}</span>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Gabungan Kontrak:</span>
                  <span className="font-bold text-gray-900">
                    {formatIDR(
                      projects
                        .filter((p) => p.company === selectedCompany && p.status !== "CANCEL")
                        .reduce((total, p) => {
                          const base = p.customContractItems && p.customContractItems.length > 0
                            ? p.customContractItems.reduce((s, item) => s + Number(item.value || 0), 0)
                            : (p.contractValue?.piping || 0) +
                              (p.contractValue?.electrical || 0) +
                              (p.contractValue?.mechanical || 0) +
                              (p.contractValue?.scafolder || 0);
                          return total + base;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm text-xs text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600" /> Tips Cetak Laporan Formal:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Gunakan opsi "Destination: Save as PDF" di browser untuk mengekspor file PDF.</li>
              <li>Atur "Layout" menjadi Potrait untuk dokumen standar.</li>
              <li>Aktifkan opsi "Background graphics" agar warna aksen tabel tercetak sempurna.</li>
              <li>Matikan header &amp; footer default browser agar nomor halaman rapi.</li>
            </ul>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT PREVIEW */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-md font-sans print:border-0 print:shadow-none print:p-0" id="formal-document-view">
          {/* CORPORATE LETTERHEAD */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-slate-900 pb-5">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="px-4 h-14 bg-blue-600 text-white flex items-center justify-center font-extrabold text-base rounded-xl tracking-tight shadow-md select-none border border-blue-700 whitespace-nowrap">
                {compDetails.initials}
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">{compDetails.name}</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{compDetails.subName}</p>
                <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed max-w-sm">{compDetails.address}</p>
              </div>
            </div>

            {/* Contacts details */}
            <div className="text-right text-[10px] text-gray-500 space-y-0.5">
              <p className="font-semibold text-slate-800">{compDetails.phone}</p>
              <p>{compDetails.email}</p>
              <p className="text-slate-500 font-mono text-[9px]">ID Proyek: {currentProject?.code || "KONSOLIDASI"}</p>
            </div>
          </div>

          {/* REPORT TITLE BLOCK */}
          <div className="text-center my-8 space-y-2">
            <h2 className="text-md font-extrabold text-slate-900 uppercase tracking-widest">
              LAPORAN KEUANGAN PROJECT
            </h2>
            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1 rounded-full text-xs font-bold text-slate-800 uppercase tracking-wider">
              {reportType === "custom_range" ? (
                <span>Rentang Tanggal &mdash; {formatDateID(startDate)} s/d {formatDateID(endDate)}</span>
              ) : (
                <span>{reportType === "weekly" ? "MINGGUAN" : "BULANAN"} &mdash; {selectedMonth} {reportType === "weekly" && `(Minggu Ke-${selectedWeek})`}</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Dicetak tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* PROJECT & METADATA SECTION */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-gray-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div className="space-y-1">
              <p className="text-gray-500">Nama Proyek:</p>
              <p className="font-bold text-slate-900">{currentProject?.name || "SEMUA PROYEK (KONSOLIDASI)"}</p>
              <p className="text-gray-500 pt-1">Manager Proyek / PIC:</p>
              <p className="font-semibold text-slate-700">{currentProject?.manager || "Kolektif PIC Lapangan"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Diajukan Kepada:</p>
              <p className="font-bold text-slate-900">{directorName || "-"}</p>
              <p className="text-gray-500 pt-1">Status Proyek Saat Ini:</p>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase border border-blue-200">
                {currentProject?.status || "AKTIF"}
              </span>
            </div>
          </div>

          {/* GENERAL STATS */}
          <div className="grid grid-cols-3 gap-2 text-center mb-6">
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Total Pengeluaran</span>
              <span className="text-xs font-extrabold text-red-600 block mt-1">{formatIDR(grandTotal)}</span>
            </div>
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Petty Cash Lapangan</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">{formatIDR(petyCashTotal)}</span>
            </div>
            <div className="border border-gray-200 rounded-xl p-3.5 bg-white">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Material PO/WO</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">{formatIDR(poTotal)}</span>
            </div>
          </div>

          {/* EXPENDITURE BY CATEGORY TABLE */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">A. Rincian Pengeluaran Berdasarkan Kategori</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="p-3">No</th>
                    <th className="p-3">Kategori Pengeluaran</th>
                    <th className="p-3 text-right">Total Biaya (RP)</th>
                    <th className="p-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryAggregate.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 text-xs italic">
                        Tidak ada transaksi pengeluaran tercatat pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    categoryAggregate.map((item, index) => (
                      <tr key={item.category} className="hover:bg-slate-50">
                        <td className="p-3 text-gray-400 font-mono">{index + 1}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.category}</td>
                        <td className="p-3 text-right font-mono text-slate-900">{formatIDR(item.total)}</td>
                        <td className="p-3 text-right text-gray-500 font-mono">
                          {((item.total / grandTotal) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-100 font-extrabold text-slate-900">
                    <td colSpan={2} className="p-3.5 uppercase tracking-wider">Total Seluruh Pengeluaran</td>
                    <td className="p-3.5 text-right font-mono text-red-600">{formatIDR(grandTotal)}</td>
                    <td className="p-3.5 text-right font-mono">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* INDIVIDUAL TRANSACTION RECORD */}
          <div className="space-y-2 mb-6 page-break-before">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">B. Log Buku Kas / Detail Transaksi Lapangan</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-gray-200">
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">No Kas</th>
                    <th className="p-2.5">PIC</th>
                    <th className="p-2.5">Deskripsi Pekerjaan / Belanja</th>
                    <th className="p-2.5">Kategori</th>
                    <th className="p-2.5 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-slate-700">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic font-sans text-xs">
                        Tidak ada log detail transaksi kas pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 whitespace-nowrap">{tx.date}</td>
                        <td className="p-2.5 text-gray-500">{tx.petyCashNo || tx.invoiceNo || "-"}</td>
                        <td className="p-2.5 whitespace-nowrap font-sans font-medium text-slate-800">{tx.pic}</td>
                        <td className="p-2.5 text-slate-900 font-sans leading-relaxed">{tx.description}</td>
                        <td className="p-2.5 whitespace-nowrap font-sans">{tx.category}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {formatIDR(tx.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADDITIONAL NOTES FIELD */}
          {additionalNotes && (
            <div className="border border-gray-200 rounded-xl p-4 text-xs mb-8">
              <h4 className="font-bold text-slate-800 mb-1">C. Catatan Khusus &amp; Lampiran Kemajuan Lapangan:</h4>
              <p className="text-gray-600 leading-relaxed italic">"{additionalNotes}"</p>
            </div>
          )}

          {/* SIGNATURE BLOCK */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-800 border-t border-dashed border-gray-200">
            <div className="space-y-16">
              <p>Dibuat oleh,<br /><span className="text-gray-400 font-normal">{createdTitle || "PIC Lapangan"}</span></p>
              <div>
                <p className="font-bold underline">{createdBy || "P Ujang"}</p>
                <p className="text-[10px] text-gray-400">{createdRole}</p>
              </div>
            </div>

            <div className="space-y-16">
              <p>Diperiksa oleh,<br /><span className="text-gray-400 font-normal">{checkedTitle || "Project Manager"}</span></p>
              <div>
                <p className="font-bold underline">{checkedBy || "BPK. Ujang N"}</p>
                <p className="text-[10px] text-gray-400">{checkedRole}</p>
              </div>
            </div>

            <div className="space-y-16">
              <p>Disetujui oleh,<br /><span className="text-gray-400 font-normal">Direksi</span></p>
              <div>
                <p className="font-bold underline">{directorName || "Bpk. H. Ramdani Rifki"}</p>
                <p className="text-[10px] text-gray-400">{compDetails.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

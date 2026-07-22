/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, Category, PetyCashItem } from "../types";
import { CATEGORIES } from "../data";
import { 
  Plus, 
  ListFilter, 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  HelpCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Landmark, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  Calendar, 
  User,
  Printer,
  Edit3,
  Users,
  Award,
  TrendingUp,
  FileText,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PdfViewerModal, { getPdfBlobUrl } from "./PdfViewerModal";

export const printVoucher = (tx: Transaction, project: Project | undefined, companyName: string = tx.company || project?.company || "CV. Mandiri Cipta Jaya") => {
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

  const isRequest = tx.type === "PetyCashRequest";
  const voucherTitle = isRequest ? "FORM PENGAJUAN PETTY CASH" : "VOUCHER PENGELUARAN PETTY CASH";
  const voucherSub = isRequest ? "Permohonan Kas-Bon Lapangan" : "Realisasi Kas Kecil";

  const itemsHTML = tx.items && tx.items.length > 0 
    ? tx.items.map((item, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 8px;">${item.description}</td>
          <td style="padding: 8px; text-align: center;">${item.category}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${formatIDRPrint(item.amount)}</td>
        </tr>
      `).join("")
    : `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; text-align: center;">1</td>
          <td style="padding: 8px;">${tx.description}</td>
          <td style="padding: 8px; text-align: center;">${tx.category}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${formatIDRPrint(tx.amount)}</td>
        </tr>
      `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak Voucher - ${tx.petyCashNo || tx.id}</title>
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
          color: #1a365d;
        }
        .header-subtitle {
          font-size: 11px;
          color: #718096;
          text-align: right;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
        }
        .company-sub {
          font-size: 10px;
          color: #718096;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
        }
        .meta-table td {
          padding: 10px 15px;
          font-size: 12px;
          border-bottom: 1px solid #edf2f7;
        }
        .meta-label {
          font-weight: bold;
          color: #4a5568;
          width: 150px;
        }
        .meta-value {
          color: #2d3748;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }
        .items-table th {
          background-color: #2d3748;
          color: #ffffff;
          padding: 10px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
        }
        .items-table td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .total-row {
          background-color: #f7fafc;
          font-weight: bold;
          font-size: 13px;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 50px;
          font-size: 12px;
        }
        .signature-title {
          font-weight: bold;
          text-align: center;
          padding-bottom: 60px;
          color: #4a5568;
          text-transform: uppercase;
          font-size: 10px;
        }
        .signature-name {
          text-align: center;
          border-bottom: 1px solid #718096;
          padding-bottom: 4px;
          font-weight: bold;
        }
        .signature-role {
          text-align: center;
          font-size: 10px;
          color: #718096;
          padding-top: 4px;
        }
        @media print {
          body { margin: 20px; }
          button { display: none; }
        }
        .no-print-btn {
          background-color: #3182ce;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .no-print-btn:hover {
          background-color: #2b6cb0;
        }
      </style>
    </head>
    <body>
      <div style="text-align: right; margin-bottom: 10px;">
        <button class="no-print-btn" onclick="window.print()">Cetak Dokumen (Print)</button>
      </div>

      <table class="header-table">
        <tr>
          <td>
            <div class="company-name">${companyName}</div>
            <div class="company-sub">Kontraktor & Penyuplai Mekanikal Elektrikal Sipil</div>
          </td>
          <td style="text-align: right;">
            <div class="header-title">${voucherTitle}</div>
            <div class="header-subtitle">${voucherSub}</div>
          </td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Nomor Dokumen:</td>
          <td class="meta-value" style="font-weight: bold; font-family: monospace; font-size: 13px;">${tx.petyCashNo || '-'}</td>
          <td class="meta-label">Tanggal:</td>
          <td class="meta-value">${tx.date}</td>
        </tr>
        <tr>
          <td class="meta-label">PIC Pemohon/Penerima:</td>
          <td class="meta-value" style="font-weight: bold;">${tx.pic || '-'}</td>
          <td class="meta-label">Metode Pembayaran:</td>
          <td class="meta-value">${tx.paymentMethod || 'Tunai'}</td>
        </tr>
        <tr>
          <td class="meta-label">Proyek Terkait:</td>
          <td class="meta-value" colspan="3">[${project?.code || 'N/A'}] ${project?.name || 'N/A'}</td>
        </tr>
        <tr>
          <td class="meta-label">Status Dokumen:</td>
          <td class="meta-value" colspan="3" style="text-transform: uppercase; font-weight: bold; color: #2b6cb0;">${tx.status}</td>
        </tr>
      </table>

      <h3 style="font-size: 13px; text-transform: uppercase; margin-bottom: 10px; color: #2d3748; border-bottom: 2px solid #2d3748; padding-bottom: 4px;">Rincian Pengajuan Dana</h3>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50px; text-align: center;">No</th>
            <th style="text-align: left;">Deskripsi Barang / Keperluan</th>
            <th style="width: 150px; text-align: center;">Kategori Anggaran</th>
            <th style="width: 150px; text-align: right;">Jumlah Nominal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 12px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">TOTAL KESELURUHAN:</td>
            <td style="text-align: right; padding: 12px; color: #2d3748; font-size: 14px;">${formatIDRPrint(tx.amount)}</td>
          </tr>
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td style="width: 25%;">
            <div class="signature-title">Diajukan Oleh</div>
            <div class="signature-name">${tx.pic || 'PIC Lapangan'}</div>
            <div class="signature-role">PIC Pemohon</div>
          </td>
          <td style="width: 25%;">
            <div class="signature-title">Diperiksa Oleh</div>
            <div class="signature-name">&nbsp;</div>
            <div class="signature-role">Site Manager / Supervisor</div>
          </td>
          <td style="width: 25%;">
            <div class="signature-title">Disetujui Oleh</div>
            <div class="signature-name">&nbsp;</div>
            <div class="signature-role">Project Manager / Direksi</div>
          </td>
          <td style="width: 25%;">
            <div class="signature-title">Dibayarkan Oleh</div>
            <div class="signature-name">&nbsp;</div>
            <div class="signature-role">Finance & Kasir Kantor</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

interface PetyCashRequestManagerProps {
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
  categories?: string[];
  setCategories?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PetyCashRequestManager({
  projects,
  transactions,
  setTransactions,
  selectedProjectId,
  onAddActivity,
  isReadOnly = false,
  categories = [],
  setCategories,
}: PetyCashRequestManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "summary">("list");

  // PDF Preview & Transfer Proof States
  const [pdfViewRequest, setPdfViewRequest] = React.useState<Transaction | null>(null);
  const [transferProofTx, setTransferProofTx] = React.useState<Transaction | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [showExcelPreview, setShowExcelPreview] = React.useState(false);
  const [selectedPdfPreview, setSelectedPdfPreview] = React.useState<{ name: string; data: string } | null>(null);

  // Form Fields
  const [projectId, setProjectId] = React.useState(selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id || ""));

  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const [pic, setPic] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [requestNo, setRequestNo] = React.useState("");
  const [status, setStatus] = React.useState("Belum Proses");
  const [paymentMethod, setPaymentMethod] = React.useState("Tunai");

  const [company, setCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [customCompany, setCustomCompany] = React.useState("");

  // Automatically adjust company selector based on selected project
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

  // Editing states
  const [editingRequestId, setEditingRequestId] = React.useState<string | null>(null);
  const [isManualRequestNo, setIsManualRequestNo] = React.useState(false);

  // Items Builder State
  const [currentItems, setCurrentItems] = React.useState<PetyCashItem[]>([]);
  const [itemDesc, setItemDesc] = React.useState("");
  const [itemCat, setItemCat] = React.useState<Category>("Consumable");
  const [itemAmt, setItemAmt] = React.useState<number>(0);
  const [customCatName, setCustomCatName] = React.useState("");

  // Filter States
  const [filterProject, setFilterProject] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Expand states for requests in table
  const [expandedRequests, setExpandedRequests] = React.useState<Record<string, boolean>>({});

  // Custom Modal Confirmation for Delete & Alert States
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [requestToDelete, setRequestToDelete] = React.useState<string | null>(null);
  const [requestToRealize, setRequestToRealize] = React.useState<Transaction | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // AUTO-SAVE & AUTO-LOAD DRAFT FOR PETY CASH REQUEST FORM
  React.useEffect(() => {
    const savedDraft = localStorage.getItem("pety_cash_request_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft) {
          if (draft.projectId) setProjectId(draft.projectId);
          if (draft.pic) setPic(draft.pic);
          if (draft.date) setDate(draft.date);
          if (draft.requestNo) setRequestNo(draft.requestNo);
          if (draft.status) setStatus(draft.status);
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
          if (draft.company) setCompany(draft.company);
          if (draft.customCompany) setCustomCompany(draft.customCompany);
          if (draft.currentItems) setCurrentItems(draft.currentItems);
          if (draft.showAddForm !== undefined) setShowAddForm(draft.showAddForm);
        }
      } catch (err) {
        console.error("Error loading pety cash request draft", err);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!editingRequestId) {
      const draft = {
        projectId,
        pic,
        date,
        requestNo,
        status,
        paymentMethod,
        company,
        customCompany,
        currentItems,
        showAddForm
      };
      localStorage.setItem("pety_cash_request_draft", JSON.stringify(draft));
    }
  }, [
    projectId,
    pic,
    date,
    requestNo,
    status,
    paymentMethod,
    company,
    customCompany,
    currentItems,
    showAddForm,
    editingRequestId
  ]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getRequestSpent = (reqId: string) => {
    return transactions
      .filter((t) => t.type === "PetyCash" && t.requestId === reqId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRequestRemaining = (req: Transaction) => {
    const spent = getRequestSpent(req.id);
    return Math.max(0, req.amount - spent);
  };

  // Generate automated request number
  React.useEffect(() => {
    if (!isManualRequestNo && !editingRequestId) {
      const existingRequests = transactions.filter((t) => t.type === "PetyCashRequest");
      let maxNum = 0;
      existingRequests.forEach((t) => {
        if (t.petyCashNo) {
          const match = t.petyCashNo.match(/(?:PC|REQ-PC)-(\d+)/i) || t.petyCashNo.match(/^(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      });
      const nextNum = maxNum + 1;
      setRequestNo(`PC-${String(nextNum).padStart(3, "0")}`);
    }
  }, [transactions, isManualRequestNo, editingRequestId]);

  // Handle adding individual item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc.trim()) {
      setValidationError("Harap masukkan deskripsi item belanja!");
      return;
    }
    if (itemAmt <= 0) {
      setValidationError("Nominal item harus lebih dari Rp 0!");
      return;
    }

    let finalCat = itemCat;
    if (itemCat === "ADD_NEW_CATEGORY") {
      const trimmed = customCatName.trim();
      if (!trimmed) {
        setValidationError("Harap masukkan nama kategori anggaran manual!");
        return;
      }
      finalCat = trimmed;
      if (setCategories && categories && !categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
    }

    setValidationError(null);

    const newItem: PetyCashItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      description: itemDesc.trim(),
      category: finalCat,
      amount: Number(itemAmt),
    };

    setCurrentItems((prev) => [...prev, newItem]);
    
    // Reset item fields
    setItemDesc("");
    setItemAmt(0);
    setCustomCatName("");
    setItemCat("Consumable");
  };

  // Handle removing individual item from list
  const handleRemoveItem = (id: string) => {
    setCurrentItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Total amount of current request items
  const totalAmount = currentItems.reduce((sum, item) => sum + item.amount, 0);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !pic) {
      setValidationError("Harap lengkapi semua isian wajib (Proyek, PIC Pemohon)!");
      return;
    }

    if (currentItems.length === 0) {
      setValidationError("Harap tambahkan minimal 1 item belanja ke dalam daftar pengajuan!");
      return;
    }

    setValidationError(null);

    // Combine description list for summary searchability
    const summaryDesc = currentItems.map((item) => `${item.description} (${formatIDR(item.amount)})`).join(", ");

    if (editingRequestId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingRequestId
            ? {
                ...t,
                projectId,
                pic,
                date,
                petyCashNo: requestNo,
                status,
                description: summaryDesc,
                category: currentItems[0]?.category || "Consumable",
                paymentMethod,
                amount: totalAmount,
                items: currentItems,
                company: company === "Lainnya" ? customCompany : company,
              }
            : t
        )
      );
      setAlertMessage("Pengajuan Petty Cash berhasil diubah!");
      if (onAddActivity) {
        const proj = projects.find((p) => p.id === projectId);
        const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalAmount);
        onAddActivity(
          "petycash_request",
          "Pengajuan Petty Cash Diubah",
          `Mengubah pengajuan petty cash [${requestNo}] sebesar ${displayAmt} untuk proyek "${proj ? proj.name : "Proyek"}"`,
          pic,
          projectId
        );
      }
    } else {
      const newRequest: Transaction = {
        id: `req-${Date.now()}`,
        projectId,
        type: "PetyCashRequest",
        pic,
        date,
        petyCashNo: requestNo,
        status, // "Belum Proses" or "Disetujui" or "Ditolak"
        description: summaryDesc,
        category: currentItems[0]?.category || "Consumable", // Fallback to first item category
        paymentMethod,
        amount: totalAmount,
        items: currentItems,
        company: company === "Lainnya" ? customCompany : company,
      };

      setTransactions((prev) => [newRequest, ...prev]);
      setAlertMessage("Pengajuan Petty Cash berhasil dikirim!");
      if (onAddActivity) {
        const proj = projects.find((p) => p.id === projectId);
        const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalAmount);
        onAddActivity(
          "petycash_request",
          "Pengajuan Petty Cash",
          `Mengajukan dana petty cash [${requestNo}] sebesar ${displayAmt} untuk proyek "${proj ? proj.name : "Proyek"}"`,
          pic,
          projectId
        );
      }
    }

    // Reset Form
    setPic("");
    setCurrentItems([]);
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setEditingRequestId(null);
    setIsManualRequestNo(false);
    setShowAddForm(false);
  };

  const startEditRequest = (req: Transaction) => {
    setEditingRequestId(req.id);
    setProjectId(req.projectId);
    setPic(req.pic || "");
    setDate(req.date);
    setRequestNo(req.petyCashNo || "");
    setIsManualRequestNo(true);
    setStatus(req.status);
    setPaymentMethod(req.paymentMethod || "Tunai");
    setCurrentItems(req.items || []);
    if (req.company) {
      if (req.company === "CV. Mandiri Cipta Jaya" || req.company === "PT. Elqia Jaya Teknik") {
        setCompany(req.company);
      } else {
        setCompany("Lainnya");
        setCustomCompany(req.company);
      }
    }
    setShowAddForm(true);

    const element = document.getElementById("pety-cash-request-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingRequestId(null);
    setPic("");
    setCurrentItems([]);
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setIsManualRequestNo(false);
    setShowAddForm(false);
  };

  const triggerDeleteRequest = (id: string) => {
    setRequestToDelete(id);
  };

  const confirmDeleteRequest = () => {
    if (!requestToDelete) return;
    const id = requestToDelete;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setRequestToDelete(null);
    setAlertMessage("Pengajuan Petty Cash berhasil dihapus.");
  };

  const updateRequestStatus = (id: string, newStatus: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (onAddActivity) {
            onAddActivity(
              "petycash_request",
              `Pengajuan ${newStatus}`,
              `Pengajuan petty cash [${t.petyCashNo}] milik ${t.pic} telah ${newStatus.toLowerCase()}`,
              "Administrator",
              t.projectId
            );
          }
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Realize Request into Petty Cash Actual Expense
  const triggerRealizeToExpense = (request: Transaction) => {
    if (request.status !== "Disetujui") {
      setAlertMessage("Hanya pengajuan dengan status 'Disetujui' yang dapat direalisasikan ke pengeluaran!");
      return;
    }
    setRequestToRealize(request);
  };

  const confirmRealizeToExpense = () => {
    if (!requestToRealize) return;
    const request = requestToRealize;

    // Find maximum pety cash number to generate next one
    const petyCashTxs = transactions.filter((t) => t.type === "PetyCash" && t.petyCashNo);
    let maxNum = 0;
    petyCashTxs.forEach((t) => {
      if (t.petyCashNo) {
        const match = t.petyCashNo.match(/(?:PC|REQ-PC)-(\d+)/i) || t.petyCashNo.match(/^(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    const nextPetyCashNo = maxNum + 1;
    const generatedNo = `PC-${String(nextPetyCashNo).padStart(3, "0")}`;

    const newExpense: Transaction = {
      id: `tx-${Date.now()}`,
      projectId: request.projectId,
      type: "PetyCash",
      pic: request.pic,
      date: new Date().toISOString().split("T")[0],
      petyCashNo: generatedNo,
      status: "Sudah Proses",
      description: `[Realisasi ${request.petyCashNo}] ${request.description}`,
      category: request.category,
      paymentMethod: request.paymentMethod,
      amount: request.amount,
      items: request.items, // carry over the list items!
      requestId: request.id,
    };

    // Insert expense and update request status to "Sudah Realisasi"
    setTransactions((prev) => [
      newExpense,
      ...prev.map((t) => (t.id === request.id ? { ...t, status: "Sudah Realisasi" } : t)),
    ]);

    if (onAddActivity) {
      const proj = projects.find((p) => p.id === request.projectId);
      const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(request.amount);
      onAddActivity(
        "petycash_expense",
        "Realisasi Petty Cash",
        `Merealisasikan pengajuan [${request.petyCashNo}] menjadi pengeluaran riil [${generatedNo}] senilai ${displayAmt} untuk proyek "${proj ? proj.name : "Proyek"}"`,
        request.pic || "Sistem",
        request.projectId
      );
    }

    setRequestToRealize(null);
    setAlertMessage(`Berhasil merealisasikan pengajuan petty cash! Kode Pengeluaran: ${generatedNo}`);
  };

  const handleFileUpload = (file: File) => {
    if (!transferProofTx) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      alert("Hanya file gambar (PNG, JPG, JPEG) atau dokumen PDF yang diperbolehkan sebagai bukti transfer.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 15MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === transferProofTx.id) {
            return { ...t, transferProof: base64 };
          }
          // Also attach to the corresponding PetyCash expense transaction if realized
          if (t.type === "PetyCash" && t.requestId === transferProofTx.id) {
            return { ...t, transferProof: base64 };
          }
          return t;
        })
      );
      setTransferProofTx((prev) => prev ? { ...prev, transferProof: base64 } : null);
      setAlertMessage(
        isPdf
          ? "Dokumen PDF bukti transfer berhasil diunggah!"
          : "Bukti transfer manual berhasil diunggah!"
      );
    };
    reader.readAsDataURL(file);
  };

  // Budget alert warning
  const getBudgetImpact = () => {
    if (totalAmount <= 0 || !projectId) return null;
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return null;

    const contractBase =
      (proj.contractValue?.piping || 0) +
      (proj.contractValue?.electrical || 0) +
      (proj.contractValue?.mechanical || 0) +
      (proj.contractValue?.scafolder || 0) +
      (proj.contractValue?.welder || 0);

    if (contractBase === 0) return null;

    const existingSpending = transactions
      .filter((t) => t.projectId === projectId && t.type === "PetyCash")
      .reduce((sum, t) => sum + t.amount, 0);

    const newRatio = ((existingSpending + totalAmount) / contractBase) * 100;
    const threshold = proj.budgetThresholdPercent || 85;

    return {
      newRatio,
      isOverThreshold: newRatio >= threshold,
      isOverContract: newRatio >= 100,
      projectName: proj.name,
      limit: contractBase,
    };
  };

  const budgetImpact = getBudgetImpact();

  // List of requests
  const requestList = transactions.filter((t) => t.type === "PetyCashRequest");

  const getPetyCashNumber = (petyCashNo: string | undefined): number => {
    if (!petyCashNo) return 999999;
    const match = petyCashNo.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
  };

  const filteredRequests = requestList.filter((req) => {
    // Project filter
    if (filterProject !== "all" && req.projectId !== filterProject) return false;
    
    // Status filter
    if (filterStatus !== "all" && req.status !== filterStatus) return false;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const picMatch = req.pic?.toLowerCase().includes(q);
      const descMatch = req.description?.toLowerCase().includes(q);
      const noMatch = req.petyCashNo?.toLowerCase().includes(q);
      
      // search item details as well!
      const itemsMatch = req.items?.some(
        (item) => item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      );

      return picMatch || descMatch || noMatch || itemsMatch;
    }

    return true;
  }).sort((a, b) => getPetyCashNumber(a.petyCashNo) - getPetyCashNumber(b.petyCashNo));

  const totalRequestedSum = filteredRequests.reduce((sum, req) => sum + req.amount, 0);

  // Group and summarize petty cash requests by requester (PIC)
  const requesterSummary = React.useMemo(() => {
    const summaryMap: Record<string, {
      pic: string;
      totalRequested: number;
      totalApproved: number;
      totalRejected: number;
      totalPending: number;
      totalRealized: number;
      requestCount: number;
      itemsCount: number;
    }> = {};

    requestList.forEach((req) => {
      const name = (req.pic || "Tanpa Nama").trim();
      if (!summaryMap[name]) {
        summaryMap[name] = {
          pic: name,
          totalRequested: 0,
          totalApproved: 0,
          totalRejected: 0,
          totalPending: 0,
          totalRealized: 0,
          requestCount: 0,
          itemsCount: 0,
        };
      }

      const s = summaryMap[name];
      s.requestCount += 1;
      s.totalRequested += req.amount;
      s.itemsCount += req.items?.length || 0;

      if (req.status === "Disetujui") {
        s.totalApproved += req.amount;
      } else if (req.status === "Ditolak") {
        s.totalRejected += req.amount;
      } else if (req.status === "Belum Proses") {
        s.totalPending += req.amount;
      } else if (req.status === "Sudah Realisasi" || req.status === "Realisasi Sebagian") {
        s.totalApproved += req.amount;
        s.totalRealized += getRequestSpent(req.id);
      }
    });

    return Object.values(summaryMap).sort((a, b) => b.totalRequested - a.totalRequested);
  }, [requestList, transactions]);

  // Overall metadata metrics for employees
  const totalEmployees = requesterSummary.length;
  const topSubmitter = requesterSummary[0] || null;
  const mostActive = [...requesterSummary].sort((a, b) => b.requestCount - a.requestCount)[0] || null;

  return (
    <div className="space-y-6 font-sans pb-12" id="pety-cash-request-section">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Send className="w-5.5 h-5.5 text-blue-600" />
            Pengajuan Petty Cash Lapangan {isReadOnly && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">ReadOnly</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Formulir permohonan dana kas kecil proyek. Anda dapat mengajukan <strong>beberapa item sekaligus</strong> dalam satu pengajuan.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ajukan Petty Cash Baru
          </button>
        )}
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode("list")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200"
          }`}
        >
          <ListFilter className="w-4 h-4" /> Daftar Pengajuan ({requestList.length})
        </button>
        <button
          onClick={() => setViewMode("summary")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200"
          }`}
        >
          <Users className="w-4 h-4" /> Ringkasan &amp; Kedisiplinan Pemohon ({totalEmployees})
        </button>
      </div>

      {viewMode === "list" ? (
        <>
          {/* REQUEST FORM CONTAINER */}
          {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white border-2 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
            editingRequestId ? "border-amber-500/30 shadow-amber-500/5" : "border-blue-500/20"
          }`}
        >
          <div className={`p-4 border-b flex items-center justify-between transition-colors ${
            editingRequestId ? "bg-amber-50/80 border-amber-500/10" : "bg-blue-50/50 border-blue-500/10"
          }`}>
            <div className="flex items-center gap-2">
              <Edit3 className={`w-5 h-5 ${editingRequestId ? "text-amber-600" : "text-blue-600"}`} />
              <h3 className="font-bold text-sm text-gray-900 font-sans">
                {editingRequestId 
                  ? `Ubah Detail Pengajuan Petty Cash (No: ${requestNo})` 
                  : "Form Permohonan Petty Cash Proyek"}
              </h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              editingRequestId ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
            }`}>
              {editingRequestId ? "Mode Ubah Data (Edit)" : "Mode Multi-Item Aktif"}
            </span>
          </div>

          <form onSubmit={handleCreateRequest} className="p-6 space-y-6">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            )}
            {/* SECTION 1: METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              {/* Project */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Pilih Kontrak Kerja / Proyek <span className="text-red-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-sans"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Perusahaan */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-semibold text-gray-700">Perusahaan <span className="text-red-500">*</span></label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-gray-800 font-semibold"
                >
                  <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
                  <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
                  <option value="Lainnya">Lainnya (Ketik Manual)</option>
                </select>
                {company === "Lainnya" && (
                  <input
                    type="text"
                    required
                    placeholder="Nama Perusahaan..."
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white mt-1.5"
                  />
                )}
              </div>

              {/* Request Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nomor Pengajuan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PC-001..."
                  value={requestNo}
                  onChange={(e) => {
                    setRequestNo(e.target.value);
                    setIsManualRequestNo(true);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-mono font-bold focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* PIC Pemohon */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  PIC Pemohon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: P Wawan, Budi Prasetyo"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tanggal Pengajuan</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              {/* Metode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Rekomendasi Metode Pencairan</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="Tunai">Tunai / Pety Cash</option>
                  <option value="Transfer">Transfer Bank</option>
                </select>
              </div>

              {/* Initial Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Status Pengajuan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-bold ${
                    status === "Disetujui" 
                      ? "text-blue-700" 
                      : status === "Ditolak" 
                      ? "text-red-700" 
                      : status === "Sudah Realisasi" || status === "Realisasi Sebagian"
                      ? "text-emerald-700" 
                      : "text-amber-700"
                  }`}
                >
                  <option value="Belum Proses">Belum Proses (Draft)</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                  {(status === "Sudah Realisasi" || status === "Realisasi Sebagian" || editingRequestId) && (
                    <>
                      <option value="Realisasi Sebagian">Realisasi Sebagian</option>
                      <option value="Sudah Realisasi">Sudah Realisasi (Lengkap)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* SECTION 2: DYNAMIC LIST ITEM BUILDER */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Input Item Belanja</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Item description */}
                <div className="space-y-1 md:col-span-6">
                  <label className="text-[10px] font-bold text-gray-500">Nama Barang / Deskripsi Keperluan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Semen Tiga Roda 10 Sak atau Bensin Genset 20L"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Item Category */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-500">Kategori Anggaran</label>
                  <select
                    value={itemCat}
                    onChange={(e) => setItemCat(e.target.value as Category)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="ADD_NEW_CATEGORY" className="font-bold text-blue-600 bg-blue-50">+ Tambah Kategori Manual...</option>
                  </select>
                </div>

                {/* Item Amount */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500">Nominal (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 750.000"
                    value={itemAmt ? new Intl.NumberFormat("id-ID").format(itemAmt) : ""}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setItemAmt(clean ? Number(clean) : 0);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Add button */}
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {itemCat === "ADD_NEW_CATEGORY" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all animate-fade-in">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">✍️ Nama Kategori Anggaran Manual</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Alat Pelindung Diri, Konsumsi Lembur, dsb."
                      value={customCatName}
                      onChange={(e) => setCustomCatName(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs text-blue-900 font-bold placeholder-blue-300 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-blue-600 sm:max-w-xs leading-relaxed">
                    Kategori baru ini akan otomatis tersimpan ke daftar master dan langsung bisa digunakan kembali di pengajuan selanjutnya.
                  </p>
                </div>
              )}

              {/* List of currently added items */}
              <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-gray-600 font-semibold border-b border-gray-200">
                      <th className="p-2">No</th>
                      <th className="p-2">Deskripsi Barang / Jasa</th>
                      <th className="p-2">Kategori</th>
                      <th className="p-2 text-right">Nominal</th>
                      <th className="p-2 text-center w-12">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-400 font-medium italic">
                          Belum ada item belanja yang ditambahkan. Gunakan kolom di atas untuk membuat list.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-2 text-gray-400 font-mono">{index + 1}</td>
                          <td className="p-2 font-medium text-slate-800">{item.description}</td>
                          <td className="p-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-950">{formatIDR(item.amount)}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {currentItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-gray-200">
                        <td colSpan={3} className="p-2.5 text-right text-gray-600 text-[11px] uppercase tracking-wider">
                          Total Kumulatif Pengajuan:
                        </td>
                        <td className="p-2.5 text-right font-mono text-blue-600 text-sm">{formatIDR(totalAmount)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Real-time budget simulation feedback */}
            {budgetImpact && (
              <div className={`p-4 rounded-xl border flex gap-3 text-xs ${
                budgetImpact.isOverContract
                  ? "bg-red-50 border-red-200 text-red-900"
                  : budgetImpact.isOverThreshold
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-100 text-blue-900"
              }`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                  budgetImpact.isOverContract ? "text-red-600" : budgetImpact.isOverThreshold ? "text-amber-600" : "text-blue-600"
                }`} />
                <div className="space-y-1">
                  <p className="font-bold">
                    {budgetImpact.isOverContract
                      ? "ALARM KRITIS: Melampaui Batas Kontrak!"
                      : budgetImpact.isOverThreshold
                      ? "Peringatan Batas Anggaran Proyek!"
                      : "Dampak Finansial Proyek"}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Pengajuan total sebesar <span className="font-bold">{formatIDR(totalAmount)}</span> untuk <span className="font-bold">{budgetImpact.projectName}</span> akan membawa rasio pengeluaran kumulatif proyek menjadi <span className="font-bold">{budgetImpact.newRatio.toFixed(1)}%</span> dari kontrak dasar.
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={editingRequestId ? handleCancelEdit : () => {
                  setShowAddForm(false);
                  setCurrentItems([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                {editingRequestId ? "Batalkan Ubah" : "Batalkan"}
              </button>
              <button
                type="submit"
                disabled={currentItems.length === 0}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                  currentItems.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {editingRequestId 
                  ? "Simpan Perubahan Pengajuan" 
                  : `Kirim Pengajuan Petty Cash (${currentItems.length} Item)`}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* FILTER & PENCARIAN PANEL */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <ListFilter className="w-4 h-4 text-blue-600" /> Filter Pengajuan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Proyek</label>
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
            <label className="text-[11px] font-semibold text-gray-500">Status Persetujuan</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="Belum Proses">Belum Proses (Pending)</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Sudah Realisasi">Sudah Realisasi</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Pencarian Deskripsi / PIC / Item</label>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-3 border-t border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500">
              Menampilkan <strong className="text-gray-900">{filteredRequests.length}</strong> pengajuan dari total{" "}
              <strong>{requestList.length}</strong>
            </span>
            <span className="text-slate-500 font-semibold">
              Total Saringan Nominal: <strong className="text-blue-600 font-mono text-sm">{formatIDR(totalRequestedSum)}</strong>
            </span>
          </div>
          <button
            onClick={() => setShowExcelPreview(true)}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-emerald-500/10"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Tampilan & Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3.5 w-8"></th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">No Pengajuan</th>
                <th className="p-3.5">Pemohon</th>
                <th className="p-3.5">Proyek</th>
                <th className="p-3.5">Daftar Item &amp; Keperluan Belanja</th>
                <th className="p-3.5 text-center">Metode</th>
                <th className="p-3.5 text-right">Total Nominal</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Aksi &amp; Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                    Belum ada data pengajuan petty cash yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const proj = projects.find((p) => p.id === req.projectId);
                  const isExpanded = !!expandedRequests[req.id];
                  const itemsCount = req.items?.length || 0;

                  return (
                    <React.Fragment key={req.id}>
                      <tr className={`hover:bg-slate-50/50 ${isExpanded ? "bg-blue-50/10" : ""}`}>
                        {/* Toggle button if items exist */}
                        <td className="p-3.5 text-center">
                          {itemsCount > 0 && (
                            <button
                              onClick={() => toggleExpand(req.id)}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-all cursor-pointer"
                              title="Tampilkan Detail Item"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </td>

                        {/* Date */}
                        <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono">
                          {req.date}
                        </td>

                        {/* Request Number */}
                        <td className="p-3.5 whitespace-nowrap font-mono space-y-1">
                          <div className="font-bold text-slate-700">{req.petyCashNo || "-"}</div>
                          {req.company && (
                            <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider font-sans">
                              🏢 {req.company}
                            </div>
                          )}
                        </td>

                        {/* Pemohon */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            {req.pic}
                          </div>
                        </td>

                        {/* Proyek */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-700">[{proj?.code || "N/A"}]</div>
                          <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]" title={proj?.name}>
                            {proj ? proj.name : "Proyek Dihapus"}
                          </p>
                        </td>

                        {/* Description (Items Summary) */}
                        <td className="p-3.5 max-w-sm">
                          <div className="space-y-1.5">
                            <p className="text-slate-900 font-medium leading-relaxed truncate max-w-xs" title={req.description}>
                              {req.description}
                            </p>
                            {itemsCount > 0 && (
                              <button
                                onClick={() => toggleExpand(req.id)}
                                className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase flex items-center gap-1 hover:bg-slate-200 transition-all cursor-pointer"
                              >
                                <span>{itemsCount} Item Belanja</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Method */}
                        <td className="p-3.5 text-center">
                          {req.paymentMethod && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.paymentMethod}
                            </span>
                          )}
                        </td>

                        {/* Total Nominal */}
                        <td className="p-3.5 text-right whitespace-nowrap font-mono">
                          <div className="font-extrabold text-slate-950 text-sm">
                            {formatIDR(req.amount)}
                          </div>
                          {(req.status === "Sudah Realisasi" || req.status === "Realisasi Sebagian" || req.status === "Disetujui") && (
                            <div className="text-[10px] text-gray-500 font-sans mt-0.5 space-y-0.5 text-left">
                              <div>Realisasi: <span className="font-bold text-emerald-600 font-mono">{formatIDR(getRequestSpent(req.id))}</span></div>
                              <div>Sisa: <span className="font-bold text-blue-600 font-mono">{formatIDR(getRequestRemaining(req))}</span></div>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                req.status === "Sudah Realisasi"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold"
                                  : req.status === "Realisasi Sebagian"
                                  ? "bg-cyan-100 text-cyan-800 border-cyan-300 font-bold"
                                  : req.status === "Disetujui"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : req.status === "Ditolak"
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {req.status}
                            </span>

                            {(req.status === "Sudah Realisasi" || req.status === "Realisasi Sebagian" || req.status === "Disetujui") && (
                              <button
                                onClick={() => setTransferProofTx(req)}
                                className={`inline-flex items-center justify-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-extrabold border shadow-xs transition-all cursor-pointer ${
                                  req.transferProof
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                }`}
                                title="Lihat / Unggah Bukti Transfer"
                              >
                                {req.transferProof ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    <span>Bukti OK</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                    <span>Bukti TF</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isReadOnly && req.status === "Belum Proses" && (
                              <>
                                <button
                                  onClick={() => updateRequestStatus(req.id, "Disetujui")}
                                  className="text-blue-600 hover:text-white hover:bg-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                                  title="Setujui Pengajuan"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => updateRequestStatus(req.id, "Ditolak")}
                                  className="text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 rounded text-[10px] font-bold border border-red-100 transition-colors cursor-pointer"
                                  title="Tolak Pengajuan"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {!isReadOnly && req.status === "Disetujui" && (
                              <button
                                onClick={() => triggerRealizeToExpense(req)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1 uppercase"
                                title="Cairkan & Realisasikan ke Buku Kas"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Realisasi PC
                              </button>
                            )}

                            {!isReadOnly && (
                              <button
                                onClick={() => startEditRequest(req)}
                                className="text-amber-600 hover:text-white hover:bg-amber-500 px-2.5 py-1 rounded text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-0.5"
                                title="Ubah Pengajuan"
                              >
                                <Edit3 className="w-3 h-3" /> Ubah
                              </button>
                            )}

                            <button
                              onClick={() => setPdfViewRequest(req)}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title="Lihat PDF Form & Cetak"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </button>

                            <button
                              onClick={() => printVoucher(req, proj)}
                              className="text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Cetak Form Pengajuan (Print)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {!isReadOnly && (
                              <button
                                onClick={() => triggerDeleteRequest(req.id)}
                                className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Pengajuan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row showing individual items list */}
                      <AnimatePresence>
                        {isExpanded && itemsCount > 0 && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-50/80 px-12 py-3 border-l-4 border-blue-600"
                              >
                                <div className="bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden">
                                  <div className="px-3.5 py-2.5 bg-slate-100 border-b border-gray-200 font-bold text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Detail Rincian Item ({itemsCount} Item)</span>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => printVoucher(req, proj)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-gray-300 font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                        title="Cetak Voucher Pengajuan"
                                      >
                                        <Printer className="w-3 h-3 text-blue-600" /> Cetak Form
                                      </button>
                                      <span>Kode Ref: {req.petyCashNo}</span>
                                    </div>
                                  </div>
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-semibold">
                                        <th className="p-2 w-10 text-center">No</th>
                                        <th className="p-2">Deskripsi Kebutuhan Lapangan</th>
                                        <th className="p-2">Kategori Anggaran</th>
                                        <th className="p-2 text-right">Nominal Item</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {req.items?.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                          <td className="p-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                          <td className="p-2 font-medium text-slate-800">{item.description}</td>
                                          <td className="p-2">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                              {item.category}
                                            </span>
                                          </td>
                                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatIDR(item.amount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-slate-100 font-bold border-t border-gray-200">
                                        <td colSpan={3} className="p-2.5 text-right text-gray-600 text-[10px] uppercase tracking-wider">
                                          Total Dana Kas-Bon Diajukan:
                                        </td>
                                        <td className="p-2.5 text-right font-mono text-blue-600 text-sm">{formatIDR(req.amount)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-6">
      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Pemohon Aktif</p>
            <p className="text-xl font-bold text-slate-800">{totalEmployees} Karyawan</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Pengaju Dana Terbanyak</p>
            <p className="text-base font-bold text-slate-800 truncate">
              {topSubmitter ? topSubmitter.pic : "-"}
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              {topSubmitter ? formatIDR(topSubmitter.totalRequested) : "-"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Frekuensi Input Tertinggi</p>
            <p className="text-base font-bold text-slate-800 truncate">
              {mostActive ? mostActive.pic : "-"}
            </p>
            <p className="text-[10px] text-gray-500">
              {mostActive ? `${mostActive.requestCount} Pengajuan (${mostActive.itemsCount} Item)` : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* TABLE OF EMPLOYEES AND PERFORMANCE/DISCIPLINE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-sans">Kedisiplinan &amp; Analisis Pengajuan Karyawan</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
              Menganalisis total dana yang diajukan beserta tingkat kedisiplinan pengembalian nota belanja (Realisasi).
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-lg">
            Urutan berdasarkan Total Nilai Pengajuan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-white font-semibold">
                <th className="p-4">Nama Pemohon (Karyawan)</th>
                <th className="p-4">Total Nilai Pengajuan</th>
                <th className="p-4 text-center">Jumlah Pengajuan</th>
                <th className="p-4">Rata-Rata Nominal</th>
                <th className="p-4 text-center">Distribusi Status</th>
                <th className="p-4 text-right">Telah Direalisasi</th>
                <th className="p-4 text-right">Kedisiplinan Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {requesterSummary.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 italic bg-white">
                    Belum ada data pengajuan petty cash yang dapat diringkas.
                  </td>
                </tr>
              ) : (
                requesterSummary.map((item) => {
                  const maxRequested = topSubmitter?.totalRequested || 1;
                  const percentage = (item.totalRequested / maxRequested) * 100;
                  
                  // Calculate discipline rate (realization percentage of approved/requested funds)
                  const realizationRate = item.totalApproved > 0 
                    ? (item.totalRealized / item.totalApproved) * 100 
                    : 0;

                  return (
                    <tr key={item.pic} className="hover:bg-slate-50/50 transition-colors bg-white">
                      {/* PIC Name */}
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center uppercase shrink-0">
                          {item.pic.charAt(0)}
                        </div>
                        <span>{item.pic}</span>
                      </td>

                      {/* Total Requested & Progress bar */}
                      <td className="p-4 space-y-1.5 w-64">
                        <div className="font-mono font-bold text-gray-900">
                          {formatIDR(item.totalRequested)}
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.max(3, percentage)}%` }}
                          />
                        </div>
                      </td>

                      {/* Request Count */}
                      <td className="p-4 text-center font-bold text-gray-700">
                        {item.requestCount} Kali
                        <div className="text-[10px] font-normal text-gray-400">
                          ({item.itemsCount} Item Barang)
                        </div>
                      </td>

                      {/* Average Request Size */}
                      <td className="p-4 font-mono text-gray-600 font-semibold">
                        {formatIDR(item.totalRequested / item.requestCount)}
                      </td>

                      {/* Status breakdown dots / mini badges */}
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2.5">
                          {/* Approved */}
                          {item.totalApproved > 0 && (
                            <div className="text-center" title="Approved / Realized">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
                              <span className="font-bold text-[10px] text-gray-700">Approved</span>
                            </div>
                          )}
                          {/* Pending / Draft */}
                          {item.totalPending > 0 && (
                            <div className="text-center" title="Belum Proses (Draft)">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" />
                              <span className="font-bold text-[10px] text-gray-700">Draft</span>
                            </div>
                          )}
                          {/* Rejected */}
                          {item.totalRejected > 0 && (
                            <div className="text-center" title="Ditolak">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1" />
                              <span className="font-bold text-[10px] text-gray-700">Ditolak</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Realized (Actual expense receipt uploaded) */}
                      <td className="p-4 text-right font-mono text-emerald-700 font-bold">
                        {formatIDR(item.totalRealized)}
                      </td>

                      {/* Realization Rate / Discipline Rate */}
                      <td className="p-4 text-right">
                        <div className="inline-block">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                            realizationRate >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : realizationRate >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {realizationRate.toFixed(1)}%
                          </span>
                          <p className="text-[9px] text-gray-400 mt-0.5 text-right font-medium">
                            {realizationRate >= 90 
                              ? "Sangat Disiplin" 
                              : realizationRate >= 50 
                              ? "Cukup Disiplin" 
                              : "Butuh Tindak Lanjut"}
                          </p>
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
    </div>
  )}

      {/* CONFIRM DELETE MODAL */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Hapus Pengajuan Petty Cash?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus pengajuan petty cash ini beserta seluruh daftar itemnya secara permanen?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRequest}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REALIZE MODAL */}
      {requestToRealize && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Realisasikan Pengajuan Petty Cash?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda ingin merealisasikan pengajuan {requestToRealize.petyCashNo} ini ke Pengeluaran Petty Cash aktual?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestToRealize(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmRealizeToExpense}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-emerald-500/15"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Ya, Realisasikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL SHEET PREVIEW & EXPORT MODAL */}
      {showExcelPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8">
            {/* Modal Header (Excel-Style Green theme) */}
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-200" />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Lembar Kerja Excel - Pengajuan Petty Cash
                    <span className="bg-emerald-700 text-emerald-100 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500 uppercase tracking-wider">
                      Online Spreadsheet
                    </span>
                  </h3>
                  <p className="text-[10px] text-emerald-200/90 font-medium">Berdasarkan filter aktif ({filteredRequests.length} baris terekam)</p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelPreview(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Excel ribbon toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-[11px] text-slate-600 font-medium overflow-x-auto">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200 font-bold">
                <Check className="w-3.5 h-3.5" /> File Terhubung
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <button
                onClick={() => {
                  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
                  html += `<head><meta charset="utf-8" /><style>`;
                  html += `table { border-collapse: collapse; width: 100%; font-family: sans-serif; }`;
                  html += `th { background-color: #047857; color: white; font-weight: bold; padding: 10px; border: 1px solid #10b981; text-align: left; font-size: 11px; }`;
                  html += `td { padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-size: 11px; }`;
                  html += `.text-right { text-align: right; }`;
                  html += `.text-center { text-align: center; }`;
                  html += `.font-mono { font-family: monospace; }`;
                  html += `.font-bold { font-weight: bold; }`;
                  html += `.title { font-size: 16px; font-weight: bold; color: #064e3b; text-align: center; padding: 10px 0; }`;
                  html += `</style></head><body>`;
                  
                  html += `<table>`;
                  html += `<tr><td colspan="9" class="title">REKAPITULASI PENGAJUAN PETTY CASH LAPANGAN</td></tr>`;
                  html += `<tr><td colspan="9" class="text-center" style="font-size: 10px; color: #64748b;">Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}</td></tr>`;
                  html += `<tr><td colspan="9"></td></tr>`;
                  
                  // Headers
                  html += `<tr>`;
                  html += `<th>No</th>`;
                  html += `<th>Tanggal</th>`;
                  html += `<th>No Pengajuan</th>`;
                  html += `<th>PIC Pemohon</th>`;
                  html += `<th>Proyek Terkait</th>`;
                  html += `<th>Deskripsi & Keperluan Belanja</th>`;
                  html += `<th>Metode Pembayaran</th>`;
                  html += `<th>Status Persetujuan</th>`;
                  html += `<th class="text-right">Nominal Pengajuan (Rp)</th>`;
                  html += `</tr>`;
                  
                  filteredRequests.forEach((req, idx) => {
                    const proj = projects.find((p) => p.id === req.projectId);
                    const projStr = proj ? `[${proj.code}] ${proj.name}` : "N/A";
                    
                    let itemDetails = req.description;
                    if (req.items && req.items.length > 0) {
                      itemDetails += " - Rincian: " + req.items.map((it) => `${it.description} (${formatIDR(it.amount)})`).join(", ");
                    }

                    html += `<tr>`;
                    html += `<td class="text-center">${idx + 1}</td>`;
                    html += `<td>${req.date}</td>`;
                    html += `<td class="font-mono">${req.petyCashNo || "-"}</td>`;
                    html += `<td>${req.pic}</td>`;
                    html += `<td>${projStr}</td>`;
                    html += `<td>${itemDetails}</td>`;
                    html += `<td class="text-center">${req.paymentMethod || "Tunai"}</td>`;
                    html += `<td class="text-center font-bold">${req.status}</td>`;
                    html += `<td class="text-right font-mono font-bold">${req.amount}</td>`;
                    html += `</tr>`;
                  });
                  
                  html += `<tr>`;
                  html += `<td colspan="8" class="text-right font-bold" style="background-color: #f0fdf4;">GRAND TOTAL:</td>`;
                  html += `<td class="text-right font-mono font-bold" style="background-color: #f0fdf4; color: #15803d;">${totalRequestedSum}</td>`;
                  html += `</tr>`;
                  
                  html += `</table></body></html>`;

                  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Rekap_Pengajuan_Petty_Cash_${new Date().toISOString().split("T")[0]}.xls`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="hover:text-emerald-700 hover:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center gap-1 text-slate-700"
              >
                📥 Unduh XLS Ke Excel
              </button>
              <div className="h-4 w-px bg-gray-200"></div>
              <span className="text-gray-400 select-none">Gridlines: On | Formulas: Auto | Sheet1</span>
            </div>

            {/* Excel Formula & Reference Bar */}
            <div className="bg-slate-50 border-b border-gray-200 px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="bg-white border border-gray-300 px-2 py-0.5 text-slate-700 font-bold rounded">A1:I{filteredRequests.length + 4}</span>
              <span className="text-gray-400 font-bold italic select-none">fx</span>
              <div className="bg-white border border-gray-300 rounded px-2 py-0.5 text-slate-700 flex-1 font-sans font-medium text-[11px] truncate">
                =REKAP_PETTY_CASH(CV. MANDIRI CIPTA JAYA, RowCount: {filteredRequests.length}, Sum: {formatIDR(totalRequestedSum)})
              </div>
            </div>

            {/* Excel Worksheet Sheet Body */}
            <div className="p-4 bg-slate-200 overflow-auto max-h-[60vh]">
              <div className="bg-white border border-slate-300 shadow-md min-w-[900px] text-[11px]">
                <table className="w-full border-collapse">
                  <thead>
                    {/* Column Headers (A, B, C...) */}
                    <tr className="bg-slate-100 text-slate-400 text-center font-mono select-none text-[10px] border-b border-slate-300">
                      <th className="w-10 bg-slate-200 border-r border-slate-300 p-1 font-bold text-slate-500">#</th>
                      <th className="border-r border-slate-300 p-1">A</th>
                      <th className="border-r border-slate-300 p-1">B</th>
                      <th className="border-r border-slate-300 p-1">C</th>
                      <th className="border-r border-slate-300 p-1">D</th>
                      <th className="border-r border-slate-300 p-1">E</th>
                      <th className="border-r border-slate-300 p-1">F</th>
                      <th className="border-r border-slate-300 p-1">G</th>
                      <th className="border-r border-slate-300 p-1">H</th>
                      <th className="p-1">I</th>
                    </tr>
                    {/* Header title inside spreadsheet */}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-100 text-center text-slate-400 font-mono border-r border-slate-300 p-1 select-none">1</td>
                      <td colSpan={9} className="p-3 text-center font-bold text-sm text-emerald-800 bg-emerald-50/50">
                        CV. MANDIRI CIPTA JAYA - REKAPITULASI PENGAJUAN PETTY CASH LAPANGAN
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="bg-slate-100 text-center text-slate-400 font-mono border-r border-slate-300 p-1 select-none">2</td>
                      <td colSpan={9} className="p-1 text-center text-[9px] text-gray-500 bg-slate-50">
                        Tanggal Cetak Otomatis: {new Date().toLocaleDateString("id-ID")} pukul {new Date().toLocaleTimeString("id-ID")} WIB
                      </td>
                    </tr>
                    {/* Table Column Labels */}
                    <tr className="bg-emerald-700 text-white font-bold text-left border-b border-slate-300">
                      <td className="bg-slate-200 text-center text-slate-500 font-mono border-r border-slate-300 p-1.5 select-none">3</td>
                      <td className="border-r border-emerald-600 p-2 text-center w-10">No</td>
                      <td className="border-r border-emerald-600 p-2">Tanggal</td>
                      <td className="border-r border-emerald-600 p-2">No Pengajuan</td>
                      <td className="border-r border-emerald-600 p-2">PIC Pemohon</td>
                      <td className="border-r border-emerald-600 p-2">Proyek Terkait</td>
                      <td className="border-r border-emerald-600 p-2">Deskripsi &amp; Item Keperluan</td>
                      <td className="border-r border-emerald-600 p-2 text-center w-24">Metode</td>
                      <td className="border-r border-emerald-600 p-2 text-center w-28">Status</td>
                      <td className="p-2 text-right w-36">Nominal (IDR)</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {filteredRequests.map((req, idx) => {
                      const proj = projects.find((p) => p.id === req.projectId);
                      const rowNum = idx + 4;

                      let itemDetails = req.description;
                      if (req.items && req.items.length > 0) {
                        itemDetails += " - Rincian: " + req.items.map((it) => `${it.description} (${formatIDR(it.amount)})`).join(", ");
                      }

                      return (
                        <tr key={req.id} className="hover:bg-slate-50 text-slate-800 text-[10.5px]">
                          {/* Row Number Column */}
                          <td className="bg-slate-100 text-center text-slate-400 font-mono border-r border-slate-300 p-1.5 select-none">{rowNum}</td>
                          <td className="border-r border-slate-200 p-1.5 text-center text-gray-500 font-sans">{idx + 1}</td>
                          <td className="border-r border-slate-200 p-1.5 font-sans whitespace-nowrap">{req.date}</td>
                          <td className="border-r border-slate-200 p-1.5 font-bold text-slate-700 whitespace-nowrap">{req.petyCashNo || "-"}</td>
                          <td className="border-r border-slate-200 p-1.5 font-sans whitespace-nowrap">{req.pic}</td>
                          <td className="border-r border-slate-200 p-1.5 font-sans text-xs truncate max-w-[150px]" title={proj ? proj.name : "N/A"}>
                            {proj ? `[${proj.code}] ${proj.name}` : "-"}
                          </td>
                          <td className="border-r border-slate-200 p-1.5 font-sans text-slate-600 max-w-sm truncate" title={itemDetails}>
                            {itemDetails}
                          </td>
                          <td className="border-r border-slate-200 p-1.5 text-center font-sans uppercase text-[10px]">{req.paymentMethod || "Tunai"}</td>
                          <td className="border-r border-slate-200 p-1.5 text-center">
                            <span className={`px-1.5 py-0.25 rounded font-sans text-[9px] font-bold ${
                              req.status === "Sudah Realisasi"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "Disetujui"
                                ? "bg-blue-100 text-blue-800"
                                : req.status === "Ditolak"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-1.5 text-right font-bold text-slate-900">{formatIDR(req.amount)}</td>
                        </tr>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td className="bg-slate-100 text-center text-slate-400 font-mono border-r border-slate-300 p-1.5 select-none">
                        {filteredRequests.length + 4}
                      </td>
                      <td colSpan={8} className="p-2 text-right font-sans text-slate-600 border-r border-slate-200 text-xs font-black">
                        TOTAL REKAPITULASI (NET SUM):
                      </td>
                      <td className="p-2 text-right text-emerald-700 text-xs font-black">
                        {formatIDR(totalRequestedSum)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 flex gap-3 justify-end border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExcelPreview(false)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
                  html += `<head><meta charset="utf-8" /><style>`;
                  html += `table { border-collapse: collapse; width: 100%; font-family: sans-serif; }`;
                  html += `th { background-color: #047857; color: white; font-weight: bold; padding: 10px; border: 1px solid #10b981; text-align: left; font-size: 11px; }`;
                  html += `td { padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-size: 11px; }`;
                  html += `.text-right { text-align: right; }`;
                  html += `.text-center { text-align: center; }`;
                  html += `.font-mono { font-family: monospace; }`;
                  html += `.font-bold { font-weight: bold; }`;
                  html += `.title { font-size: 16px; font-weight: bold; color: #064e3b; text-align: center; padding: 10px 0; }`;
                  html += `</style></head><body>`;
                  
                  html += `<table>`;
                  html += `<tr><td colspan="9" class="title">REKAPITULASI PENGAJUAN PETTY CASH LAPANGAN</td></tr>`;
                  html += `<tr><td colspan="9" class="text-center" style="font-size: 10px; color: #64748b;">Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}</td></tr>`;
                  html += `<tr><td colspan="9"></td></tr>`;
                  
                  // Headers
                  html += `<tr>`;
                  html += `<th>No</th>`;
                  html += `<th>Tanggal</th>`;
                  html += `<th>No Pengajuan</th>`;
                  html += `<th>PIC Pemohon</th>`;
                  html += `<th>Proyek Terkait</th>`;
                  html += `<th>Deskripsi & Keperluan Belanja</th>`;
                  html += `<th>Metode Pembayaran</th>`;
                  html += `<th>Status Persetujuan</th>`;
                  html += `<th class="text-right">Nominal Pengajuan (Rp)</th>`;
                  html += `</tr>`;
                  
                  filteredRequests.forEach((req, idx) => {
                    const proj = projects.find((p) => p.id === req.projectId);
                    const projStr = proj ? `[${proj.code}] ${proj.name}` : "N/A";
                    
                    let itemDetails = req.description;
                    if (req.items && req.items.length > 0) {
                      itemDetails += " - Rincian: " + req.items.map((it) => `${it.description} (${formatIDR(it.amount)})`).join(", ");
                    }

                    html += `<tr>`;
                    html += `<td class="text-center">${idx + 1}</td>`;
                    html += `<td>${req.date}</td>`;
                    html += `<td class="font-mono">${req.petyCashNo || "-"}</td>`;
                    html += `<td>${req.pic}</td>`;
                    html += `<td>${projStr}</td>`;
                    html += `<td>${itemDetails}</td>`;
                    html += `<td class="text-center">${req.paymentMethod || "Tunai"}</td>`;
                    html += `<td class="text-center font-bold">${req.status}</td>`;
                    html += `<td class="text-right font-mono font-bold">${req.amount}</td>`;
                    html += `</tr>`;
                  });
                  
                  html += `<tr>`;
                  html += `<td colspan="8" class="text-right font-bold" style="background-color: #f0fdf4;">GRAND TOTAL:</td>`;
                  html += `<td class="text-right font-mono font-bold" style="background-color: #f0fdf4; color: #15803d;">${totalRequestedSum}</td>`;
                  html += `</tr>`;
                  
                  html += `</table></body></html>`;

                  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Rekap_Pengajuan_Petty_Cash_${new Date().toISOString().split("T")[0]}.xls`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/15"
              >
                <FileSpreadsheet className="w-4 h-4" /> Unduh Dokumen Excel Resmi (.xls)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {pdfViewRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">Pratinjau Dokumen PDF</h3>
                  <p className="text-[10px] text-slate-400">Tampilan formulir resmi siap cetak</p>
                </div>
              </div>
              <button
                onClick={() => setPdfViewRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Sheet Container */}
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-200 flex justify-center">
              <div id="pdf-document-sheet" className="bg-white shadow-xl w-full p-8 border border-gray-300 text-slate-800 text-[11px] text-left font-sans select-none relative rounded-sm max-w-lg">
                
                {/* WATERMARK STAMP */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-dashed border-blue-500/15 rounded-xl px-6 py-3 font-mono font-extrabold text-3xl text-blue-500/15 tracking-widest pointer-events-none select-none uppercase">
                  {pdfViewRequest.status}
                </div>

                {/* Company & Document Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                  <div>
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      {pdfViewRequest.company || "CV. Mandiri Cipta Jaya"}
                    </h1>
                    <p className="text-[9px] text-gray-500 leading-tight">
                      Kontraktor & Penyuplai Mekanikal Elektrikal Sipil
                    </p>
                    <p className="text-[8px] text-gray-400 mt-0.5">
                      Ruko Taman Yasmin Sektor VI, Jl. KH. R. Abdullah Bin Nuh No. 24, Bogor
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xs font-bold text-blue-900 tracking-wider uppercase">
                      FORM PENGAJUAN PETTY CASH
                    </h2>
                    <p className="text-[9px] text-gray-500">Permohonan Kas-Bon Lapangan</p>
                    <div className="mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded font-mono text-[9px] font-bold text-slate-700">
                      Ref: {pdfViewRequest.petyCashNo || "-"}
                    </div>
                  </div>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">No. Dokumen:</span>
                    <span className="font-bold text-slate-900 font-mono">{pdfViewRequest.petyCashNo || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">Tanggal:</span>
                    <span className="font-bold text-slate-900">{pdfViewRequest.date}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">PIC Pemohon:</span>
                    <span className="font-bold text-slate-900">{pdfViewRequest.pic}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">Metode Bayar:</span>
                    <span className="font-bold text-slate-900 uppercase">{pdfViewRequest.paymentMethod || "Tunai"}</span>
                  </div>
                  <div className="col-span-2 flex items-start justify-between">
                    <span className="text-gray-500 font-semibold shrink-0 mr-4">Proyek Terkait:</span>
                    <span className="font-bold text-slate-900 text-right truncate">
                      {(() => {
                        const prj = projects.find((p) => p.id === pdfViewRequest.projectId);
                        return prj ? `[${prj.code}] ${prj.name}` : "Proyek Dihapus";
                      })()}
                    </span>
                  </div>
                </div>

                {/* Description Heading */}
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300 pb-0.5 block">
                    Keterangan Pokok / Deskripsi Umum
                  </span>
                  <p className="text-[10px] text-slate-900 italic mt-1 bg-yellow-50/50 p-2 border border-yellow-100 rounded leading-relaxed">
                    "{pdfViewRequest.description}"
                  </p>
                </div>

                {/* Items List Table */}
                <div className="mb-6 border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                        <th className="p-2 w-8 text-center border-r border-slate-800">No</th>
                        <th className="p-2 border-r border-slate-800">Rincian Barang / Jasa Keperluan Lapangan</th>
                        <th className="p-2 w-28 text-center border-r border-slate-800">Kategori Anggaran</th>
                        <th className="p-2 w-28 text-right">Nominal Anggaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pdfViewRequest.items && pdfViewRequest.items.length > 0 ? (
                        pdfViewRequest.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-gray-400 font-mono border-r border-slate-100">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-800 border-r border-slate-100">{item.description}</td>
                            <td className="p-2 text-center border-r border-slate-100">
                              <span className="text-[8px] font-bold px-1.5 py-0.25 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatIDR(item.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2 text-center text-gray-400 font-mono border-r border-slate-100">1</td>
                          <td className="p-2 font-medium text-slate-800 border-r border-slate-100">{pdfViewRequest.description}</td>
                          <td className="p-2 text-center border-r border-slate-100">
                            <span className="text-[8px] font-bold px-1.5 py-0.25 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                              {pdfViewRequest.category}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatIDR(pdfViewRequest.amount)}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-extrabold border-t border-slate-300">
                        <td colSpan={3} className="p-2 text-right text-slate-700 text-[9px] uppercase tracking-wider">
                          TOTAL PENGAJUAN (NETTO):
                        </td>
                        <td className="p-2 text-right font-mono text-blue-700 text-xs border-l border-slate-200">
                          {formatIDR(pdfViewRequest.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Grid section */}
                <div className="grid grid-cols-4 gap-2 text-[9px] border border-slate-200 rounded p-2 bg-slate-50">
                  <div className="text-center flex flex-col justify-between h-20">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Diajukan Oleh</span>
                    <span className="font-extrabold text-slate-800 truncate px-1">{pdfViewRequest.pic}</span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">PIC Lapangan</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Diperiksa Oleh</span>
                    <span className="text-gray-300 italic text-[10px] font-medium">[Paraf]</span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Site Supervisor</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Disetujui Oleh</span>
                    {pdfViewRequest.status === "Disetujui" || pdfViewRequest.status === "Sudah Realisasi" ? (
                      <span className="text-blue-600 font-mono font-bold text-[9px] border border-blue-200 rounded px-1 py-0.5 mx-1 bg-blue-50/50 self-center leading-tight">
                        APPROVED<br />{pdfViewRequest.date}
                      </span>
                    ) : (
                      <span className="text-gray-300 italic text-[10px] font-medium">[Belum Disetujui]</span>
                    )}
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Project Manager</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Dibayarkan Oleh</span>
                    {pdfViewRequest.status === "Sudah Realisasi" ? (
                      <span className="text-emerald-600 font-mono font-bold text-[9px] border border-emerald-200 rounded px-1 py-0.5 mx-1 bg-emerald-50/50 self-center leading-tight">
                        PAID & TRF<br />{pdfViewRequest.date}
                      </span>
                    ) : (
                      <span className="text-gray-300 italic text-[10px] font-medium">[Belum Realisasi]</span>
                    )}
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Finance & Kasir</span>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[7px] text-gray-400">
                  <span>Dokumen ini diterbitkan secara sah dan terekam dalam Sistem Keuangan Terpadu.</span>
                  <span className="font-mono">ID: {pdfViewRequest.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 p-4 flex gap-3 justify-end border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPdfViewRequest(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const prj = projects.find((p) => p.id === pdfViewRequest.projectId);
                  printVoucher(pdfViewRequest, prj);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/15"
              >
                <Printer className="w-4 h-4" /> Cetak Dokumen PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUKTI TRANSFER MODAL */}
      {transferProofTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Bukti Transfer Kas Petty Cash</h3>
                  <p className="text-[10px] text-slate-400">Verifikasi pengiriman dana untuk pengajuan {transferProofTx.petyCashNo}</p>
                </div>
              </div>
              <button
                onClick={() => setTransferProofTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] bg-slate-50">
              
              {/* CURRENT PROOF PREVIEW & RECEIPT */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Tampilan Bukti Transfer Dana
                </label>

                {transferProofTx.transferProof ? (
                  (() => {
                    const isPdf =
                      transferProofTx.transferProof.startsWith("data:application/pdf") ||
                      transferProofTx.transferProof.includes("pdf") ||
                      transferProofTx.transferProof.startsWith("data:content/pdf");

                    if (isPdf) {
                      return (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-3">
                          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
                            <FileText className="w-8 h-8 text-red-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                Bukti_Transfer_{transferProofTx.petyCashNo}.pdf
                              </p>
                              <p className="text-[10px] text-gray-500">Dokumen PDF Terlampir</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPdfPreview({
                                  name: `Bukti_Transfer_${transferProofTx.petyCashNo}.pdf`,
                                  data: transferProofTx.transferProof!,
                                })
                              }
                              className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Buka PDF
                            </button>
                          </div>

                          {/* Embedded iframe/object preview */}
                          <div className="w-full h-64 border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                            <object
                              data={getPdfBlobUrl(transferProofTx.transferProof)}
                              type="application/pdf"
                              className="w-full h-full"
                            >
                              <iframe
                                src={getPdfBlobUrl(transferProofTx.transferProof)}
                                className="w-full h-full border-0"
                                title="Bukti Transfer PDF"
                              />
                            </object>
                          </div>

                          <div className="flex justify-between items-center w-full pt-1">
                            <span className="text-[10px] text-gray-400">Dokumen PDF terunggah</span>
                            <button
                              onClick={() => {
                                setTransactions((prev) =>
                                  prev.map((t) => (t.id === transferProofTx.id ? { ...t, transferProof: undefined } : t))
                                );
                                setTransferProofTx((prev) => (prev ? { ...prev, transferProof: undefined } : null));
                                setAlertMessage("Bukti transfer manual dihapus. Kembali ke resi elektronik.");
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 border border-red-100 hover:bg-red-50 px-2 py-0.5 rounded transition-all cursor-pointer"
                            >
                              Hapus Bukti & Gunakan E-Receipt
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      /* Custom uploaded transfer proof image */
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-3">
                        <div className="relative border border-slate-100 rounded-lg overflow-hidden max-h-72 flex items-center justify-center bg-slate-100 w-full">
                          <img
                            src={transferProofTx.transferProof}
                            alt="Bukti Transfer Lapangan"
                            className="object-contain max-h-72 w-auto shadow-inner"
                          />
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] text-gray-400">Bukti manual terunggah</span>
                          <button
                            onClick={() => {
                              setTransactions((prev) =>
                                prev.map((t) => (t.id === transferProofTx.id ? { ...t, transferProof: undefined } : t))
                              );
                              setTransferProofTx((prev) => (prev ? { ...prev, transferProof: undefined } : null));
                              setAlertMessage("Bukti transfer manual dihapus. Kembali ke resi elektronik.");
                            }}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 border border-red-100 hover:bg-red-50 px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            Hapus Bukti & Gunakan E-Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* High Fidelity Electronic Bank Receipt */
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-lg border border-emerald-500 overflow-hidden relative">
                    {/* Bank Watermark Stamp */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-dashed border-white/10 rounded-full w-40 h-40 flex flex-col items-center justify-center font-mono font-extrabold text-white/10 tracking-widest pointer-events-none select-none">
                      <span className="text-xs">MANDIRI</span>
                      <span className="text-xl">LUNAS</span>
                      <span className="text-[9px]">APPROVED</span>
                    </div>

                    <div className="p-5 text-center border-b border-white/10 relative z-10">
                      <div className="mx-auto w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/25 text-white px-2.5 py-0.5 rounded-full">
                        TRANSAKSI BERHASIL (SUCCESS)
                      </span>
                      <h4 className="text-xl font-black font-mono mt-2 tracking-wide text-white">
                        {formatIDR(transferProofTx.amount)}
                      </h4>
                      <p className="text-[9px] text-teal-100 mt-1">E-Receipt Transfer Kas Negara & Petty Cash</p>
                    </div>

                    <div className="p-5 bg-white text-slate-800 text-[10.5px] space-y-2.5 font-sans relative z-10">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Jenis Pengiriman:</span>
                        <span className="font-bold text-slate-700">BI-FAST / Realtime Online</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Pengirim (Debitur):</span>
                        <span className="font-bold text-slate-700 text-right">
                          {transferProofTx.company || "CV. MANDIRI CIPTA JAYA"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Bank Asal:</span>
                        <span className="font-bold text-slate-700">BANK MANDIRI (PERSERO) TBK</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Penerima Dana (Kreditur):</span>
                        <span className="font-bold text-slate-900">{transferProofTx.pic}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Bank Penerima:</span>
                        <span className="font-bold text-slate-700">BCA (BANK CENTRAL ASIA)</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">No Rekening Tujuan:</span>
                        <span className="font-mono font-bold text-slate-700">8625****** (Rek. Lapangan PIC)</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Referensi Pengajuan:</span>
                        <span className="font-mono font-bold text-blue-700">{transferProofTx.petyCashNo}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-semibold">Tanggal & Waktu:</span>
                        <span className="font-bold text-slate-700">{transferProofTx.date} - 10:45:12 WIB</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-gray-400 font-semibold">No. Referensi Bank:</span>
                        <span className="font-mono font-bold text-slate-500">TRF-{transferProofTx.id.toUpperCase().replace("TX-", "")}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 text-center text-[8.5px] text-slate-400 border-t border-gray-100 font-mono relative z-10">
                      * Resi ini sah secara hukum perbankan dan dicetak elektronik otomatis oleh sistem keuangan perusahaan *
                    </div>
                  </div>
                )}
              </div>

              {/* DRAG & DROP FILE UPLOAD AREA */}
              {!isReadOnly && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Unggah Bukti Transfer Baru (Gambar / PDF)
                  </label>
                  
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById("proof-file-input");
                      if (fileInput) fileInput.click();
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      dragActive
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-blue-400 bg-white text-gray-500"
                    }`}
                  >
                    <input
                      id="proof-file-input"
                      type="file"
                      accept="image/*,application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <Upload className="w-8 h-8 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">
                        Klik untuk memilih gambar / PDF atau seret file ke sini
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Mendukung file gambar (PNG, JPG, JPEG) dan dokumen PDF (Maks. 15MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTransferProofTx(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm w-full sm:w-auto text-center"
              >
                Selesai & Tutup
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

      {/* PDF DOCUMENT PREVIEW MODAL */}
      <PdfViewerModal pdfData={selectedPdfPreview} onClose={() => setSelectedPdfPreview(null)} />
    </div>
  );
}

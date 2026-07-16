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
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
      const nextNum = existingRequests.length + 1;
      setRequestNo(`REQ-PC-${String(nextNum).padStart(3, "0")}`);
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
    const nextPetyCashNo = petyCashTxs.length + 1;
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

  // Budget alert warning
  const getBudgetImpact = () => {
    if (totalAmount <= 0 || !projectId) return null;
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return null;

    const contractBase =
      proj.contractValue.piping +
      proj.contractValue.electrical +
      proj.contractValue.mechanical +
      proj.contractValue.scafolder;

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
  });

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
            editingRequestId ? "border-amber-500/30 shadow-amber-500/5 animate-pulse-once" : "border-blue-500/20"
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
                  placeholder="Contoh: REQ-PC-001..."
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
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500">
            Menampilkan <strong className="text-gray-900">{filteredRequests.length}</strong> pengajuan dari total{" "}
            <strong>{requestList.length}</strong>
          </span>
          <span className="text-slate-500 font-semibold">
            Total Saringan Nominal: <strong className="text-blue-600 font-mono text-sm">{formatIDR(totalRequestedSum)}</strong>
          </span>
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

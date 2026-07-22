/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, Category, PetyCashItem } from "../types";
import { CATEGORIES } from "../data";
import { Plus, ListFilter, Search, Receipt, Trash2, HelpCircle, AlertTriangle, ShieldCheck, Landmark, CheckSquare, Calendar, ChevronDown, ChevronUp, Printer, User, Send, CheckCircle2, Edit2, FileText, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { printVoucher } from "./PetyCashRequestManager";

interface PetyCashExpenseManagerProps {
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

export default function PetyCashExpenseManager({
  projects,
  transactions,
  setTransactions,
  selectedProjectId,
  onAddActivity,
  isReadOnly = false,
  categories = [],
  setCategories,
}: PetyCashExpenseManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingExpenseId, setEditingExpenseId] = React.useState<string | null>(null);

  // Form Fields
  const [projectId, setProjectId] = React.useState(selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : (projects[0]?.id || ""));

  React.useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      setProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const [pic, setPic] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [petyCashNo, setPetyCashNo] = React.useState("");
  const [status, setStatus] = React.useState("Sudah Proses");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<Category>("Consumable");
  const [paymentMethod, setPaymentMethod] = React.useState("Tunai");
  const [selectedRequestIdForExpense, setSelectedRequestIdForExpense] = React.useState<string>("");

  // Items Builder State
  const [currentItems, setCurrentItems] = React.useState<PetyCashItem[]>([]);
  const [itemDesc, setItemDesc] = React.useState("");
  const [itemCat, setItemCat] = React.useState<Category>("Consumable");
  const [itemAmt, setItemAmt] = React.useState<number>(0);
  const [customCatName, setCustomCatName] = React.useState("");

  const amount = currentItems.reduce((sum, item) => sum + item.amount, 0);

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

  // Custom Modal Confirmation for Delete & Alert States
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [pdfViewExpense, setPdfViewExpense] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const getRequestSpent = (reqId: string) => {
    return transactions
      .filter((t) => t.type === "PetyCash" && t.requestId === reqId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRequestRemaining = (req: Transaction) => {
    const spent = getRequestSpent(req.id);
    return Math.max(0, req.amount - spent);
  };

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

  const [isManualNo, setIsManualNo] = React.useState(false);

  // AUTO-SAVE & AUTO-LOAD DRAFT FOR PETY CASH EXPENSE FORM
  React.useEffect(() => {
    const savedDraft = localStorage.getItem("pety_cash_expense_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft) {
          if (draft.projectId) setProjectId(draft.projectId);
          if (draft.pic) setPic(draft.pic);
          if (draft.date) setDate(draft.date);
          if (draft.petyCashNo) setPetyCashNo(draft.petyCashNo);
          if (draft.status) setStatus(draft.status);
          if (draft.description) setDescription(draft.description);
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
          if (draft.selectedRequestIdForExpense !== undefined) setSelectedRequestIdForExpense(draft.selectedRequestIdForExpense);
          if (draft.company) setCompany(draft.company);
          if (draft.customCompany) setCustomCompany(draft.customCompany);
          if (draft.currentItems) setCurrentItems(draft.currentItems);
          if (draft.showAddForm !== undefined) setShowAddForm(draft.showAddForm);
        }
      } catch (err) {
        console.error("Error loading pety cash expense draft", err);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!editingExpenseId) {
      const draft = {
        projectId,
        pic,
        date,
        petyCashNo,
        status,
        description,
        paymentMethod,
        selectedRequestIdForExpense,
        company,
        customCompany,
        currentItems,
        showAddForm
      };
      localStorage.setItem("pety_cash_expense_draft", JSON.stringify(draft));
    }
  }, [
    projectId,
    pic,
    date,
    petyCashNo,
    status,
    description,
    paymentMethod,
    selectedRequestIdForExpense,
    company,
    customCompany,
    currentItems,
    showAddForm,
    editingExpenseId
  ]);

  // Filter States
  const [filterProject, setFilterProject] = React.useState<string>("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Expand states for expenses in table
  const [expandedExpenses, setExpandedExpenses] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedExpenses((prev) => ({
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

  // Generate automatic petty cash number code
  React.useEffect(() => {
    if (!isManualNo && !editingExpenseId) {
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
      const nextNum = maxNum + 1;
      setPetyCashNo(`PC-${String(nextNum).padStart(3, "0")}`);
    }
  }, [transactions, isManualNo, editingExpenseId]);

  const handleEditExpense = (tx: Transaction) => {
    setEditingExpenseId(tx.id);
    setProjectId(tx.projectId);
    setPic(tx.pic);
    setDate(tx.date || "");
    setPetyCashNo(tx.petyCashNo || "");
    setIsManualNo(true); // Keep current voucher number manually
    setStatus(tx.status || "Sudah Proses");
    setDescription(tx.description || "");
    setPaymentMethod(tx.paymentMethod || "Tunai");
    setCurrentItems(tx.items ? tx.items.map(item => ({ ...item })) : []);
    if (tx.company) {
      if (tx.company === "CV. Mandiri Cipta Jaya" || tx.company === "PT. Elqia Jaya Teknik") {
        setCompany(tx.company);
      } else {
        setCompany("Lainnya");
        setCustomCompany(tx.company);
      }
    }
    setSelectedRequestIdForExpense(tx.requestId || "");
    setShowAddForm(true);
    // Scroll to form smoothly
    setTimeout(() => {
      const el = document.getElementById("pety-cash-expense-form-card");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setPic("");
    setDescription("");
    setCurrentItems([]);
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setIsManualNo(false);
    setSelectedRequestIdForExpense("");
    setShowAddForm(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !pic) {
      setValidationError("Harap lengkapi isian wajib (Proyek, PIC)!");
      return;
    }

    if (currentItems.length === 0) {
      setValidationError("Harap tambahkan minimal 1 item belanja ke dalam daftar pengeluaran!");
      return;
    }

    setValidationError(null);

    const summaryDesc = currentItems.map((item) => `${item.description} (${formatIDR(item.amount)})`).join(", ");
    const finalCategory = currentItems[0]?.category || "Consumable";

    if (editingExpenseId) {
      setTransactions((prev) => {
        const updated = prev.map((t) => {
          if (t.id === editingExpenseId) {
            return {
              ...t,
              projectId,
              pic,
              date,
              petyCashNo,
              status,
              description: summaryDesc,
              category: finalCategory,
              paymentMethod,
              amount: Number(amount),
              items: currentItems,
              company: company === "Lainnya" ? customCompany : company,
              requestId: selectedRequestIdForExpense || undefined,
            };
          }
          return t;
        });

        // Recalculate request statuses
        return updated.map((t) => {
          if (t.type === "PetyCashRequest") {
            const spent = updated
              .filter((x) => x.type === "PetyCash" && x.requestId === t.id)
              .reduce((sum, x) => sum + x.amount, 0);
            let newStatus = t.status;
            if (spent >= t.amount) {
              newStatus = "Sudah Realisasi";
            } else if (spent > 0) {
              newStatus = "Realisasi Sebagian";
            } else {
              if (t.status === "Sudah Realisasi" || t.status === "Realisasi Sebagian") {
                newStatus = "Disetujui";
              }
            }
            return { ...t, status: newStatus };
          }
          return t;
        });
      });

      if (onAddActivity) {
        const proj = projects.find((p) => p.id === projectId);
        const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(amount));
        onAddActivity(
          "petycash_expense",
          "Pengeluaran Petty Cash",
          `Memperbarui pengeluaran riil [${petyCashNo}] menjadi sebesar ${displayAmt} untuk proyek "${proj ? proj.name : "Proyek"}"`,
          pic,
          projectId
        );
      }

      setEditingExpenseId(null);
      setPic("");
      setDescription("");
      setCurrentItems([]);
      setCompany("CV. Mandiri Cipta Jaya");
      setCustomCompany("");
      setIsManualNo(false);
      setSelectedRequestIdForExpense("");
      setShowAddForm(false);
      setAlertMessage("Catatan pengeluaran petty cash berhasil diperbarui.");
      return;
    }

    const newExpense: Transaction = {
      id: `tx-${Date.now()}`,
      projectId,
      type: "PetyCash",
      pic,
      date,
      petyCashNo,
      status, // "Sudah Proses" or "Belum Proses" or "Belum Laporan" etc
      description: summaryDesc,
      category: finalCategory,
      paymentMethod,
      amount: Number(amount),
      items: currentItems,
      company: company === "Lainnya" ? customCompany : company,
      requestId: selectedRequestIdForExpense || undefined,
    };

    setTransactions((prev) => {
      let updated = [...prev];
      if (selectedRequestIdForExpense) {
        updated = updated.map((t) => {
          if (t.id === selectedRequestIdForExpense) {
            // Calculate how much has been spent on this request so far in other expenses
            const otherSpent = prev
              .filter((x) => x.type === "PetyCash" && x.requestId === t.id)
              .reduce((sum, x) => sum + x.amount, 0);
            const totalSpent = otherSpent + Number(amount);
            const newStatus = totalSpent >= t.amount ? "Sudah Realisasi" : "Realisasi Sebagian";
            return {
              ...t,
              status: newStatus,
            };
          }
          return t;
         });
      }
      return [newExpense, ...updated];
    });

    if (onAddActivity) {
      const proj = projects.find((p) => p.id === projectId);
      const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(amount));
      onAddActivity(
        "petycash_expense",
        "Pengeluaran Petty Cash",
        `Mencatat pengeluaran riil [${petyCashNo}] sebesar ${displayAmt} untuk proyek "${proj ? proj.name : "Proyek"}"`,
        pic,
        projectId
      );
    }

    // Reset Form
    setPic("");
    setDescription("");
    setCurrentItems([]);
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setIsManualNo(false);
    setSelectedRequestIdForExpense("");
    setShowAddForm(false);
    setAlertMessage("Catatan pengeluaran petty cash berhasil disimpan.");
  };

  const triggerDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
  };

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    const id = expenseToDelete;
    setTransactions((prev) => {
      const expenseToDeleteObj = prev.find((t) => t.id === id);
      const reqId = expenseToDeleteObj?.requestId;
      const filtered = prev.filter((t) => t.id !== id);

      if (reqId) {
        const spent = filtered
          .filter((t) => t.type === "PetyCash" && t.requestId === reqId)
          .reduce((sum, t) => sum + t.amount, 0);

        const request = filtered.find((t) => t.id === reqId);
        if (request) {
          let newStatus = "Disetujui";
          if (spent >= request.amount) {
            newStatus = "Sudah Realisasi";
          } else if (spent > 0) {
            newStatus = "Realisasi Sebagian";
          }
          return filtered.map((t) => (t.id === reqId ? { ...t, status: newStatus } : t));
        }
      }
      return filtered;
    });
    setExpenseToDelete(null);
    setAlertMessage("Catatan pengeluaran petty cash berhasil dihapus.");
  };

  // Budget impact simulator
  const getBudgetImpact = () => {
    if (amount <= 0 || !projectId) return null;
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

    const newRatio = ((existingSpending + amount) / contractBase) * 100;
    const threshold = proj.budgetThresholdPercent || 85;

    return {
      newRatio,
      isOverThreshold: newRatio >= threshold,
      isOverContract: newRatio >= 100,
      projectName: proj.name,
    };
  };

  const budgetImpact = getBudgetImpact();

  // Filter list
  const expenseList = transactions.filter((t) => t.type === "PetyCash");

  const getPetyCashNumber = (petyCashNo: string | undefined): number => {
    if (!petyCashNo) return 999999;
    const match = petyCashNo.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
  };

  const filteredExpenses = expenseList.filter((tx) => {
    if (filterProject !== "all" && tx.projectId !== filterProject) return false;
    if (filterCategory !== "all" && tx.category !== filterCategory) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const picMatch = tx.pic?.toLowerCase().includes(q);
      const descMatch = tx.description?.toLowerCase().includes(q);
      const noMatch = tx.petyCashNo?.toLowerCase().includes(q);
      return picMatch || descMatch || noMatch;
    }

    return true;
  }).sort((a, b) => getPetyCashNumber(a.petyCashNo) - getPetyCashNumber(b.petyCashNo));

  const totalExpenseSum = filteredExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6 font-sans pb-12" id="pety-cash-expense-section">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5.5 h-5.5 text-blue-600" />
            Pengeluaran Petty Cash (Realisasi Belanja) {isReadOnly && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">ReadOnly</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Buku kas realisasi pengeluaran petty cash aktual yang dibelanjakan di lapangan.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Catat Pengeluaran Baru
          </button>
        )}
      </div>

      {/* EXPENSE FORM CONTAINER */}
      {showAddForm && (
        <motion.div
          id="pety-cash-expense-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-blue-500/20 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-blue-50/50 p-4 border-b border-blue-500/10 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900 font-sans">
              {editingExpenseId ? "Form Edit Transaksi Pengeluaran Petty Cash" : "Form Transaksi Pengeluaran Petty Cash"}
            </h3>
          </div>

          <form onSubmit={handleCreateExpense} className="p-6 space-y-6">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            )}
            {/* LINKED REQUEST SELECTOR (OPTIONAL) */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1">
                <Send className="w-4 h-4 text-blue-600" />
                Hubungkan dengan Pengajuan Petty Cash (Otomatis Pre-Fill)
              </label>
              <select
                value={selectedRequestIdForExpense}
                onChange={(e) => {
                  const reqId = e.target.value;
                  setSelectedRequestIdForExpense(reqId);
                  if (reqId === "") {
                    setPic("");
                    setDescription("");
                    setCurrentItems([]);
                  } else {
                    const req = transactions.find((t) => t.id === reqId);
                    if (req) {
                      setProjectId(req.projectId);
                      setPic(req.pic);
                      setDescription(`[Realisasi ${req.petyCashNo}] ${req.description}`);
                      setCategory(req.category || "Consumable");
                      if (req.items && req.items.length > 0) {
                        setCurrentItems(req.items.map(item => ({ ...item })));
                      } else {
                        setCurrentItems([{
                          id: `item-${Date.now()}`,
                          description: req.description,
                          category: req.category || "Consumable",
                          amount: getRequestRemaining(req),
                        }]);
                      }
                      if (req.company) {
                        if (req.company === "CV. Mandiri Cipta Jaya" || req.company === "PT. Elqia Jaya Teknik") {
                          setCompany(req.company);
                        } else {
                          setCompany("Lainnya");
                          setCustomCompany(req.company);
                        }
                      }
                    }
                  }
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">-- Berdiri Sendiri / Tanpa Hubungan Pengajuan --</option>
                {transactions
                  .filter((t) => t.type === "PetyCashRequest" && (t.status === "Disetujui" || t.status === "Realisasi Sebagian"))
                  .map((req) => {
                    const rem = getRequestRemaining(req);
                    const proj = projects.find((p) => p.id === req.projectId);
                    return (
                      <option key={req.id} value={req.id}>
                        {req.petyCashNo} - {req.pic} ({proj?.code}) - Sisa Pengajuan: {formatIDR(rem)} (Total: {formatIDR(req.amount)})
                      </option>
                    );
                  })}
              </select>
              
              {selectedRequestIdForExpense && (
                <div className="text-[10px] bg-blue-100/50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg font-medium space-y-0.5">
                  <div>✓ Terhubung dengan pengajuan <span className="font-bold">{transactions.find(t => t.id === selectedRequestIdForExpense)?.petyCashNo}</span></div>
                  <div>Sisa Plafon Pengajuan: <span className="font-extrabold text-blue-700">{formatIDR(getRequestRemaining(transactions.find(t => t.id === selectedRequestIdForExpense)!))}</span></div>
                  <div className="text-[9px] text-blue-600 italic mt-1">Mengubah nilai Nominal Belanja Aktual akan secara dinamis memotong sisa pengajuan di atas setelah disimpan.</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Project Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Kontrak Kerja / Proyek <span className="text-red-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Perusahaan */}
              <div className="space-y-1.5">
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

              {/* Petty Cash Number Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nomor Voucher Petty Cash</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PC-018, PC-019..."
                  value={petyCashNo}
                  onChange={(e) => {
                    setPetyCashNo(e.target.value);
                    setIsManualNo(true);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono font-bold text-gray-800"
                />
              </div>

              {/* PIC Penanggung Jawab */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  PIC Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: P Ujang, P Wawan, Office"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tanggal Pengeluaran</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              {/* Metode Pembayaran */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white animate-fade-in"
                >
                  <option value="Tunai">Tunai / Pety Cash</option>
                  <option value="Transfer">Transfer Bank</option>
                </select>
              </div>

              {/* Status Laporan / Proses */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Status Laporan / Proses</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white animate-fade-in"
                >
                  <option value="Sudah Proses">Sudah Proses</option>
                  <option value="Belum Proses">Belum Proses</option>
                  <option value="Belum Laporan">Belum Laporan</option>
                  <option value="Sudah Laporan">Sudah Laporan</option>
                </select>
              </div>
            </div>

            {/* SECTION 2: MULTI-ITEM BUILDER TABLE */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  📋 Rincian Belanja Aktual (Multi-Item Table)
                </h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                  Input Manual &amp; List
                </span>
              </div>

              {/* Item inputs row */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end bg-white p-3.5 rounded-xl border border-gray-200">
                {/* Item description */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-500">Deskripsi Barang / Keperluan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bensin Mobil, Paku, Semen..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                {/* Item Category */}
                <div className="space-y-1 md:col-span-1">
                  <label className="text-[10px] font-bold text-gray-500">Kategori</label>
                  <select
                    value={itemCat}
                    onChange={(e) => setItemCat(e.target.value as Category)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="ADD_NEW_CATEGORY" className="font-bold text-blue-600 bg-blue-50">+ Tambah...</option>
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
                    Kategori baru ini akan otomatis tersimpan ke daftar master dan langsung bisa digunakan kembali di pengeluaran selanjutnya.
                  </p>
                </div>
              )}

              {/* List of currently added items */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-gray-600 font-semibold border-b border-gray-200">
                      <th className="p-2 w-10 text-center">No</th>
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
                          Belum ada item pengeluaran yang ditambahkan. Gunakan kolom di atas untuk membuat list.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-2 text-center text-gray-400 font-mono">{index + 1}</td>
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
                          Total Pengeluaran Aktual:
                        </td>
                        <td className="p-2.5 text-right font-mono text-blue-600 text-sm">{formatIDR(amount)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Budget Impact Alerts */}
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
                <div>
                  <p className="font-bold">
                    {budgetImpact.isOverContract
                      ? "ALARM KRITIS: Melampaui Anggaran Kontrak!"
                      : budgetImpact.isOverThreshold
                      ? "Peringatan: Mendekati Batas Alarm!"
                      : "Dampak Finansial Proyek"}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    Pengeluaran ini akan membawa total biaya pengeluaran kumulatif proyek menjadi <span className="font-bold">{budgetImpact.newRatio.toFixed(1)}%</span> dari kontrak kerja.
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (editingExpenseId) {
                    handleCancelEdit();
                  } else {
                    setShowAddForm(false);
                    setCurrentItems([]);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batalkan
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
                {editingExpenseId ? "Simpan Perubahan Pengeluaran" : `Simpan Pengeluaran Aktual (${currentItems.length} Item)`}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* PENDING PETTY CASH REQUESTS QUEUE */}
      {transactions.filter(
        (t) =>
          t.type === "PetyCashRequest" &&
          (t.status === "Disetujui" || t.status === "Realisasi Sebagian") &&
          getRequestRemaining(t) > 0
      ).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-blue-900 tracking-tight flex items-center gap-1.5">
                <Send className="w-4.5 h-4.5 text-blue-600" />
                Daftar Pengajuan Petty Cash Menunggu Realisasi Belanja ({transactions.filter(t => t.type === "PetyCashRequest" && (t.status === "Disetujui" || t.status === "Realisasi Sebagian") && getRequestRemaining(t) > 0).length})
              </h3>
              <p className="text-[10px] text-blue-700 mt-0.5 font-medium">
                Pengajuan petty cash yang disetujui otomatis masuk ke antrean pengeluaran. Klik tombol <strong className="text-blue-800">"Input Belanja Aktual"</strong> untuk realisasi.
              </p>
            </div>
            <span className="text-[10px] bg-blue-100 border border-blue-200 text-blue-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              Antrean Otomatis Aktif
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-blue-50/50 text-slate-600 border-b border-blue-100 font-bold">
                  <th className="p-2.5 font-semibold">No Pengajuan</th>
                  <th className="p-2.5 font-semibold">Tanggal</th>
                  <th className="p-2.5 font-semibold">Pemohon</th>
                  <th className="p-2.5 font-semibold">Proyek</th>
                  <th className="p-2.5 font-semibold">Deskripsi Kebutuhan</th>
                  <th className="p-2.5 text-right font-semibold">Plafon Pengajuan</th>
                  <th className="p-2.5 text-right font-semibold text-emerald-700">Realisasi Belanja</th>
                  <th className="p-2.5 text-right font-semibold text-blue-700">Sisa Pengajuan</th>
                  <th className="p-2.5 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions
                  .filter(
                    (t) =>
                      t.type === "PetyCashRequest" &&
                      (t.status === "Disetujui" || t.status === "Realisasi Sebagian") &&
                      getRequestRemaining(t) > 0
                  )
                  .map((req) => {
                    const proj = projects.find((p) => p.id === req.projectId);
                    const remaining = getRequestRemaining(req);
                    const spent = getRequestSpent(req.id);
                    return (
                      <tr key={req.id} className="hover:bg-blue-50/20 text-[11px]">
                        <td className="p-2.5 font-mono font-bold text-blue-900 whitespace-nowrap">
                          {req.petyCashNo}
                        </td>
                        <td className="p-2.5 text-gray-500 font-mono whitespace-nowrap">
                          {req.date}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                          {req.pic}
                        </td>
                        <td className="p-2.5 text-slate-700 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">[{proj?.code || "N/A"}]</span> {proj?.name ? (proj.name.length > 20 ? proj.name.substring(0, 20) + "..." : proj.name) : "Proyek Dihapus"}
                        </td>
                        <td className="p-2.5 text-gray-600 truncate max-w-xs" title={req.description}>
                          {req.description}
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                          {formatIDR(req.amount)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
                          {formatIDR(spent)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-600 whitespace-nowrap">
                          {formatIDR(remaining)}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequestIdForExpense(req.id);
                              setProjectId(req.projectId);
                              setPic(req.pic);
                              setDescription(`[Realisasi ${req.petyCashNo}] ${req.description}`);
                              setCategory(req.category || "Consumable");
                              if (req.items && req.items.length > 0) {
                                setCurrentItems(req.items.map(item => ({ ...item })));
                              } else {
                                setCurrentItems([{
                                  id: `item-${Date.now()}`,
                                  description: req.description,
                                  category: req.category || "Consumable",
                                  amount: remaining,
                                }]);
                              }
                              if (req.company) {
                                if (req.company === "CV. Mandiri Cipta Jaya" || req.company === "PT. Elqia Jaya Teknik") {
                                  setCompany(req.company);
                                } else {
                                  setCompany("Lainnya");
                                  setCustomCompany(req.company);
                                }
                              }
                              setShowAddForm(true);
                              // Scroll to form smoothly
                              setTimeout(() => {
                                const el = document.getElementById("pety-cash-expense-form-card");
                                el?.scrollIntoView({ behavior: "smooth" });
                              }, 150);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1 mx-auto"
                          >
                            <Plus className="w-3 h-3" /> Input Belanja Aktual
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <ListFilter className="w-4 h-4 text-blue-600" /> Saring &amp; Cari Pengeluaran
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

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Kategori Biaya</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Pencarian Deskripsi / No / PIC</label>
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
            Ditemukan <strong className="text-gray-900">{filteredExpenses.length}</strong> catatan pengeluaran dari total{" "}
            <strong>{expenseList.length}</strong>
          </span>
          <span className="text-slate-500 font-semibold">
            Total Saringan Pengeluaran: <strong className="text-red-600 font-mono text-sm">{formatIDR(totalExpenseSum)}</strong>
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
                <th className="p-3.5">No Petty Cash</th>
                <th className="p-3.5">Penerima</th>
                <th className="p-3.5">Proyek</th>
                <th className="p-3.5">Rincian Belanja</th>
                <th className="p-3.5">Kategori / Metode</th>
                <th className="p-3.5 text-right">Jumlah Belanja (RP)</th>
                <th className="p-3.5 text-center">Status Laporan</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                    Tidak ditemukan pengeluaran petty cash yang cocok.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((tx) => {
                  const proj = projects.find((p) => p.id === tx.projectId);
                  const isExpanded = !!expandedExpenses[tx.id];
                  const itemsCount = tx.items?.length || 0;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className={`hover:bg-slate-50/50 ${isExpanded ? "bg-blue-50/10" : ""}`}>
                        {/* Toggle button if items exist */}
                        <td className="p-3.5 text-center">
                          {itemsCount > 0 && (
                            <button
                              onClick={() => toggleExpand(tx.id)}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-all cursor-pointer"
                              title="Tampilkan Detail Item"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </td>

                        {/* Date */}
                        <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono">
                          {tx.date}
                        </td>

                        {/* PC Ref No */}
                        <td className="p-3.5 whitespace-nowrap font-mono space-y-1">
                          <div className="font-bold text-slate-700">{tx.petyCashNo || "-"}</div>
                          {tx.company && (
                            <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider font-sans">
                              🏢 {tx.company}
                            </div>
                          )}
                        </td>

                        {/* Penerima */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-500" />
                            {tx.pic}
                          </div>
                        </td>

                        {/* Proyek */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-700">[{proj?.code || "N/A"}]</div>
                          <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]" title={proj?.name}>
                            {proj ? proj.name : "Proyek Dihapus"}
                          </p>
                        </td>

                        {/* Description */}
                        <td className="p-3.5 max-w-xs">
                          <div className="space-y-1.5">
                            <p className="text-slate-900 font-medium leading-relaxed" style={{ wordBreak: "break-word" }}>
                              {tx.description}
                            </p>
                            {tx.requestId && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                  Ref Pengajuan: {transactions.find(t => t.id === tx.requestId)?.petyCashNo || "Dihapus"}
                                </span>
                              </div>
                            )}
                            {itemsCount > 0 && (
                              <button
                                onClick={() => toggleExpand(tx.id)}
                                className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase flex items-center gap-1 hover:bg-slate-200 transition-all cursor-pointer"
                              >
                                <span>{itemsCount} Item Terlampir</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Category & Method */}
                        <td className="p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                            {tx.category}
                          </span>
                          {tx.paymentMethod && (
                            <p className="text-[9px] text-gray-400 font-sans font-medium">Metode: {tx.paymentMethod}</p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="p-3.5 text-right font-bold text-red-600 font-mono text-sm">
                          {formatIDR(tx.amount)}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                              tx.status.includes("Sudah")
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : tx.status.includes("Belum")
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPdfViewExpense(tx)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-[10px] border border-blue-200"
                              title="Lihat & Cetak PDF Pengeluaran"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => printVoucher(tx, proj)}
                              className="text-slate-600 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Cetak Voucher Realisasi Langsung (Print)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => handleEditExpense(tx)}
                                  className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Pengeluaran"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => triggerDeleteExpense(tx.id)}
                                  className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Hapus Pengeluaran"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
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
                                className="bg-slate-50/80 px-12 py-3 border-l-4 border-emerald-600"
                              >
                                <div className="bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden">
                                  <div className="px-3.5 py-2.5 bg-slate-100 border-b border-gray-200 font-bold text-[10px] text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Rincian Barang yang Dibeli ({itemsCount} Item)</span>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => printVoucher(tx, proj)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-gray-300 font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                        title="Cetak Voucher Realisasi"
                                      >
                                        <Printer className="w-3 h-3 text-blue-600" /> Cetak Voucher
                                      </button>
                                      <span>Voucher: {tx.petyCashNo}</span>
                                    </div>
                                  </div>
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-semibold">
                                        <th className="p-2 w-10 text-center">No</th>
                                        <th className="p-2">Deskripsi Barang / Jasa</th>
                                        <th className="p-2">Kategori Anggaran</th>
                                        <th className="p-2 text-right">Harga Item</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {tx.items?.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                          <td className="p-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                          <td className="p-2 font-medium text-slate-800">{item.description}</td>
                                          <td className="p-2">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
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
                                          Total Pengeluaran Realisasi:
                                        </td>
                                        <td className="p-2.5 text-right font-mono text-red-600 text-sm">{formatIDR(tx.amount)}</td>
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

      {/* CONFIRM DELETE MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Hapus Pengeluaran Petty Cash?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan pengeluaran ini secara permanen? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteExpense}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {pdfViewExpense && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 font-sans">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">Pratinjau Voucher Pengeluaran PDF</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Tampilan fisik kuitansi pengeluaran kas kecil</p>
                </div>
              </div>
              <button
                onClick={() => setPdfViewExpense(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Sheet Container */}
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-200 flex justify-center">
              <div id="pdf-document-sheet" className="bg-white shadow-xl w-full p-8 border border-gray-300 text-slate-800 text-[11px] text-left font-sans select-none relative rounded-sm max-w-lg">
                
                {/* WATERMARK STAMP */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-dashed border-emerald-500/15 rounded-xl px-6 py-3 font-mono font-extrabold text-3xl text-emerald-500/15 tracking-widest pointer-events-none select-none uppercase">
                  {pdfViewExpense.status || "Sudah Proses"}
                </div>

                {/* Company & Document Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                  <div>
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      {pdfViewExpense.company || "CV. Mandiri Cipta Jaya"}
                    </h1>
                    <p className="text-[9px] text-gray-500 leading-tight">
                      Kontraktor & Penyuplai Mekanikal Elektrikal Sipil
                    </p>
                    <p className="text-[8px] text-gray-400 mt-0.5">
                      Ruko Taman Yasmin Sektor VI, Jl. KH. R. Abdullah Bin Nuh No. 24, Bogor
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xs font-bold text-red-900 tracking-wider uppercase">
                      VOUCHER PENGELUARAN PETTY CASH
                    </h2>
                    <p className="text-[9px] text-gray-500">Realisasi & Bukti Bayar Kas Kecil</p>
                    <div className="mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded font-mono text-[9px] font-bold text-slate-700">
                      Ref: {pdfViewExpense.petyCashNo || "-"}
                    </div>
                  </div>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">No. Voucher:</span>
                    <span className="font-bold text-slate-900 font-mono">{pdfViewExpense.petyCashNo || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">Tanggal:</span>
                    <span className="font-bold text-slate-900">{pdfViewExpense.date}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">PIC Lapangan:</span>
                    <span className="font-bold text-slate-900">{pdfViewExpense.pic}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-gray-500 font-semibold">Metode Bayar:</span>
                    <span className="font-bold text-slate-900 uppercase">{pdfViewExpense.paymentMethod || "Tunai"}</span>
                  </div>
                  <div className="col-span-2 flex items-start justify-between">
                    <span className="text-gray-500 font-semibold shrink-0 mr-4">Proyek Terkait:</span>
                    <span className="font-bold text-slate-900 text-right truncate">
                      {(() => {
                        const prj = projects.find((p) => p.id === pdfViewExpense.projectId);
                        return prj ? `[${prj.code}] ${prj.name}` : "Proyek Dihapus";
                      })()}
                    </span>
                  </div>
                </div>

                {/* Description Heading */}
                <div className="mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300 pb-0.5 block">
                    Keterangan Realisasi Belanja
                  </span>
                  <p className="text-[10px] text-slate-900 italic mt-1 bg-yellow-50/50 p-2 border border-yellow-100 rounded leading-relaxed">
                    "{pdfViewExpense.description}"
                  </p>
                </div>

                {/* Items List Table */}
                <div className="mb-6 border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                        <th className="p-2 w-8 text-center border-r border-slate-800">No</th>
                        <th className="p-2 border-r border-slate-800">Rincian Keperluan / Nama Barang Realisasi</th>
                        <th className="p-2 w-28 text-center border-r border-slate-800">Kategori Anggaran</th>
                        <th className="p-2 w-28 text-right">Nominal Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pdfViewExpense.items && pdfViewExpense.items.length > 0 ? (
                        pdfViewExpense.items.map((item, idx) => (
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
                          <td className="p-2 font-medium text-slate-800 border-r border-slate-100">{pdfViewExpense.description}</td>
                          <td className="p-2 text-center border-r border-slate-100">
                            <span className="text-[8px] font-bold px-1.5 py-0.25 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                              {pdfViewExpense.category}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatIDR(pdfViewExpense.amount)}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-100 font-extrabold border-t border-slate-300">
                        <td colSpan={3} className="p-2 text-right text-slate-700 text-[9px] uppercase tracking-wider">
                          TOTAL PENGELUARAN REALISASI:
                        </td>
                        <td className="p-2 text-right font-mono text-red-600 text-xs border-l border-slate-200">
                          {formatIDR(pdfViewExpense.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Grid section */}
                <div className="grid grid-cols-4 gap-2 text-[9px] border border-slate-200 rounded p-2 bg-slate-50">
                  <div className="text-center flex flex-col justify-between h-20">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Dibuat Oleh</span>
                    <span className="font-extrabold text-slate-800 truncate px-1">{pdfViewExpense.pic}</span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Penerima Kas</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Diperiksa Oleh</span>
                    <span className="text-gray-600 font-bold text-[9px] border border-blue-200 rounded px-1 py-0.5 mx-1 bg-blue-50/30 self-center leading-tight">
                      VERIFIED<br />{pdfViewExpense.date}
                    </span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Site Supervisor</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Disetujui Oleh</span>
                    <span className="text-blue-600 font-mono font-bold text-[9px] border border-blue-200 rounded px-1 py-0.5 mx-1 bg-blue-50/50 self-center leading-tight">
                      APPROVED<br />{pdfViewExpense.date}
                    </span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Project Manager</span>
                  </div>
                  <div className="text-center flex flex-col justify-between h-20 border-l border-slate-200">
                    <span className="text-gray-500 uppercase font-bold text-[8px] block border-b border-slate-100 pb-1">Dibayarkan Oleh</span>
                    <span className="text-emerald-600 font-mono font-bold text-[9px] border border-emerald-200 rounded px-1 py-0.5 mx-1 bg-emerald-50/50 self-center leading-tight">
                      LUNAS / PAID<br />{pdfViewExpense.date}
                    </span>
                    <span className="text-gray-400 text-[8px] uppercase tracking-tight block border-t border-slate-100 pt-1">Finance / Kasir</span>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[7px] text-gray-400">
                  <span>Dokumen ini diterbitkan secara sah dan terekam dalam Sistem Keuangan Terpadu.</span>
                  <span className="font-mono">ID: {pdfViewExpense.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 p-4 flex gap-3 justify-end border-t border-slate-200 font-sans">
              <button
                type="button"
                onClick={() => setPdfViewExpense(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const prj = projects.find((p) => p.id === pdfViewExpense.projectId);
                  printVoucher(pdfViewExpense, prj);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/15"
              >
                <Printer className="w-4 h-4" /> Cetak Dokumen PDF
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

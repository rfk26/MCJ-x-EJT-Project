/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  FileText,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Send,
  ShoppingBag,
  Landmark,
  Trash2,
  CheckCircle2,
  Database,
  Coins,
  LogOut,
  Smartphone,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Project, Transaction, BudgetAlert, ProjectStatus, ActivityLog } from "./types";
import { INITIAL_PROJECTS, INITIAL_TRANSACTIONS, COMPANY_INFO, INITIAL_ACTIVITIES } from "./data";
import Dashboard from "./components/Dashboard";
import ProjectManager from "./components/ProjectManager";
import PetyCashRequestManager from "./components/PetyCashRequestManager";
import PetyCashExpenseManager from "./components/PetyCashExpenseManager";
import PurchaseOrderManager from "./components/PurchaseOrderManager";
import ReportGenerator from "./components/ReportGenerator";
import ClosedRecap from "./components/ClosedRecap";
import NotificationCenter from "./components/NotificationCenter";
import InvoiceManager from "./components/InvoiceManager";
import BackupManager from "./components/BackupManager";
import SalaryManager from "./components/SalaryManager";

export default function App() {
  // ROLE & LOGIN STATES
  const [userRole, setUserRole] = useState<"karyawan" | "direktur" | null>(() => {
    return localStorage.getItem("mcj_user_role") as "karyawan" | "direktur" | null;
  });

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // CATEGORIES STATE (DYNAMIC AND MANUAL INPUT SUPPORT)
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("mcj_categories");
    return saved ? JSON.parse(saved) : [
      "Gaji",
      "Material",
      "Consumable",
      "Tools",
      "Makan",
      "Air Minum",
      "Transportasi",
      "FEE MARKET",
      "Kopi Rokok",
      "Kesehatan",
      "Perlengkapan Pelindung",
      "Rental",
      "Mess karyawan",
      "Lain - Lain",
      "ATK",
      "Ppn 11%",
      "Ppn 11% Supplier",
      "Dana 2%",
      "BPJS JAKON",
      "Pph 4%"
    ];
  });

  // STATE DEFINITIONS
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("mcj_projects");
    return saved ? JSON.parse(saved) : []; // Default to empty array as requested
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("mcj_transactions");
    return saved ? JSON.parse(saved) : []; // Default to empty array as requested
  });

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  // Custom modal and toast states
  const [showResetModal, setShowResetModal] = useState(false);
  const [appToast, setAppToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("mcj_activities");
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // PERSIST STATE TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("mcj_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("mcj_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("mcj_activities", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("mcj_categories", JSON.stringify(categories));
  }, [categories]);

  const addActivity = (
    type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice",
    action: string,
    description: string,
    pic: string,
    projectId?: string
  ) => {
    const newActivity: ActivityLog = {
      id: "act-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      type,
      action,
      description,
      pic: pic || "Sistem",
      date: new Date().toISOString().split("T")[0],
      projectId,
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 50));
  };

  // Toast Auto-dismiss
  useEffect(() => {
    if (appToast) {
      const timer = setTimeout(() => {
        setAppToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [appToast]);

  // RESET TO CLEAR ALL INPUTTED DATA (BLANK SLATE)
  const handleResetData = () => {
    setShowResetModal(true);
  };

  const executeClearAllData = () => {
    setProjects([]);
    setTransactions([]);
    setActivities([]);
    localStorage.removeItem("mcj_dismissed_alerts");
    localStorage.removeItem("mcj_activities");
    setSelectedProjectId("all");
    setActiveTab("dashboard");
    setShowResetModal(false);
    setAppToast({ message: "Semua data berhasil dikosongkan secara permanen.", type: "success" });
  };

  const executeLoadDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setActivities(INITIAL_ACTIVITIES);
    localStorage.removeItem("mcj_dismissed_alerts");
    localStorage.setItem("mcj_activities", JSON.stringify(INITIAL_ACTIVITIES));
    setSelectedProjectId("all");
    setActiveTab("dashboard");
    setShowResetModal(false);
    setAppToast({ message: "Data contoh bawaan (Demo Seed Data) berhasil dimuat.", type: "info" });
  };

  const activeAlertsCount = alerts.filter((a) => !a.isRead).length;

  const handleLogin = (role: "karyawan" | "direktur") => {
    setUserRole(role);
    localStorage.setItem("mcj_user_role", role);
    setAppToast({ message: `Berhasil masuk sebagai ${role === "direktur" ? "Direktur" : "Karyawan"}.`, type: "success" });
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("mcj_user_role");
    setUsernameInput("");
    setPasswordInput("");
    setLoginError(null);
    setAppToast({ message: "Anda telah keluar dari sistem.", type: "info" });
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background blobs for depth */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-xl shadow-blue-500/20 border border-blue-400 mb-4">
              MCJ
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Portal Keuangan Proyek</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              CV. Mandiri Cipta Jaya x PT. Elqia Jaya Teknik
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (usernameInput === "admin" && passwordInput === "mcjxejt1515") {
                handleLogin("karyawan");
              } else if (usernameInput === "mcj x ejt" && passwordInput === "mcjejt1515") {
                handleLogin("direktur");
              } else {
                setLoginError("Username atau Password salah! (Gunakan info akun di bawah untuk masuk instan)");
              }
            }}
            className="space-y-4"
          >
            {loginError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              Masuk Sistem
            </button>
          </form>

          {/* Instant Login Profiles */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4">Masuk Instan (Satu-Klik)</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setUsernameInput("admin");
                  setPasswordInput("mcjxejt1515");
                  handleLogin("karyawan");
                }}
                className="flex flex-col items-center p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left"
              >
                <Coins className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-xs font-bold">Karyawan</span>
                <span className="text-[10px] text-slate-500">Bisa Input Data</span>
              </button>

              <button
                onClick={() => {
                  setUsernameInput("mcj x ejt");
                  setPasswordInput("mcjejt1515");
                  handleLogin("direktur");
                }}
                className="flex flex-col items-center p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs font-bold">Direktur</span>
                <span className="text-[10px] text-slate-500">Mengecek &amp; Melihat</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-[10px] text-slate-500">
              Sistem Keuangan Mandiri Cipta Jaya &amp; Elqia Jaya Teknik &copy; 2026
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* GLOBAL CORPORATE TOPBAR HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-50 print:hidden font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Corporate Identity */}
          <div className="flex items-center gap-3">
            <div className="px-3 h-10 bg-gradient-to-tr from-blue-700 to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center rounded-xl shadow-lg border border-blue-500 select-none whitespace-nowrap">
              MCJ x EJT
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight leading-tight flex items-center gap-2">
                {COMPANY_INFO.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider leading-none">
                  SISTEM PELACAK BIAYA &amp; KONTRAK REAL-TIME
                </p>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase leading-none inline-flex items-center">
                  Offline Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Action Tools (Notification Center & Reset Tool) */}
          <div className="flex items-center gap-3">
            {/* Quick stats indicator */}
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-300 mr-2 border-r border-slate-800 pr-5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pelacak Aktif</span>
              </div>
              <div>
                <span>Total Kontrak: </span>
                <strong className="text-blue-400">
                  {projects.filter(p => p.status !== ProjectStatus.CANCEL).length} Proyek
                </strong>
              </div>
            </div>

            {/* Active Role Indicator */}
            <div className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-xl border flex items-center gap-1.5 whitespace-nowrap ${
              userRole === "direktur"
                ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/30"
                : "bg-blue-950/40 text-blue-400 border-blue-500/30"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${userRole === "direktur" ? "bg-indigo-400 animate-pulse" : "bg-blue-400 animate-pulse"}`} />
              <span>{userRole === "direktur" ? "Direktur (ReadOnly)" : "Karyawan (Input)"}</span>
            </div>

            {/* Alert Notification Bell */}
            <NotificationCenter
              projects={projects}
              transactions={transactions}
              alerts={alerts}
              setAlerts={setAlerts}
            />

            {/* Dev Reset Seed Tool */}
            <button
              onClick={handleResetData}
              className="text-xs bg-slate-800 border border-slate-700 hover:border-red-500 hover:text-red-400 hover:bg-slate-800/80 text-gray-400 px-3.5 py-2.5 rounded-xl font-semibold tracking-wide transition-all cursor-pointer"
            >
              Reset Data
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-xs bg-slate-800 border border-slate-700 hover:border-red-500 hover:text-red-400 hover:bg-slate-800/80 text-gray-400 p-2.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CORPORATE HERO RAIL / NAVIGATION CARDS (print:hidden) */}
      <nav className="bg-white border-b border-gray-200 py-3.5 shadow-sm print:hidden font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Dropdown Navigation */}
          <div className="block lg:hidden w-full">
            <label className="block text-[10px] font-extrabold text-blue-700 uppercase tracking-wider mb-1">Menu Navigasi Portal</label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-all"
            >
              <option value="dashboard">📊 Dashboard Analitik</option>
              <option value="projects">💼 Manajemen Project</option>
              <option value="purchase_order">🛍️ Manajemen PO (Owner)</option>
              <option value="pety_cash_request">📩 Pengajuan Petty Cash</option>
              <option value="pety_cash_expense">💸 Pengeluaran Petty Cash</option>
              <option value="salary">🪙 Input &amp; Slip Gaji Karyawan</option>
              <option value="invoices">🏢 Manajemen Invoice (Tagihan)</option>
              <option value="reports">📄 Laporan Project (Cetak Resmi)</option>
              <option value="closed_recap">✓ Rekapan Closing Proyek</option>
              <option value="backup">💾 Backup &amp; Restore Database</option>
            </select>
          </div>

          {/* Desktop Tabs Navigation */}
          <div className="hidden lg:flex items-center overflow-x-auto gap-2 pb-1 sm:pb-0 scrollbar-none">
            
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Analitik
            </button>

            {/* Contract Projects Tab */}
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Briefcase className="w-4 h-4" /> Manajemen Project
            </button>

            {/* Purchase Order (PO) Tab */}
            <button
              onClick={() => setActiveTab("purchase_order")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "purchase_order"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Manajemen PO
            </button>

            {/* Petty Cash Request Tab */}
            <button
              onClick={() => setActiveTab("pety_cash_request")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "pety_cash_request"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Send className="w-4 h-4" /> Pengajuan Petty Cash
              {transactions.filter((t) => t.type === "PetyCashRequest" && t.status === "Belum Proses").length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  activeTab === "pety_cash_request" ? "bg-white text-blue-600" : "bg-amber-100 text-amber-800"
                }`}>
                  {transactions.filter((t) => t.type === "PetyCashRequest" && t.status === "Belum Proses").length}
                </span>
              )}
            </button>

            {/* Petty Cash Expense Tab */}
            <button
              onClick={() => setActiveTab("pety_cash_expense")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "pety_cash_expense"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Receipt className="w-4 h-4" /> Pengeluaran Petty Cash
            </button>

            {/* Input Gaji Tab */}
            <button
              onClick={() => setActiveTab("salary")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "salary"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Coins className="w-4 h-4" /> Input Gaji Karyawan
            </button>

            {/* Invoice Management Tab */}
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "invoices"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Landmark className="w-4 h-4" /> Manajemen Invoice
            </button>

            {/* Reports Tab */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "reports"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-4 h-4" /> Laporan Project
            </button>

            {/* Closing Recap Tab */}
            <button
              onClick={() => setActiveTab("closed_recap")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "closed_recap"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Rekapan Closing
              {projects.filter((p) => p.status === ProjectStatus.CLOSING).length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  activeTab === "closed_recap" ? "bg-white text-blue-600" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {projects.filter((p) => p.status === ProjectStatus.CLOSING).length}
                </span>
              )}
            </button>

            {/* Backup & Restore Tab */}
            <button
              onClick={() => setActiveTab("backup")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
                activeTab === "backup"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Database className="w-4 h-4" /> Backup &amp; Restore
            </button>

          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE COMPONENT STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Active view switcher */}
        {activeTab === "dashboard" && (
          <Dashboard
            projects={projects}
            transactions={transactions}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            setActiveTab={setActiveTab}
            activities={activities}
          />
        )}

        {activeTab === "projects" && (
          <ProjectManager
            projects={projects}
            setProjects={setProjects}
            transactions={transactions}
            setTransactions={setTransactions}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
          />
        )}

        {activeTab === "pety_cash_request" && (
          <PetyCashRequestManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
            categories={categories}
            setCategories={setCategories}
          />
        )}

        {activeTab === "pety_cash_expense" && (
          <PetyCashExpenseManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
            categories={categories}
            setCategories={setCategories}
          />
        )}

        {activeTab === "salary" && (
          <SalaryManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
          />
        )}

        {activeTab === "purchase_order" && (
          <PurchaseOrderManager
            projects={projects}
            setProjects={setProjects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
          />
        )}

        {activeTab === "invoices" && (
          <InvoiceManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={userRole === "direktur"}
          />
        )}

        {activeTab === "reports" && (
          <ReportGenerator
            projects={projects}
            transactions={transactions}
            selectedProjectId={selectedProjectId}
          />
        )}

        {activeTab === "closed_recap" && (
          <ClosedRecap
            projects={projects}
            transactions={transactions}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab("reports");
            }}
          />
        )}

        {activeTab === "backup" && (
          <BackupManager
            projects={projects}
            setProjects={setProjects}
            transactions={transactions}
            setTransactions={setTransactions}
            setAppToast={setAppToast}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-gray-400 border-t border-slate-800 py-6 text-center text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-200">
            {COMPANY_INFO.name} &mdash; Sistem Manajemen Keuangan Konstruksi
          </p>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-lg mx-auto">
            Aplikasi pelacak pengeluaran proyek real-time, laporan mingguan/bulanan formal ke jajaran direksi, peninjauan sisa pagu anggaran, dan alarm otomatis saat anggaran mendekati batas maksimal.
          </p>
          <p className="text-[9px] text-gray-600 pt-1">
            © {new Date().getFullYear()} CV. Mandiri Cipta Jaya. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* CUSTOM RESET MODAL DIALOG */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Atur Ulang / Reset Data</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pilih mode pengaturan ulang data keuangan sesuai dengan kebutuhan Anda.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={executeClearAllData}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-2 hover:shadow-lg"
                >
                  <Trash2 className="w-4 h-4" /> Kosongkan Semua Data (Blank Slate)
                </button>
                <button
                  type="button"
                  onClick={executeLoadDemoData}
                  className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4 text-slate-500" /> Muat Data Contoh (Demo Seed Data)
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP TOAST NOTIFICATION */}
      {appToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 z-[999] border border-slate-800 animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] font-medium leading-relaxed text-slate-200">{appToast.message}</p>
          </div>
          <button
            onClick={() => setAppToast(null)}
            className="text-slate-400 hover:text-white font-bold text-sm shrink-0 hover:bg-slate-800/50 w-5 h-5 rounded-full flex items-center justify-center transition-colors animate-none"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

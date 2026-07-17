/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
  Users,
  UserPlus,
  Key,
  X,
  Check,
  Eye,
  EyeOff,
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
// No custom logo import needed

export default function App() {
  const safeJsonParse = <T,>(key: string, fallback: T): T => {
    try {
      const val = localStorage.getItem(key);
      if (!val || val === "undefined" || val === "null") return fallback;
      const parsed = JSON.parse(val);
      if (parsed === null || parsed === undefined) return fallback;
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed as T;
    } catch (e) {
      console.warn(`Failed to parse localStorage key "${key}":`, e);
      return fallback;
    }
  };

  const getRoleLabel = (r: string | null) => {
    if (!r) return "";
    const lower = r.toLowerCase();
    if (lower === "admin") return "Admin";
    if (lower === "karyawan") return "Karyawan (Admin)";
    if (lower === "finance") return "Finance";
    if (lower === "project_manager") return "Project Manager";
    if (lower === "direktur") return "Direktur (User)";
    return "User";
  };

  const isTabReadOnly = (tab: string, role: string | null): boolean => {
    if (!role) return true;
    const r = role.toLowerCase();
    if (r === "admin" || r === "karyawan") return false; // Full access
    if (r === "finance") {
      // Finance can edit finance tabs
      if (tab === "pety_cash_request" || tab === "pety_cash_expense" || tab === "salary" || tab === "invoices" || tab === "purchase_order") {
        return false;
      }
      return true; // Read-only for projects
    }
    if (r === "project_manager") {
      // PM can edit projects and POs
      if (tab === "projects" || tab === "purchase_order") {
        return false;
      }
      return true; // Read-only for financial accounts
    }
    // "user", "direktur", or any other role is read-only for everything
    return true;
  };

  // ROLE & LOGIN STATES
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName: string; role: string } | null>(() => {
    return safeJsonParse<{ username: string; fullName: string; role: string } | null>("mcj_current_user", null);
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    const user = safeJsonParse<{ role: string } | null>("mcj_current_user", null);
    if (user) return user.role;
    return localStorage.getItem("mcj_user_role");
  });

  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // New UI states for rich login validation
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // USER MANAGEMENT STATES
  const [userList, setUserList] = useState<{ username: string; fullName: string; role: string }[]>([]);
  const [showUserMgmtModal, setShowUserMgmtModal] = useState(false);
  const [mgmtUsername, setMgmtUsername] = useState("");
  const [mgmtFullName, setMgmtFullName] = useState("");
  const [mgmtPassword, setMgmtPassword] = useState("");
  const [mgmtRole, setMgmtRole] = useState<string>("admin");
  const [mgmtEditingUser, setMgmtEditingUser] = useState<string | null>(null); // username if editing
  const [mgmtError, setMgmtError] = useState<string | null>(null);
  const [mgmtSuccess, setMgmtSuccess] = useState<string | null>(null);

  // CATEGORIES STATE (DYNAMIC AND MANUAL INPUT SUPPORT)
  const [categories, setCategories] = useState<string[]>(() => {
    return safeJsonParse<string[]>("mcj_categories", [
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
    ]);
  });

  // STATE DEFINITIONS
  const [projects, setProjects] = useState<Project[]>(() => {
    return safeJsonParse<Project[]>("mcj_projects", []); // Default to empty array as requested
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return safeJsonParse<Transaction[]>("mcj_transactions", []); // Default to empty array as requested
  });

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  // Custom modal and toast states
  const [showResetModal, setShowResetModal] = useState(false);
  const [appToast, setAppToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    return safeJsonParse<ActivityLog[]>("mcj_activities", INITIAL_ACTIVITIES);
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

  // REAL-TIME SERVER SYNC LOGIC
  const [serverLastUpdated, setServerLastUpdated] = useState<number>(0);
  const isSyncingRef = useRef(false);

  // Secure API fetch headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("mcj_auth_token") || sessionStorage.getItem("mcj_auth_token") || "";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  // Auto-verify secure token on startup / mount
  useEffect(() => {
    const verifyTokenOnStartup = async () => {
      const savedToken = localStorage.getItem("mcj_auth_token") || sessionStorage.getItem("mcj_auth_token");
      if (savedToken) {
        try {
          const res = await fetch("/api/auth/verify", {
            headers: {
              "Authorization": `Bearer ${savedToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setCurrentUser(data.user);
              setUserRole(data.user.role);
              return;
            }
          }
        } catch (e) {
          console.error("Token startup verification failed:", e);
        }
        // Verification failed/expired -> clear stale token data
        localStorage.removeItem("mcj_auth_token");
        sessionStorage.removeItem("mcj_auth_token");
        localStorage.removeItem("mcj_current_user");
        localStorage.removeItem("mcj_user_role");
        setCurrentUser(null);
        setUserRole(null);
      }
    };
    verifyTokenOnStartup();
  }, []);

  // Helper to fetch user list from server database
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUserList(data);
      }
    } catch (err) {
      console.error("Failed to fetch users list from database:", err);
    }
  };

  // Initial load from server on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userRole) return; // Prevent initial fetch before logged in
      try {
        isSyncingRef.current = true;
        const res = await fetch("/api/data", {
          headers: getAuthHeaders()
        });
        if (res.status === 401) {
          // Token expired or invalid during session
          handleLogout();
          return;
        }
        const data = await res.json();
        
        const projectsData = Array.isArray(data?.projects) ? data.projects : [];
        const transactionsData = Array.isArray(data?.transactions) ? data.transactions : [];
        const activitiesData = Array.isArray(data?.activities) ? data.activities : [];
        const categoriesData = Array.isArray(data?.categories) ? data.categories : categories;
        const lastUpdatedVal = typeof data?.lastUpdated === "number" ? data.lastUpdated : Date.now();

        // If server has no projects/transactions, but we have local data, seed the server!
        if (projectsData.length === 0 && transactionsData.length === 0) {
          const projectsToSeed = safeJsonParse<Project[]>("mcj_projects", []);
          const transactionsToSeed = safeJsonParse<Transaction[]>("mcj_transactions", []);
          const activitiesToSeed = safeJsonParse<ActivityLog[]>("mcj_activities", INITIAL_ACTIVITIES);
          const categoriesToSeed = safeJsonParse<string[]>("mcj_categories", categories);

          if (projectsToSeed.length > 0 || transactionsToSeed.length > 0) {
            console.log("Seeding server database with local storage data...");
            const seedRes = await fetch("/api/data/update", {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                projects: projectsToSeed,
                transactions: transactionsToSeed,
                activities: activitiesToSeed,
                categories: categoriesToSeed
              })
            });
            const seedResult = await seedRes.json();
            if (seedResult.success) {
              setProjects(projectsToSeed);
              setTransactions(transactionsToSeed);
              setActivities(activitiesToSeed);
              setCategories(categoriesToSeed);
              setServerLastUpdated(seedResult.lastUpdated);
            }
          } else {
            setProjects(projectsData);
            setTransactions(transactionsData);
            setActivities(activitiesData);
            setCategories(categoriesData);
            setServerLastUpdated(lastUpdatedVal);
          }
        } else {
          // Server has data, load it
          setProjects(projectsData);
          setTransactions(transactionsData);
          setActivities(activitiesData);
          setCategories(categoriesData);
          setServerLastUpdated(lastUpdatedVal);
        }

        // Fetch user list too
        await fetchUsers();
      } catch (err) {
        console.error("Failed to fetch initial server data:", err);
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 100);
      }
    };

    loadInitialData();
  }, []);

  // Push local updates to server
  useEffect(() => {
    if (isSyncingRef.current) return;

    const pushData = async () => {
      if (!userRole) return;
      try {
        const res = await fetch("/api/data/update", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ projects, transactions, activities, categories }),
        });
        const result = await res.json();
        if (result.success) {
          isSyncingRef.current = true;
          setServerLastUpdated(result.lastUpdated);
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 100);
        }
      } catch (err) {
        console.error("Failed to push update to server:", err);
      }
    };

    pushData();
  }, [projects, transactions, activities, categories]);

  // Poll server for updates every 3 seconds to keep multiple computers in real-time sync
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isSyncingRef.current || !userRole) return;
      try {
        const res = await fetch("/api/data/status");
        const status = await res.json();
        if (status.lastUpdated > serverLastUpdated) {
          isSyncingRef.current = true;
          const dataRes = await fetch("/api/data", {
            headers: getAuthHeaders()
          });
          const data = await dataRes.json();
          
          setProjects(Array.isArray(data?.projects) ? data.projects : []);
          setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
          setActivities(Array.isArray(data?.activities) ? data.activities : []);
          setCategories(Array.isArray(data?.categories) ? data.categories : categories);
          setServerLastUpdated(typeof data?.lastUpdated === "number" ? data.lastUpdated : Date.now());
          
          // Sync users
          await fetchUsers();
          
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 100);
        }
      } catch (err) {
        console.error("Failed to poll server updates:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [serverLastUpdated]);

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

  // USER LIST ADMINISTRATION HANDLERS
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMgmtError(null);
    setMgmtSuccess(null);
    if (!mgmtUsername.trim() || !mgmtFullName.trim() || (!mgmtEditingUser && !mgmtPassword)) {
      setMgmtError("Harap isi semua kolom wajib!");
      return;
    }
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: mgmtEditingUser ? "update" : "create",
          username: mgmtUsername.trim(),
          fullName: mgmtFullName.trim(),
          password: mgmtPassword ? mgmtPassword : undefined,
          role: mgmtRole
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMgmtSuccess(mgmtEditingUser ? "Akun karyawan berhasil diperbarui!" : "Akun karyawan baru berhasil didaftarkan!");
        setMgmtUsername("");
        setMgmtFullName("");
        setMgmtPassword("");
        setMgmtRole("karyawan");
        setMgmtEditingUser(null);
        await fetchUsers();
      } else {
        setMgmtError(data.message || "Gagal menyimpan akun.");
      }
    } catch (err) {
      console.error(err);
      setMgmtError("Koneksi gagal.");
    }
  };

  const handleEditUserClick = (u: { username: string; fullName: string; role: string }) => {
    setMgmtUsername(u.username);
    setMgmtFullName(u.fullName);
    setMgmtPassword("");
    setMgmtRole(u.role);
    setMgmtEditingUser(u.username);
    setMgmtError(null);
    setMgmtSuccess(null);
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete === "admin") {
      alert("Akun default 'admin' tidak dapat dihapus demi keamanan sistem.");
      return;
    }
    if (currentUser && currentUser.username === usernameToDelete) {
      alert("Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus akun karyawan '${usernameToDelete}' secara permanen?`)) {
      return;
    }
    setMgmtError(null);
    setMgmtSuccess(null);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: "delete",
          username: usernameToDelete
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMgmtSuccess("Akun karyawan berhasil dihapus.");
        await fetchUsers();
      } else {
        setMgmtError(data.message || "Gagal menghapus pengguna.");
      }
    } catch (err) {
      console.error(err);
      setMgmtError("Koneksi gagal.");
    }
  };

  const activeAlertsCount = alerts.filter((a) => !a.isRead).length;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Form validation
    const username = usernameInput.trim();
    if (!username) {
      setLoginError("Username wajib diisi!");
      return;
    }
    if (!passwordInput) {
      setLoginError("Password wajib diisi!");
      return;
    }
    if (passwordInput.length < 4) {
      setLoginError("Password minimal harus memiliki panjang 4 karakter!");
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: passwordInput })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const user = result.user;
          const token = result.token;

          // Save token depending on Remember Me
          if (rememberMe) {
            localStorage.setItem("mcj_auth_token", token);
          } else {
            sessionStorage.setItem("mcj_auth_token", token);
          }

          setCurrentUser(user);
          setUserRole(user.role);
          localStorage.setItem("mcj_current_user", JSON.stringify(user));
          localStorage.setItem("mcj_user_role", user.role);

          setAppToast({ 
            message: `Berhasil masuk sebagai ${user.fullName} (${getRoleLabel(user.role)}).`, 
            type: "success" 
          });
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.message || "Username atau Password salah!");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setLoginError("Gagal menghubungkan ke server!");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    const savedToken = localStorage.getItem("mcj_auth_token") || sessionStorage.getItem("mcj_auth_token");
    if (savedToken) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${savedToken}`
          }
        });
      } catch (e) {
        console.error("Logout request failed:", e);
      }
    }

    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem("mcj_auth_token");
    sessionStorage.removeItem("mcj_auth_token");
    localStorage.removeItem("mcj_current_user");
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
        <div className="absolute top-10 right-10 flex flex-col items-end gap-1 pointer-events-none select-none opacity-20">
          <span className="text-xs font-mono">STATUS: LIVE SERVER</span>
          <span className="text-[10px] font-mono">DB: data-db.json</span>
        </div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-xl shadow-blue-500/20 border border-blue-400 mb-4 animate-bounce duration-1000">
              MCJ
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Portal Keuangan Proyek</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">
              CV. Mandiri Cipta Jaya <span className="text-amber-500">&times;</span> PT. Elqia Jaya Teknik
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLoginSubmit}
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                />
                <span>Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Sistem"
              )}
            </button>
          </form>

          {/* Forgot Password Modal Overlay */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" /> Pemulihan Kata Sandi
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Untuk menjaga integritas keuangan proyek, pemulihan kata sandi tidak dapat dilakukan secara mandiri.
                  Silakan hubungi <strong>Direksi</strong> atau <strong>IT Administrator CV. Mandiri Cipta Jaya</strong> untuk menyetel ulang kata sandi Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}


          <div className="text-center mt-8 pt-6 border-t border-slate-800">
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
                  Sistem Aktif
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

            {/* Active User profile with role and name */}
            {currentUser ? (
              <div className="flex items-center gap-2 mr-1">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-none tracking-wide">{currentUser.fullName}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-semibold tracking-wider font-mono">{currentUser.username}</span>
                </div>
                <div className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-xl border flex items-center gap-1.5 whitespace-nowrap ${
                  userRole === "direktur" || userRole === "user"
                    ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/30"
                    : "bg-blue-950/40 text-blue-400 border-blue-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${userRole === "direktur" || userRole === "user" ? "bg-indigo-400 animate-pulse" : "bg-blue-400 animate-pulse"}`} />
                  <span>{getRoleLabel(userRole)}</span>
                </div>
              </div>
            ) : (
              <div className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-xl border flex items-center gap-1.5 whitespace-nowrap ${
                userRole === "direktur" || userRole === "user"
                  ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/30"
                  : "bg-blue-950/40 text-blue-400 border-blue-500/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${userRole === "direktur" || userRole === "user" ? "bg-indigo-400 animate-pulse" : "bg-blue-400 animate-pulse"}`} />
                <span>{getRoleLabel(userRole)}</span>
              </div>
            )}

            {/* User Management Button (Admin/Karyawan only) */}
            {(userRole === "admin" || userRole === "karyawan") && (
              <button
                onClick={() => {
                  setMgmtUsername("");
                  setMgmtFullName("");
                  setMgmtPassword("");
                  setMgmtRole("admin");
                  setMgmtEditingUser(null);
                  setMgmtError(null);
                  setMgmtSuccess(null);
                  setShowUserMgmtModal(true);
                }}
                className="text-xs bg-slate-800 border border-slate-700 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-850 text-gray-300 px-3 py-2 rounded-xl font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                title="Kelola Akun Pengguna Karyawan"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Kelola Karyawan</span>
              </button>
            )}

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
            isReadOnly={isTabReadOnly("projects", userRole)}
          />
        )}

        {activeTab === "pety_cash_request" && (
          <PetyCashRequestManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={isTabReadOnly("pety_cash_request", userRole)}
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
            isReadOnly={isTabReadOnly("pety_cash_expense", userRole)}
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
            isReadOnly={isTabReadOnly("salary", userRole)}
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
            isReadOnly={isTabReadOnly("purchase_order", userRole)}
          />
        )}

        {activeTab === "invoices" && (
          <InvoiceManager
            projects={projects}
            transactions={transactions}
            setTransactions={setTransactions}
            selectedProjectId={selectedProjectId}
            onAddActivity={addActivity}
            isReadOnly={isTabReadOnly("invoices", userRole)}
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

      {/* USER MANAGEMENT MODAL */}
      {showUserMgmtModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[990] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Left side: Form to Add/Edit User */}
            <div className="w-full md:w-5/12 bg-slate-50 p-6 border-r border-gray-100 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      {mgmtEditingUser ? "Edit Akun Karyawan" : "Tambah Karyawan Baru"}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">Isi detail akun untuk login bersamaan</p>
                  </div>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-4">
                  {mgmtError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{mgmtError}</span>
                    </div>
                  )}

                  {mgmtSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-1.5 font-medium animate-pulse">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{mgmtSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Username (ID Login)</label>
                    <input
                      type="text"
                      placeholder="Contoh: budi, roni"
                      value={mgmtUsername}
                      onChange={(e) => setMgmtUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      disabled={mgmtEditingUser !== null}
                      className="w-full bg-white border border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Nama Lengkap (PIC)</label>
                    <input
                      type="text"
                      placeholder="Nama lengkap PIC"
                      value={mgmtFullName}
                      onChange={(e) => setMgmtFullName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Hak Akses (Role)</label>
                    <select
                      value={mgmtRole}
                      onChange={(e) => setMgmtRole(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold cursor-pointer"
                    >
                      <option value="admin">Admin (Akses Penuh)</option>
                      <option value="finance">Finance (Keuangan &amp; Slip Gaji)</option>
                      <option value="project_manager">Project Manager (Manajemen Proyek &amp; PO)</option>
                      <option value="direktur">Direktur / User (Akses ReadOnly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {mgmtEditingUser ? "Password Baru (Kosongkan jika tetap)" : "Password"}
                    </label>
                    <input
                      type="password"
                      placeholder={mgmtEditingUser ? "Tetap rahasia jika kosong" : "Masukkan password baru"}
                      value={mgmtPassword}
                      onChange={(e) => setMgmtPassword(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono"
                      required={!mgmtEditingUser}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                    >
                      {mgmtEditingUser ? "Simpan Perubahan" : "Daftarkan Pengguna"}
                    </button>
                    {mgmtEditingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setMgmtUsername("");
                          setMgmtFullName("");
                          setMgmtPassword("");
                          setMgmtRole("karyawan");
                          setMgmtEditingUser(null);
                          setMgmtError(null);
                          setMgmtSuccess(null);
                        }}
                        className="px-3.5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200/60 text-[10px] text-gray-400 font-medium font-sans">
                Setiap akun yang didaftarkan akan tersinkronisasi secara real-time ke semua komputer karyawan yang sedang aktif.
              </div>
            </div>

            {/* Right side: Table showing registered users */}
            <div className="w-full md:w-7/12 p-6 flex flex-col justify-between overflow-hidden">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" /> Daftar Pengguna Terdaftar ({userList.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowUserMgmtModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Nama PIC</th>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {userList.map((u) => (
                        <tr key={u.username} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{u.fullName}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 font-medium">{u.username}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              u.role === "direktur" || u.role === "user"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleEditUserClick(u)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              {u.username !== "admin" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.username)}
                                  className="text-[10px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 p-3 mt-4 rounded-2xl flex items-center justify-between text-[10px] text-gray-500 border border-gray-100 font-sans">
                <span>Catatan: Akun default <b>admin</b> tidak dapat dihapus.</span>
                <button
                  type="button"
                  onClick={() => setShowUserMgmtModal(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-[10px] transition-all cursor-pointer shadow-sm"
                >
                  Tutup Panel
                </button>
              </div>
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

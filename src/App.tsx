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
  Lock,
  Users,
  UserPlus,
  Key,
  X,
  Check,
  Eye,
  EyeOff,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Building2,
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
import CompanyLogoModal from "./components/CompanyLogoModal";
import { io } from "socket.io-client";
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

  // PUBLIC REGISTER STATES
  const [loginTab, setLoginTab] = useState<"login" | "register">("login");
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("karyawan");
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // USER MANAGEMENT STATES
  const [userList, setUserList] = useState<{ username: string; fullName: string; role: string; isOnline?: boolean; lastSeen?: number | null }[]>([]);
  const [userFilterStatus, setUserFilterStatus] = useState<"all" | "online" | "offline">("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
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

  const sanitizeProjects = (projList: Project[]): Project[] => {
    return projList.map((p) => {
      const isHoOrEjt = p.name.toUpperCase().includes("HO") || (p.code && p.code.toUpperCase().includes("HO")) || p.name.toUpperCase().includes("EJT");
      if (isHoOrEjt) {
        const ppnPercent = (p.ppnPercent === 11 || p.ppnPercent === undefined) ? 0 : p.ppnPercent;
        const pphPercent = (p.pphPercent === 4 || p.pphPercent === undefined) ? 0 : p.pphPercent;
        return { ...p, ppnPercent, pphPercent };
      }
      return p;
    });
  };

  // STATE DEFINITIONS
  const [projects, setProjects] = useState<Project[]>(() => {
    const loaded = safeJsonParse<Project[]>("mcj_projects", []);
    return sanitizeProjects(loaded);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return safeJsonParse<Transaction[]>("mcj_transactions", []); // Default to empty array as requested
  });

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  
  // Theme and Sidebar States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("mcj_theme") === "dark";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("mcj_sidebar_collapsed") === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Custom modal and toast states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [customLogoMCJ, setCustomLogoMCJ] = useState<string | null>(() => {
    return localStorage.getItem("mcj_company_logo");
  });
  const [customLogoEJT, setCustomLogoEJT] = useState<string | null>(() => {
    return localStorage.getItem("mcj_company_logo_ejt");
  });
  const [appToast, setAppToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Backup Overdue Tracker State
  const [backupOverdueInfo, setBackupOverdueInfo] = useState<{ isOverdue: boolean; days: number | null }>(() => {
    const lastBackupStr = localStorage.getItem("mcj_last_manual_backup_download_timestamp");
    const threshold = Number(localStorage.getItem("mcj_backup_alert_days") || 7);
    if (!lastBackupStr) return { isOverdue: true, days: null };
    const diffDays = Math.floor((Date.now() - new Date(lastBackupStr).getTime()) / (1000 * 60 * 60 * 24));
    return { isOverdue: diffDays >= threshold, days: diffDays };
  });

  useEffect(() => {
    const checkBackupStatus = () => {
      const lastBackupStr = localStorage.getItem("mcj_last_manual_backup_download_timestamp");
      const threshold = Number(localStorage.getItem("mcj_backup_alert_days") || 7);
      if (!lastBackupStr) {
        setBackupOverdueInfo({ isOverdue: true, days: null });
      } else {
        const diffDays = Math.floor((Date.now() - new Date(lastBackupStr).getTime()) / (1000 * 60 * 60 * 24));
        setBackupOverdueInfo({ isOverdue: diffDays >= threshold, days: diffDays });
      }
    };

    checkBackupStatus();
    window.addEventListener("mcj_backup_updated", checkBackupStatus);
    return () => window.removeEventListener("mcj_backup_updated", checkBackupStatus);
  }, []);

  const handleSaveLogo = (logoMCJ: string | null, logoEJT: string | null) => {
    setCustomLogoMCJ(logoMCJ);
    setCustomLogoEJT(logoEJT);
    if (logoMCJ) {
      localStorage.setItem("mcj_company_logo", logoMCJ);
    } else {
      localStorage.removeItem("mcj_company_logo");
    }
    if (logoEJT) {
      localStorage.setItem("mcj_company_logo_ejt", logoEJT);
    } else {
      localStorage.removeItem("mcj_company_logo_ejt");
    }
    setAppToast({ message: "Logo perusahaan berhasil diperbarui!", type: "success" });
  };

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

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("mcj_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mcj_theme", "light");
    }
  }, [isDarkMode]);

  // REAL-TIME SERVER SYNC LOGIC
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [serverLastUpdated, setServerLastUpdated] = useState<number>(0);
  const isSyncingRef = useRef(false);
  const socketRef = useRef<any>(null);

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
        if (Array.isArray(data)) {
          setUserList(
            data.map((u: any) => ({
              ...u,
              isOnline: Boolean(
                u.isOnline || (currentUser && u.username?.toLowerCase() === currentUser.username?.toLowerCase())
              )
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Failed to fetch users list from database:", err instanceof Error ? err.message : err);
    }
  };

  // Initial load from server on mount or login
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
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
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
              setProjects(sanitizeProjects(projectsToSeed));
              setTransactions(transactionsToSeed);
              setActivities(activitiesToSeed);
              setCategories(categoriesToSeed);
              setServerLastUpdated(seedResult.lastUpdated);
            }
          } else {
            setProjects(sanitizeProjects(projectsData));
            setTransactions(transactionsData);
            setActivities(activitiesData);
            setCategories(categoriesData);
            setServerLastUpdated(lastUpdatedVal);
          }
        } else {
          // Server has data, load it
          setProjects(sanitizeProjects(projectsData));
          setTransactions(transactionsData);
          setActivities(activitiesData);
          setCategories(categoriesData);
          setServerLastUpdated(lastUpdatedVal);
        }

        // Fetch user list too
        await fetchUsers();
        setInitialDataLoaded(true);
      } catch (err) {
        console.warn("Failed to fetch initial server data:", err instanceof Error ? err.message : err);
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 100);
      }
    };

    loadInitialData();
  }, [userRole]);

  // Push local updates to server (ONLY AFTER initial data is loaded into state)
  useEffect(() => {
    if (!initialDataLoaded || !userRole || isSyncingRef.current) return;

    // Save to localStorage as secondary backup
    try {
      localStorage.setItem("mcj_projects", JSON.stringify(projects));
      localStorage.setItem("mcj_transactions", JSON.stringify(transactions));
      localStorage.setItem("mcj_activities", JSON.stringify(activities));
      localStorage.setItem("mcj_categories", JSON.stringify(categories));
    } catch (e) {
      console.warn("Failed saving to localStorage:", e);
    }

    const pushData = async () => {
      try {
        const res = await fetch("/api/data/update", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ projects, transactions, activities, categories, allowClearAll: true }),
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
        console.warn("Push update to server skipped (network pause):", err instanceof Error ? err.message : err);
      }
    };

    pushData();
  }, [projects, transactions, activities, categories, initialDataLoaded, userRole]);

  // Poll server for updates every 3 seconds to keep multiple computers in real-time sync
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isSyncingRef.current || !userRole || !initialDataLoaded) return;
      try {
        const res = await fetch("/api/data/status");
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }
        const status = await res.json();
        if (status && typeof status.lastUpdated === "number" && status.lastUpdated > serverLastUpdated) {
          isSyncingRef.current = true;
          const dataRes = await fetch("/api/data", {
            headers: getAuthHeaders()
          });
          if (!dataRes.ok) {
            isSyncingRef.current = false;
            return;
          }
          const dataContentType = dataRes.headers.get("content-type");
          if (!dataContentType || !dataContentType.includes("application/json")) {
            isSyncingRef.current = false;
            return;
          }
          const data = await dataRes.json();
          
          if (Array.isArray(data?.projects)) setProjects(sanitizeProjects(data.projects));
          if (Array.isArray(data?.transactions)) setTransactions(data.transactions);
          if (Array.isArray(data?.activities)) setActivities(data.activities);
          if (Array.isArray(data?.categories)) setCategories(data.categories);
          setServerLastUpdated(typeof data?.lastUpdated === "number" ? data.lastUpdated : Date.now());
          
          // Sync users
          await fetchUsers();
          
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 100);
        }
      } catch (err) {
        // Soft error log during transient background network polling
        console.warn("Server update poll skipped:", err instanceof Error ? err.message : err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [serverLastUpdated, userRole, initialDataLoaded]);

  // Real-time socket updates
  useEffect(() => {
    if (!userRole) return;

    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO real-time server");
      if (currentUser) {
        socket.emit("user_online", {
          username: currentUser.username,
          fullName: currentUser.fullName,
          role: currentUser.role
        });
      }
    });

    socket.on("online_users_changed", (onlineList: Array<{ username: string; fullName: string; role: string; isOnline: boolean; lastSeen: number }>) => {
      const onlineSet = new Set(onlineList.filter((o) => o.isOnline).map((o) => o.username.toLowerCase()));
      setUserList((prev) =>
        prev.map((u) => {
          const isMe = currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase();
          return {
            ...u,
            isOnline: Boolean(isMe || onlineSet.has(u.username.toLowerCase()))
          };
        })
      );
    });

    socket.on("data_updated", async (status: { lastUpdated: number }) => {
      if (status.lastUpdated > serverLastUpdated) {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        try {
          const dataRes = await fetch("/api/data", {
            headers: getAuthHeaders()
          });
          if (dataRes.status === 401) {
            handleLogout();
            return;
          }
          const data = await dataRes.json();
          setProjects(Array.isArray(data?.projects) ? data.projects : []);
          setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
          setActivities(Array.isArray(data?.activities) ? data.activities : []);
          setCategories(Array.isArray(data?.categories) ? data.categories : categories);
          setServerLastUpdated(typeof data?.lastUpdated === "number" ? data.lastUpdated : Date.now());

          await fetchUsers();
        } catch (err) {
          console.warn("Socket update fetch skipped:", err instanceof Error ? err.message : err);
        } finally {
          isSyncingRef.current = false;
        }
      }
    });

    socket.on("users_updated", async () => {
      await fetchUsers();
    });

    return () => {
      socket.disconnect();
    };
  }, [userRole, serverLastUpdated, currentUser]);

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
    if (userRole !== "admin" && userRole !== "karyawan") {
      setMgmtError("Akses ditolak: Anda hanya memiliki hak akses Read-Only.");
      return;
    }
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
    if (userRole !== "admin" && userRole !== "karyawan") return;
    setMgmtUsername(u.username);
    setMgmtFullName(u.fullName);
    setMgmtPassword("");
    setMgmtRole(u.role);
    setMgmtEditingUser(u.username);
    setMgmtError(null);
    setMgmtSuccess(null);
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (userRole !== "admin" && userRole !== "karyawan") {
      alert("Akses ditolak: Anda hanya memiliki hak akses Read-Only.");
      return;
    }
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const username = regUsername.trim().toLowerCase().replace(/\s+/g, "");
    const fullName = regFullName.trim();
    const password = regPassword;
    const role = regRole;

    if (!username || !fullName || !password || !role) {
      setRegError("Semua kolom wajib diisi!");
      return;
    }

    if (password.length < 4) {
      setRegError("Password minimal harus memiliki panjang 4 karakter!");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, password, role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccess("Pendaftaran berhasil! Akun karyawan Anda siap digunakan.");
        setAppToast({ message: "Registrasi akun berhasil! Silakan masuk.", type: "success" });
        
        // Auto-fill login fields for convenience
        setUsernameInput(username);
        setPasswordInput(password);
        
        // Clear registration form
        setRegUsername("");
        setRegFullName("");
        setRegPassword("");
        
        // Switch to login tab after 1.5 seconds
        setTimeout(() => {
          setLoginTab("login");
          setRegSuccess(null);
        }, 1500);
      } else {
        setRegError(data.message || "Gagal melakukan pendaftaran.");
      }
    } catch (err) {
      console.error(err);
      setRegError("Koneksi gagal ke server pendaftaran.");
    } finally {
      setRegLoading(false);
    }
  };

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

          if (socketRef.current) {
            socketRef.current.emit("user_online", {
              username: user.username,
              fullName: user.fullName,
              role: user.role
            });
          }

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
    if (socketRef.current && currentUser) {
      socketRef.current.emit("user_offline", { username: currentUser.username });
    }
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-blue-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl relative z-10 transition-all">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            {customLogoMCJ || customLogoEJT ? (
              <div className="flex items-center justify-center gap-3 mb-4">
                {customLogoMCJ && (
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden">
                    <img src={customLogoMCJ} alt="Logo MCJ" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                {customLogoEJT && (
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center overflow-hidden">
                    <img src={customLogoEJT} alt="Logo EJT" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto inline-flex px-4 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl items-center justify-center text-white text-base font-black shadow-md shadow-blue-500/20 mb-4 select-none">
                MCJxEJT
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Portal Keuangan Proyek</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider font-bold">
              CV. Mandiri Cipta Jaya <span className="text-blue-500 font-extrabold">&times;</span> PT. Elqia Jaya Teknik
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-5"
          >
            {loginError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2.5 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
   
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans font-semibold"
                required
              />
            </div>
   
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
   
            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="font-medium">Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
   
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk Sistem</span>
              )}
            </button>
          </form>
 
          {/* Forgot Password Modal Overlay */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Pemulihan Kata Sandi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Untuk menjaga integritas keuangan proyek, pemulihan kata sandi tidak dapat dilakukan secara mandiri.
                  Silakan hubungi <strong className="text-slate-800 dark:text-white">Direksi</strong> atau <strong className="text-slate-800 dark:text-white">IT Administrator</strong> untuk menyetel ulang kata sandi Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
 
          <div className="text-center mt-8 pt-6 border-t border-slate-150 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              Sistem Keuangan Mandiri Cipta Jaya &amp; Elqia Jaya Teknik &copy; 2026
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors">
      
      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* COLLAPSIBLE SIDEBAR FOR DESKTOP & MOBILE DRAWER */}
      <aside className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 print:hidden h-full shrink-0
        ${mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-[70px]" : "lg:w-64"}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {customLogoMCJ || customLogoEJT ? (
              <div className="flex items-center gap-1 shrink-0">
                {customLogoMCJ && (
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                    <img src={customLogoMCJ} alt="Logo MCJ" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                {customLogoEJT && (
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                    <img src={customLogoEJT} alt="Logo EJT" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            ) : (
              <div className="px-2 h-9 bg-blue-600 dark:bg-blue-500 text-white font-black text-[10px] flex items-center justify-center rounded-xl shadow-md shrink-0 select-none">
                MCJxEJT
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white leading-none uppercase">MCJ x EJT</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase mt-0.5">FINANCIALS</span>
              </div>
            )}
          </div>
          {mobileSidebarOpen && (
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sidebar List */}
        <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "projects", label: "Proyek", icon: Briefcase },
            { id: "purchase_order", label: "Purchase Order", icon: ShoppingBag },
            { 
              id: "pety_cash_request", 
              label: "Pengajuan Petty Cash", 
              icon: Send,
              badge: transactions.filter((t) => t.type === "PetyCashRequest" && t.status === "Belum Proses").length 
            },
            { id: "pety_cash_expense", label: "Pengeluaran", icon: Receipt },
            { id: "salary", label: "Input Gaji", icon: Coins },
            { id: "invoices", label: "Invoice", icon: Landmark },
            { id: "reports", label: "Laporan", icon: FileText },
            { 
              id: "closed_recap", 
              label: "Closing Proyek", 
              icon: CheckSquare,
              badge: projects.filter((p) => p.status === ProjectStatus.CLOSING).length 
            },
            { id: "backup", label: "Backup & Restore", icon: Database }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (mobileSidebarOpen) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group cursor-pointer
                  ${isActive 
                    ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/10" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {item.badge && item.badge > 0 ? (
                  sidebarCollapsed ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  ) : (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? "bg-white text-blue-600" : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"}`}>
                      {item.badge}
                    </span>
                  )
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer / Collapse Trigger */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 hidden lg:block">
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              localStorage.setItem("mcj_sidebar_collapsed", String(!sidebarCollapsed));
            }}
            className="w-full flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* RIGHT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-35 print:hidden transition-all duration-300">
          
          {/* Topbar Left (Mobile trigger & active tab info) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Portal Keuangan</h2>
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize tracking-tight leading-tight flex items-center gap-1.5 mt-0.5">
                {activeTab.replace(/_/g, ' ')}
              </h1>
            </div>
          </div>

          {/* Topbar Right (Actions & Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              title={isDarkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Quick Proyek stats (hidden on small screen) */}
            <div className="hidden xl:flex flex-col text-right mr-1 border-r border-slate-200 dark:border-slate-800 pr-4">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Sistem</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {projects.filter(p => p.status !== ProjectStatus.CANCEL).length} Proyek Aktif
              </span>
            </div>

            {/* User Profile */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 px-3 py-1.5 rounded-2xl">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{currentUser.fullName}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-bold font-mono tracking-wider">{currentUser.username}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-black rounded-lg border border-blue-200/30">
                  {getRoleLabel(userRole)}
                </span>
              </div>
            )}

            {/* Kelola Karyawan Button (Visible for all logged-in roles; ReadOnly for PM/other non-admins) */}
            {currentUser && (
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
                className="p-2 md:px-3 md:py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                title="Kelola Akun Pengguna & Status Online Karyawan"
              >
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {userList.some((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <span className="text-xs font-bold hidden md:inline">Karyawan</span>
                {userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length > 0 ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length} Online
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[10px] text-slate-400 font-medium">
                    {userList.length} User
                  </span>
                )}
              </button>
            )}

            {/* Ganti Logo Perusahaan Button */}
            {currentUser && (
              <button
                onClick={() => setShowLogoModal(true)}
                className="p-2 md:px-3 md:py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                title="Upload & Ganti Logo Perusahaan Secara Manual"
              >
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold hidden lg:inline">Ganti Logo</span>
              </button>
            )}

            {/* Notification Center */}
            <NotificationCenter
              projects={projects}
              transactions={transactions}
              alerts={alerts}
              setAlerts={setAlerts}
              onNavigateToBackup={() => setActiveTab("backup")}
            />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* BACKUP OVERDUE ALERT BANNER */}
        {currentUser && backupOverdueInfo.isOverdue && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-sm text-xs flex flex-wrap items-center justify-between gap-3 font-sans border-b border-amber-800 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-amber-800/60 rounded-lg shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-200" />
              </div>
              <span>
                <strong>Peringatan Cadangan Data:</strong>{" "}
                {backupOverdueInfo.days !== null
                  ? `Data proyek & transaksi belum dicadangkan (download JSON) selama ${backupOverdueInfo.days} hari.`
                  : "Data proyek & transaksi belum pernah dicadangkan (download JSON) ke file komputer Anda."}{" "}
                Lakukan unduh cadangan secara berkala di menu Backup untuk mencegah kehilangan data.
              </span>
            </div>
            <button
              onClick={() => setActiveTab("backup")}
              className="px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-lg text-xs transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-amber-700" /> Cadangkan Sekarang
            </button>
          </div>
        )}

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
            activities={activities}
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
            activities={activities}
            setActivities={setActivities}
            categories={categories}
            setCategories={setCategories}
            setAppToast={setAppToast}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 text-gray-400 dark:text-gray-500 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs print:hidden transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {COMPANY_INFO.name} &mdash; Sistem Manajemen Keuangan Konstruksi
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-lg mx-auto font-medium">
            Aplikasi pelacak pengeluaran proyek real-time, laporan mingguan/bulanan formal ke jajaran direksi, peninjauan sisa pagu anggaran, dan alarm otomatis saat anggaran mendekati batas maksimal.
          </p>
          <p className="text-[9px] text-gray-400 dark:text-gray-600 pt-1 font-semibold">
            © {new Date().getFullYear()} CV. Mandiri Cipta Jaya. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div> {/* Closes <div className="flex-1 flex flex-col min-w-0 min-h-screen"> */}

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
        (() => {
          const isMgmtReadOnly = userRole !== "admin" && userRole !== "karyawan";
          return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[990] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
                
                {/* Left side: Form to Add/Edit User OR Read-Only Banner */}
                <div className="w-full md:w-5/12 bg-slate-50 p-6 border-r border-gray-100 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-xl ${isMgmtReadOnly ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                        {isMgmtReadOnly ? <Lock className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                          {isMgmtReadOnly
                            ? "Status Karyawan (ReadOnly)"
                            : mgmtEditingUser
                            ? "Edit Akun Karyawan"
                            : "Tambah Karyawan Baru"}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {isMgmtReadOnly
                            ? "Informasi hak akses akun pengguna"
                            : "Isi detail akun untuk login bersamaan"}
                        </p>
                      </div>
                    </div>

                    {isMgmtReadOnly ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-amber-900 space-y-2.5 shadow-xs">
                          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800">
                            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Akses Read-Only ({getRoleLabel(userRole)})</span>
                          </div>
                          <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
                            Sebagai <strong>{getRoleLabel(userRole)}</strong>, Anda memiliki hak akses <strong>Read-Only</strong> untuk memantau daftar dan status login karyawan secara real-time.
                          </p>
                          <p className="text-[11px] text-amber-700/80 font-sans border-t border-amber-200/60 pt-2">
                            Pendaftaran, perubahan role, dan penghapusan akun karyawan hanya dapat dilakukan oleh Admin.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveUser} className="space-y-4">
                        {mgmtError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{mgmtError}</span>
                          </div>
                        )}

                        {mgmtSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
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
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200/60 text-[10px] text-gray-400 font-medium font-sans">
                    Setiap akun yang didaftarkan akan tersinkronisasi secara real-time ke semua komputer karyawan yang sedang aktif.
                  </div>
                </div>

                {/* Right side: Table showing registered & online users */}
                <div className="w-full md:w-7/12 p-6 flex flex-col justify-between overflow-hidden bg-white">
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header title & close button */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-600" /> Kelola &amp; Status Karyawan
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Monitoring karyawan yang sedang login/online secara real-time
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUserMgmtModal(false)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Status Summary Banner */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total User</span>
                        <span className="text-base font-extrabold text-slate-800">{userList.length}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-100 flex flex-col">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Sedang Login
                        </span>
                        <span className="text-base font-extrabold text-emerald-700">
                          {userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length} Online
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Offline</span>
                        <span className="text-base font-extrabold text-slate-600">
                          {Math.max(
                            0,
                            userList.length -
                              userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Filter tabs & Search bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
                      {/* Status filter tabs */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setUserFilterStatus("all")}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            userFilterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Semua ({userList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserFilterStatus("online")}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            userFilterStatus === "online" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:text-emerald-800"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          Online ({userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserFilterStatus("offline")}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            userFilterStatus === "offline" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Offline ({Math.max(0, userList.length - userList.filter((u) => u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase())).length)})
                        </button>
                      </div>

                      {/* Search query */}
                      <input
                        type="text"
                        placeholder="Cari karyawan..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-36 font-medium"
                      />
                    </div>

                    {/* Users Table */}
                    <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-3.5 py-2.5">Nama PIC / Karyawan</th>
                            <th className="px-3.5 py-2.5">Username</th>
                            <th className="px-3.5 py-2.5">Status Login</th>
                            <th className="px-3.5 py-2.5">Role</th>
                            <th className="px-3.5 py-2.5 text-right">{isMgmtReadOnly ? "Status Akses" : "Aksi"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {userList
                            .filter((u) => {
                              const isOnline = Boolean(u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase()));
                              if (userFilterStatus === "online" && !isOnline) return false;
                              if (userFilterStatus === "offline" && isOnline) return false;
                              if (userSearchQuery.trim()) {
                                const q = userSearchQuery.toLowerCase().trim();
                                const m1 = u.fullName.toLowerCase().includes(q);
                                const m2 = u.username.toLowerCase().includes(q);
                                const m3 = u.role.toLowerCase().includes(q);
                                if (!m1 && !m2 && !m3) return false;
                              }
                              return true;
                            })
                            .map((u) => {
                              const isOnline = Boolean(u.isOnline || (currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase()));
                              const isMe = currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase();
                              return (
                                <tr key={u.username} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-3.5 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-gray-900">{u.fullName}</span>
                                      {isMe && (
                                        <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-md">
                                          Anda
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-gray-600 font-medium text-[11px]">{u.username}</td>
                                  <td className="px-3.5 py-2.5">
                                    {isOnline ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                        <span className="relative flex h-2 w-2">
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Online
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                        Offline
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        u.role === "direktur" || u.role === "user"
                                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                          : "bg-blue-50 text-blue-700 border border-blue-100"
                                      }`}
                                    >
                                      {getRoleLabel(u.role)}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right">
                                    {isMgmtReadOnly ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md justify-end ml-auto">
                                        <Lock className="w-3 h-3 text-slate-400" /> ReadOnly
                                      </span>
                                    ) : (
                                      <div className="inline-flex gap-1 justify-end">
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
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

              <div className="bg-gray-50 p-3 mt-3 rounded-2xl flex items-center justify-between text-[10px] text-gray-500 border border-gray-100 font-sans">
                <span>Indikator hijau menunjukkan karyawan yang saat ini sedang aktif membuka aplikasi.</span>
                <button
                  type="button"
                  onClick={() => setShowUserMgmtModal(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-[10px] transition-all cursor-pointer shadow-xs"
                >
                  Tutup Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })()
  )}

      {/* COMPANY LOGO UPLOAD MODAL */}
      <CompanyLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        customLogo={customLogoMCJ}
        customLogoEJT={customLogoEJT}
        onSaveLogo={handleSaveLogo}
      />

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

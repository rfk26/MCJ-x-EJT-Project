/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, ProjectStatus, Category, ActivityLog } from "../types";
import { CATEGORIES } from "../data";
import { TrendingUp, TrendingDown, Landmark, Wallet, AlertTriangle, FileSpreadsheet, Percent, BarChart3, Clock, CheckSquare, Plus, ShoppingBag, Send, Receipt, FileText, Activity, Filter, X, Calendar, Search, Printer, Download, Coins } from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface DashboardProps {
  projects: Project[];
  transactions: Transaction[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  activities?: ActivityLog[];
}

export default function Dashboard({
  projects,
  transactions,
  selectedProjectId,
  setSelectedProjectId,
  setActiveTab,
  activities = [],
}: DashboardProps) {
  const [barChartFilter, setBarChartFilter] = React.useState<string>("all");

  const [activityTypeFilter, setActivityTypeFilter] = React.useState<string>("all");
  const [activityStartDate, setActivityStartDate] = React.useState<string>("");
  const [activityEndDate, setActivityEndDate] = React.useState<string>("");
  const [showAuditModal, setShowAuditModal] = React.useState<boolean>(false);
  const [auditSearchQuery, setAuditSearchQuery] = React.useState<string>("");

  const getFilteredActivitiesList = (activityList: ActivityLog[]) => {
    let list = selectedProjectId === "all"
      ? activityList
      : activityList.filter(act => !act.projectId || act.projectId === selectedProjectId);

    if (activityTypeFilter !== "all") {
      list = list.filter((act) => {
        if (activityTypeFilter === "po") {
          return act.type === "po";
        }
        if (activityTypeFilter === "gaji") {
          const isExpense = act.type === "petycash_expense";
          const hasGajiKw = act.action.toLowerCase().includes("gaji") || 
                            act.action.toLowerCase().includes("penggajian") || 
                            act.description.toLowerCase().includes("gaji") || 
                            act.description.toLowerCase().includes("penggajian") ||
                            act.action.toLowerCase().includes("slip");
          return isExpense && hasGajiKw;
        }
        if (activityTypeFilter === "petycash") {
          if (act.type === "petycash_request") return true;
          if (act.type === "petycash_expense") {
            const hasGajiKw = act.action.toLowerCase().includes("gaji") || 
                              act.action.toLowerCase().includes("penggajian") || 
                              act.description.toLowerCase().includes("gaji") || 
                              act.description.toLowerCase().includes("penggajian") ||
                              act.action.toLowerCase().includes("slip");
            return !hasGajiKw;
          }
          return false;
        }
        if (activityTypeFilter === "invoice") {
          return act.type === "invoice";
        }
        if (activityTypeFilter === "project") {
          return act.type === "project";
        }
        return true;
      });
    }

    if (activityStartDate) {
      list = list.filter((act) => act.date >= activityStartDate);
    }
    if (activityEndDate) {
      list = list.filter((act) => act.date <= activityEndDate);
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      list = list.filter(
        (act) =>
          act.pic.toLowerCase().includes(q) ||
          act.action.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatShortVal = (val: number) => {
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(1) + " M";
    }
    if (val >= 1000000) {
      return (val / 1000000).toFixed(0) + " Jt";
    }
    return val > 0 ? (val / 1000).toFixed(0) + " K" : "0";
  };

  const getProjectContractValue = (p: Project) => {
    if (p.customContractItems && p.customContractItems.length > 0) {
      return p.customContractItems.reduce((s, item) => s + Number(item.value || 0), 0);
    }
    return (p.contractValue?.piping || 0) +
           (p.contractValue?.electrical || 0) +
           (p.contractValue?.mechanical || 0) +
           (p.contractValue?.scafolder || 0) +
           (p.contractValue?.welder || 0);
  };

  // Switch between Consolidated (all) and Individual Project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Filter transactions for calculations
  const filteredTxs =
    selectedProjectId === "all"
      ? transactions
      : transactions.filter((t) => t.projectId === selectedProjectId);

  // CALCULATE KEY METRICS
  // Total Contract value (excluding Ppn/Pph first for raw, or net)
  const totalContract = projects
    .filter((p) => selectedProjectId === "all" || p.id === selectedProjectId)
    .filter((p) => p.status !== ProjectStatus.CANCEL)
    .reduce((sum, p) => sum + getProjectContractValue(p), 0);

  // Taxes
  const totalPpnRaw = projects
    .filter((p) => selectedProjectId === "all" || p.id === selectedProjectId)
    .filter((p) => p.status !== ProjectStatus.CANCEL)
    .reduce((sum, p) => {
      const base = getProjectContractValue(p);
      const isHoOrEjt = p.name.toUpperCase().includes("HO") || (p.code && p.code.toUpperCase().includes("HO")) || p.name.toUpperCase().includes("EJT");
      const rate = isHoOrEjt ? ((p.ppnPercent === 11 || p.ppnPercent === undefined) ? 0 : p.ppnPercent) : (p.ppnPercent !== undefined ? p.ppnPercent : 11);
      return sum + (base * (rate / 100));
    }, 0);

  const ppnSupplierSpending = filteredTxs
    .filter((t) => t.category && t.category.toLowerCase() === "ppn 11% supplier" && t.type === "PetyCash")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPpn = Math.max(0, totalPpnRaw - ppnSupplierSpending);

  const totalPph = projects
    .filter((p) => selectedProjectId === "all" || p.id === selectedProjectId)
    .filter((p) => p.status !== ProjectStatus.CANCEL)
    .reduce((sum, p) => {
      const base = getProjectContractValue(p);
      const isHoOrEjt = p.name.toUpperCase().includes("HO") || (p.code && p.code.toUpperCase().includes("HO")) || p.name.toUpperCase().includes("EJT");
      const rate = isHoOrEjt ? ((p.pphPercent === 4 || p.pphPercent === undefined) ? 0 : p.pphPercent) : (p.pphPercent !== undefined ? p.pphPercent : 4);
      return sum + (base * (rate / 100));
    }, 0);
  const totalNetContract = totalContract + totalPpn - totalPph;

  // Actual Expenditures (type: PetyCash only)
  const totalSpending = filteredTxs
    .filter((t) => t.type === "PetyCash")
    .reduce((sum, t) => sum + t.amount, 0);

  // Petty Cash portion vs PO portion
  const petyCashSum = filteredTxs.filter((t) => t.type === "PetyCash").reduce((s, t) => s + t.amount, 0);
  const poSum = filteredTxs.filter((t) => t.type === "PO").reduce((s, t) => s + t.amount, 0);

  // Income Invoice (type: Invoice)
  const totalInvoiced = filteredTxs
    .filter((t) => t.type === "Invoice")
    .reduce((sum, t) => sum + t.amount, 0);

  // Net Profit & margin %
  const netProfit = totalNetContract - totalSpending;
  const realizedProfitMargin = totalNetContract > 0 ? (netProfit / totalNetContract) * 100 : 0;
  const expectedProfitPercent = currentProject ? currentProject.expectedProfitPercent : 35;

  // BUDGET ALERTS CALCULATION FOR CURRENT SCOPE
  const getBudgetRatio = () => {
    if (totalContract === 0) return 0;
    return (totalSpending / totalContract) * 100;
  };
  const spendRatio = getBudgetRatio();

  // CATEGORY-WISE SPENDING PREPARATION FOR SVG CHART
  const getCategorySpending = () => {
    const data = CATEGORIES.map((cat) => {
      const sum = filteredTxs
        .filter((t) => t.category === cat && t.type === "PetyCash")
        .reduce((s, t) => s + t.amount, 0);
      return { category: cat, total: sum };
    })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total); // Highest spending first

    return data;
  };
  const categorySpending = getCategorySpending();

  // MONTHLY GAJI & OTHER PETY CASH TRENDS FOR SVG CHART
  const getMonthlyTrend = () => {
    const monthlySum = months.map((month, idx) => {
      const sum = filteredTxs
        .filter((t) => {
          const txDate = new Date(t.date);
          return txDate.getMonth() === idx && t.type === "PetyCash";
        })
        .reduce((s, t) => s + t.amount, 0);
      return { month, total: sum };
    });

    // Trim list to show only months with values plus nearby ones
    const activeMonths = monthlySum.filter((m) => m.total > 0);
    if (activeMonths.length === 0) {
      return monthlySum.slice(2, 6); // March to June default
    }
    return monthlySum.slice(2, 7); // March to July
  };
  const monthlyTrend = getMonthlyTrend();

  // PROJECT-WISE BUDGET COMPARISON DATA FOR THE NEW BAR CHART
  const projectBudgetData = React.useMemo(() => {
    return projects
      .filter((p) => p.status !== ProjectStatus.CANCEL)
      .map((p) => {
        const contractVal = getProjectContractValue(p);
        const spending = transactions
          .filter((t) => t.projectId === p.id && t.type === "PetyCash")
          .reduce((sum, t) => sum + t.amount, 0);
        
        const ratio = contractVal > 0 ? (spending / contractVal) * 100 : 0;
        const isOverBudget = spending > contractVal;
        const isNearingThreshold = ratio >= (p.budgetThresholdPercent || 85);

        return {
          id: p.id,
          code: p.code,
          name: p.name,
          contractVal,
          spending,
          ratio,
          isOverBudget,
          isNearingThreshold,
          threshold: p.budgetThresholdPercent || 85,
        };
      });
  }, [projects, transactions]);

  const filteredProjectBudgetData = React.useMemo(() => {
    if (barChartFilter === "all") {
      return projectBudgetData;
    }
    return projectBudgetData.filter((d) => d.id === barChartFilter);
  }, [projectBudgetData, barChartFilter]);

  // Recent transactions list
  const recentTxs = filteredTxs.slice(0, 5);

  // COMPANY-LEVEL CALCULATIONS
  const companyAnalytics = React.useMemo(() => {
    const baseCompanies = ["CV. Mandiri Cipta Jaya", "PT. Elqia Jaya Teknik"];
    const foundCompanies = new Set<string>(baseCompanies);
    
    projects.forEach((p) => {
      if (p.company) foundCompanies.add(p.company);
    });
    transactions.forEach((t) => {
      if (t.company) foundCompanies.add(t.company);
    });

    return Array.from(foundCompanies).map((compName) => {
      // 1. Get projects for this company
      const compProjects = projects.filter(
        (p) => p.company === compName && p.status !== ProjectStatus.CANCEL
      );

      // 2. Total contract value
      const contractValue = compProjects.reduce((sum, p) => sum + getProjectContractValue(p), 0);

      const compPpnSupplierSpending = transactions
        .filter((t) => {
          if (t.type !== "PetyCash") return false;
          if (t.category && t.category.toLowerCase() !== "ppn 11% supplier") return false;
          if (t.company) return t.company === compName;
          const proj = projects.find((p) => p.id === t.projectId);
          return proj?.company === compName;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const compPpnRaw = compProjects.reduce((sum, p) => {
        const base = getProjectContractValue(p);
        const isHoOrEjt = p.name.toUpperCase().includes("HO") || (p.code && p.code.toUpperCase().includes("HO")) || p.name.toUpperCase().includes("EJT");
        const rate = isHoOrEjt ? ((p.ppnPercent === 11 || p.ppnPercent === undefined) ? 0 : p.ppnPercent) : (p.ppnPercent !== undefined ? p.ppnPercent : 11);
        return sum + (base * (rate / 100));
      }, 0);

      const ppn = Math.max(0, compPpnRaw - compPpnSupplierSpending);
      const pph = compProjects.reduce((sum, p) => {
        const base = getProjectContractValue(p);
        const isHoOrEjt = p.name.toUpperCase().includes("HO") || (p.code && p.code.toUpperCase().includes("HO")) || p.name.toUpperCase().includes("EJT");
        const rate = isHoOrEjt ? ((p.pphPercent === 4 || p.pphPercent === undefined) ? 0 : p.pphPercent) : (p.pphPercent !== undefined ? p.pphPercent : 4);
        return sum + (base * (rate / 100));
      }, 0);
      const netContract = contractValue + ppn - pph;

      // 3. Total spending for this company's projects/transactions (only Petty Cash)
      const spending = transactions
        .filter((t) => {
          if (t.type !== "PetyCash") return false;
          if (t.company) return t.company === compName;
          const proj = projects.find((p) => p.id === t.projectId);
          return proj?.company === compName;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // 4. Invoiced amount for this company
      const invoiced = transactions
        .filter((t) => {
          if (t.type !== "Invoice") return false;
          if (t.company) return t.company === compName;
          const proj = projects.find((p) => p.id === t.projectId);
          return proj?.company === compName;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const profit = netContract - spending;
      const profitMargin = netContract > 0 ? (profit / netContract) * 100 : 0;
      const spendRatio = contractValue > 0 ? (spending / contractValue) * 100 : 0;

      return {
        name: compName,
        projectCount: compProjects.length,
        contractValue,
        netContract,
        spending,
        invoiced,
        profit,
        profitMargin,
        spendRatio,
      };
    });
  }, [projects, transactions]);

  return (
    <div className="space-y-6 font-sans pb-12" id="dashboard-main-section">
      {/* SCOPE DROPDOWN SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
         <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Lingkup Proyek</span>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-gray-500" />
            {selectedProjectId === "all" ? "Konsolidasi Semua Kontrak" : `Proyek: ${currentProject?.name}`}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Pilih Tampilan:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 font-sans cursor-pointer focus:bg-white"
          >
            <option value="all">Semua Proyek (Konsolidasi)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CONTRACT VALUE */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Nilai Kontrak</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Kotor</span>
          </div>
          <div className="space-y-1">
            <span className="text-xl font-bold text-gray-900 block font-mono">{formatIDR(totalContract)}</span>
            <span className="text-[10px] text-gray-400 block font-mono">Ppn: {formatIDR(totalPpn)} | Pph: {formatIDR(totalPph)}</span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
            <span>Kontrak Bersih:</span>
            <strong className="text-slate-800 font-mono">{formatIDR(totalNetContract)}</strong>
          </div>
        </div>

        {/* ACTUAL SPENDING */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pengeluaran Real-Time</span>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Actual</span>
          </div>
          <div className="space-y-1">
            <span className="text-xl font-bold text-red-600 block font-mono">{formatIDR(totalSpending)}</span>
            <span className="text-[10px] text-gray-400 block font-mono">Petty Cash: {formatIDR(petyCashSum)} (PO Kontrak: {formatIDR(poSum)})</span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>Rasio Penggunaan Anggaran Kontrak:</span>
              <strong className={spendRatio >= (currentProject?.budgetThresholdPercent || 85) ? "text-amber-500" : "text-emerald-600"}>
                {spendRatio.toFixed(1)}%
              </strong>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  spendRatio >= 100
                    ? "bg-red-600"
                    : spendRatio >= (currentProject?.budgetThresholdPercent || 85)
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(spendRatio, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* INVOICED REVENUE */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Realisasi Invoice Cair</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Invoiced</span>
          </div>
          <div className="space-y-1">
            <span className="text-xl font-bold text-emerald-600 block font-mono">{formatIDR(totalInvoiced)}</span>
            <span className="text-[10px] text-gray-400 block font-mono">
              Unbilled: {formatIDR(Math.max(0, totalNetContract - totalInvoiced))}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
            <span>Rasio Cair:</span>
            <strong className="text-slate-800">
              {(totalNetContract > 0 ? (totalInvoiced / totalNetContract) * 100 : 0).toFixed(1)}% Kontrak
            </strong>
          </div>
        </div>

        {/* PROFIT & MARGIN */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keuntungan Bersih (Audit)</span>
            {realizedProfitMargin >= expectedProfitPercent ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Di Atas Target
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" /> Di Bawah Target
              </span>
            )}
          </div>
          <div className="space-y-1">
            <span className={`text-xl font-bold block font-mono ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {formatIDR(netProfit)}
            </span>
            <span className="text-[10px] text-gray-400 block font-mono">
              Margin Aktual: <strong>{realizedProfitMargin.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
            <span>Rencana Target Profit:</span>
            <strong className="text-slate-800 font-mono">{expectedProfitPercent}%</strong>
          </div>
        </div>
      </div>

      {/* DETAILED WORKFLOW ALERTS BANNER FOR SPECIFIC PROJECT */}
      {selectedProjectId !== "all" && spendRatio >= (currentProject?.budgetThresholdPercent || 85) && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3.5 text-xs leading-relaxed">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider">Pemberitahuan Otomatis: Pengeluaran Mendekati Batas Maksimal!</h4>
            <p>
              Proyek <strong>{currentProject?.name}</strong> saat ini telah menghabiskan anggaran sebesar <strong>{formatIDR(totalSpending)}</strong> yang merupakan <strong>{spendRatio.toFixed(1)}%</strong> dari total nilai kontrak dasar proyek.
            </p>
            <p className="font-semibold">
              Batas alarm ditentukan pada <strong>{currentProject?.budgetThresholdPercent}%</strong>. Harap lakukan peninjauan buku pety cash dan PO material untuk menghindari over-budget!
            </p>
          </div>
        </div>
      )}

      {/* VISUAL CHARTS SECTION (SVG HAND-CRAFTED CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TREND TREND MONTHLY EXPENDITURES AREA CHART */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-300">
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tren Realisasi Biaya Bulanan</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Akumulasi pengeluaran Petty Cash &amp; PO berdasarkan bulan kejadian.</p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 500 }} stroke="#94a3b8" />
                <YAxis tickFormatter={(val) => formatShortVal(val)} tick={{ fontSize: 9, fontWeight: 500 }} stroke="#94a3b8" />
                <Tooltip 
                  formatter={(val: number) => [formatIDR(val), "Pengeluaran"]}
                  contentStyle={{ 
                    backgroundColor: "#1e293b", 
                    borderColor: "#334155", 
                    borderRadius: "12px", 
                    fontSize: "11px",
                    color: "#f8fafc",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  itemStyle={{ color: "#f1f5f9" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CATEGORY EXPENDITURES HORIZONTAL BAR CHART */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Distribusi Biaya Berdasarkan Kategori</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Urutan pengeluaran terbesar dari buku kas pety cash.</p>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl font-mono font-bold uppercase">
              {categorySpending.length} Kategori
            </span>
          </div>

          <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
            {categorySpending.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-gray-400 italic">
                Belum ada transaksi pengeluaran terekam.
              </div>
            ) : (
              categorySpending.slice(0, 7).map((item) => {
                const maxVal = categorySpending[0]?.total || 1;
                const ratio = (item.total / maxVal) * 100;

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="font-mono text-slate-950 dark:text-slate-100 font-bold">{formatIDR(item.total)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-slate-800 dark:bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MONITORING EFISIENSI ANGGARAN PROYEK - BAR CHART COMPARING CONTRACT VS SPENDING */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Monitoring Efisiensi Anggaran per Proyek
            </h3>
            <p className="text-[11px] text-gray-500">
              Perbandingan real-time antara total nilai kontrak dasar dengan realisasi pengeluaran (Petty Cash) untuk setiap proyek aktif.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Filter Tampilan:</span>
              <select
                value={barChartFilter}
                onChange={(e) => setBarChartFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">📊 Gabungan Semua Proyek</option>
                {projects
                  .filter((p) => p.status !== ProjectStatus.CANCEL)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.code} - {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Legend and threshold indicator explanation */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-sm inline-block"></span>
                <span className="font-semibold text-gray-600">Nilai Kontrak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span>
                <span className="font-semibold text-gray-600">Aman</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block"></span>
                <span className="font-semibold text-gray-600">Dekat Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-500 rounded-sm inline-block"></span>
                <span className="font-semibold text-gray-600">Over Budget</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Responsive Bar Chart */}
        {filteredProjectBudgetData.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 italic">
            Belum ada data proyek aktif untuk dibandingkan atau filter salah.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-72 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredProjectBudgetData} margin={{ top: 20, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="code" tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={(val) => formatShortVal(val)} tick={{ fontSize: 9, fontWeight: 600 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatIDR(value), name === "contractVal" ? "Nilai Kontrak" : "Realisasi Biaya"]}
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      borderColor: "#334155", 
                      borderRadius: "12px", 
                      fontSize: "11px",
                      color: "#f8fafc",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                    }}
                    itemStyle={{ color: "#f1f5f9" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Bar dataKey="contractVal" name="Nilai Kontrak" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spending" name="Realisasi Biaya" radius={[4, 4, 0, 0]}>
                    {filteredProjectBudgetData.map((entry, index) => {
                      let barColor = "#10b981"; // Aman
                      if (entry.isOverBudget) {
                        barColor = "#ef4444"; // Over
                      } else if (entry.isNearingThreshold) {
                        barColor = "#f59e0b"; // Warning
                      }
                      return <Cell key={`cell-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Structured Table/Grid of Project Budgets for Deep Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjectBudgetData.map((proj) => {
                let statusBg = "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50";
                let statusLabel = "Aman";
                if (proj.isOverBudget) {
                  statusBg = "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
                  statusLabel = "Kritis (Over Budget)";
                } else if (proj.isNearingThreshold) {
                  statusBg = "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
                  statusLabel = `Warning (>${proj.threshold}%)`;
                }

                return (
                  <div
                    key={proj.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs hover:border-gray-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">{proj.code}</span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-tight line-clamp-1">{proj.name}</h4>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${statusBg}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Nilai Kontrak Dasar:</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatIDR(proj.contractVal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Realisasi Pengeluaran:</span>
                        <span className="font-mono font-semibold text-red-600 dark:text-red-400">{formatIDR(proj.spending)}</span>
                      </div>
                      
                      {/* Micro Progress Bar */}
                      <div className="pt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <span>Rasio Terpakai:</span>
                          <span>{proj.ratio.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              proj.isOverBudget
                                ? "bg-red-500"
                                : proj.isNearingThreshold
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(proj.ratio, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* COMPANY ANALYTICS & GRAPH SECTION */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">Analisis Kinerja & Statistik Perusahaan</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Akumulasi data keuangan dari CV. Mandiri Cipta Jaya dan PT. Elqia Jaya Teknik secara real-time.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block"></span>
              <span className="font-semibold text-gray-600">Kontrak Bersih</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block"></span>
              <span className="font-semibold text-gray-600">Total Pengeluaran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span>
              <span className="font-semibold text-gray-600">Invoice Cair</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid representing CV. Mandiri Cipta Jaya and PT. Elqia Jaya Teknik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {companyAnalytics.map((comp) => {
            const hasProfit = comp.profit >= 0;
            const collectionRatio = comp.netContract > 0 ? (comp.invoiced / comp.netContract) * 100 : 0;

            return (
              <div key={comp.name} className="border border-gray-200 rounded-2xl p-5 bg-slate-50 space-y-4 shadow-xs">
                {/* Company Title Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
                      🏢 {comp.name}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {comp.projectCount} PROYEK AKTIF
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${comp.spendRatio >= 100 ? 'bg-red-50 text-red-700 border border-red-200' : comp.spendRatio >= 85 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {comp.spendRatio.toFixed(1)}% Anggaran
                  </span>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Total Nilai Kontrak */}
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Total Nilai Kontrak</span>
                    <span className="text-sm font-bold text-blue-600 block font-mono">{formatIDR(comp.contractValue)}</span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      Netto (inc. Ppn - Pph): <strong className="text-slate-700 font-mono text-[9px]">{formatIDR(comp.netContract)}</strong>
                    </span>
                  </div>

                  {/* Card 2: Total Pengeluaran */}
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Total Pengeluaran</span>
                    <span className="text-sm font-bold text-red-600 block font-mono">{formatIDR(comp.spending)}</span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      Rasio Terpakai: <strong className="text-slate-700 font-mono text-[9px]">{comp.spendRatio.toFixed(1)}%</strong>
                    </span>
                  </div>

                  {/* Card 3: Realisasi Invoice */}
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Realisasi Invoice Cair</span>
                    <span className="text-sm font-bold text-emerald-600 block font-mono">{formatIDR(comp.invoiced)}</span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      Rasio Pencairan: <strong className="text-slate-700 font-mono text-[9px]">{collectionRatio.toFixed(1)}%</strong>
                    </span>
                  </div>

                  {/* Card 4: Keuntungan Bersih */}
                  <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Estimasi Keuntungan Bersih</span>
                    <span className={`text-sm font-bold block font-mono ${hasProfit ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatIDR(comp.profit)}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      Margin Profit: <strong className="text-slate-700 font-mono text-[9px]">{comp.profitMargin.toFixed(1)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Progress bar of budget usage */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                    <span>Penggunaan Anggaran Kumulatif:</span>
                    <span>{comp.spendRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        comp.spendRatio >= 100
                          ? "bg-red-600"
                          : comp.spendRatio >= 85
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(comp.spendRatio, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPARATIVE VISUAL CHART (WIDESCREEN RENDERING) */}
        <div className="bg-slate-50 border border-gray-250 rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Visualisasi Perbandingan Keuangan Antar Perusahaan</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Grafik perbandingan nilai kontrak bersih, total belanja (aktual), dan realisasi invoice yang dicairkan.</p>
          </div>

          <div className="h-64 relative flex flex-col justify-end">
            <svg className="w-full h-52 overflow-visible" viewBox="0 0 500 200">
              {/* Dynamic Grid Lines & Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const maxVal = Math.max(
                  ...companyAnalytics.map((c) => Math.max(c.netContract, c.spending, c.invoiced)),
                  100000000
                );
                const y = 200 - ratio * 165;
                const labelValue = ratio * maxVal;
                return (
                  <g key={index}>
                    <line
                      x1="0"
                      y1={y}
                      x2="500"
                      y2={y}
                      stroke={index === 0 ? "#e2e8f0" : "#f1f5f9"}
                      strokeWidth={index === 0 ? "1.5" : "1"}
                    />
                    <text
                      x="4"
                      y={y - 4}
                      className="font-mono text-[9px] fill-gray-400 font-medium"
                    >
                      {formatShortVal(labelValue)}
                    </text>
                  </g>
                );
              })}

              {(() => {
                const maxVal = Math.max(
                  ...companyAnalytics.map((c) => Math.max(c.netContract, c.spending, c.invoiced)),
                  100000000
                );

                const totalGroups = companyAnalytics.length;
                const groupWidth = 500 / totalGroups;
                const barWidth = 26;
                const gapBetweenBars = 5;

                return companyAnalytics.map((comp, groupIdx) => {
                  const groupCenterX = (groupIdx * groupWidth) + (groupWidth / 2);

                  const netContractHeight = (comp.netContract / maxVal) * 165;
                  const spendingHeight = (comp.spending / maxVal) * 165;
                  const invoicedHeight = (comp.invoiced / maxVal) * 165;

                  const x1 = groupCenterX - (1.5 * barWidth) - gapBetweenBars;
                  const x2 = groupCenterX - (0.5 * barWidth);
                  const x3 = groupCenterX + (0.5 * barWidth) + gapBetweenBars;

                  return (
                    <g key={comp.name}>
                      {/* Bar 1: Net Contract (Blue) */}
                      <rect
                        x={x1}
                        y={200 - netContractHeight}
                        width={barWidth}
                        height={Math.max(2, netContractHeight)}
                        fill="#3b82f6"
                        rx="3"
                        className="transition-all duration-300 hover:fill-blue-600"
                      />
                      <text
                        x={x1 + barWidth / 2}
                        y={Math.min(190, 200 - netContractHeight - 6)}
                        textAnchor="middle"
                        className="font-mono text-[8.5px] font-bold fill-blue-700"
                      >
                        {comp.netContract > 0 ? formatShortVal(comp.netContract) : "0"}
                      </text>

                      {/* Bar 2: Spending (Red) */}
                      <rect
                        x={x2}
                        y={200 - spendingHeight}
                        width={barWidth}
                        height={Math.max(2, spendingHeight)}
                        fill="#ef4444"
                        rx="3"
                        className="transition-all duration-300 hover:fill-red-600"
                      />
                      <text
                        x={x2 + barWidth / 2}
                        y={Math.min(190, 200 - spendingHeight - 6)}
                        textAnchor="middle"
                        className="font-mono text-[8.5px] font-bold fill-red-600"
                      >
                        {comp.spending > 0 ? formatShortVal(comp.spending) : "0"}
                      </text>

                      {/* Bar 3: Invoiced (Emerald) */}
                      <rect
                        x={x3}
                        y={200 - invoicedHeight}
                        width={barWidth}
                        height={Math.max(2, invoicedHeight)}
                        fill="#10b981"
                        rx="3"
                        className="transition-all duration-300 hover:fill-emerald-600"
                      />
                      <text
                        x={x3 + barWidth / 2}
                        y={Math.min(190, 200 - invoicedHeight - 6)}
                        textAnchor="middle"
                        className="font-mono text-[8.5px] font-bold fill-emerald-600"
                      >
                        {comp.invoiced > 0 ? formatShortVal(comp.invoiced) : "0"}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Labels under the bars group */}
            <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-4">
              {companyAnalytics.map((comp) => (
                <div key={comp.name} className="text-center flex-1 truncate px-2" title={comp.name}>
                  🏢 {comp.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM WORKFLOW: RECENT TRANSACTIONS FEED, ACTIVITY HISTORY & ACTIVE PROJECT WARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT FEED */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Log Transaksi Terakhir</h3>
            <button
              onClick={() => setActiveTab("pety_cash_expense")}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Lihat Kas
            </button>
          </div>

          <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
            {recentTxs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">
                Belum ada transaksi terekam untuk lingkup ini.
              </div>
            ) : (
              recentTxs.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[100px]">
                        {tx.petyCashNo || tx.invoiceNo || "N/A"}
                      </span>
                      <span className="text-gray-400 text-[10px]">{tx.date}</span>
                    </div>
                    <p className="font-semibold text-slate-950 line-clamp-1">{tx.description}</p>
                    <p className="text-[10px] text-gray-400 truncate">PIC: {tx.pic} | Kategori: {tx.category}</p>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    <span className={`font-bold font-mono ${tx.type === "Invoice" ? "text-emerald-600" : "text-gray-900"}`}>
                      {tx.type === "Invoice" ? "+" : "-"} {formatIDR(tx.amount)}
                    </span>
                    <p className="text-[9px] text-gray-400">{tx.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIWAYAT AKTIVITAS KARYAWAN */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" /> Riwayat Aktivitas
            </h3>
            <button
              onClick={() => setShowAuditModal(true)}
              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer border border-blue-100"
            >
              <Filter className="w-2.5 h-2.5" /> Mode Audit
            </button>
          </div>

          {/* Quick Inline Filters */}
          <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 space-y-2 text-[10px]">
            <div className="flex items-center justify-between font-bold text-slate-700 border-b border-gray-200/60 pb-1">
              <span className="uppercase text-[9px] text-gray-400 tracking-wider">Filter Cepat</span>
              {(activityTypeFilter !== "all" || activityStartDate !== "" || activityEndDate !== "") && (
                <button
                  onClick={() => {
                    setActivityTypeFilter("all");
                    setActivityStartDate("");
                    setActivityEndDate("");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" /> Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 font-semibold text-gray-700 text-[10px]"
              >
                <option value="all">Semua Tipe Transaksi</option>
                <option value="po">Purchase Order (PO)</option>
                <option value="gaji">Gaji Karyawan</option>
                <option value="petycash">Petty Cash</option>
                <option value="invoice">Invoice / Tagihan</option>
                <option value="project">Manajemen Proyek</option>
              </select>

              <div className="grid grid-cols-2 gap-1">
                <input
                  type="date"
                  value={activityStartDate}
                  onChange={(e) => setActivityStartDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 font-semibold text-gray-700 text-[9px]"
                  placeholder="Mulai"
                />
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => setActivityEndDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded px-1 py-0.5 font-semibold text-gray-700 text-[9px]"
                  placeholder="Akhir"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {(() => {
              const filteredActivities = getFilteredActivitiesList(activities);

              if (filteredActivities.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-400 text-xs italic">
                    Tidak ada aktivitas cocok dengan filter ini.
                  </div>
                );
              }

              return filteredActivities.slice(0, 10).map((act) => {
                let icon = <FileText className="w-3.5 h-3.5" />;
                let colorClass = "bg-indigo-50 text-indigo-600 border border-indigo-100";
                
                if (act.type === "po") {
                  icon = <ShoppingBag className="w-3.5 h-3.5" />;
                  colorClass = "bg-amber-50 text-amber-600 border border-amber-100";
                } else if (act.type === "petycash_request") {
                  icon = <Send className="w-3.5 h-3.5" />;
                  colorClass = "bg-purple-50 text-purple-600 border border-purple-100";
                } else if (act.type === "petycash_expense") {
                  const isGaji = act.action.toLowerCase().includes("gaji") || 
                                 act.action.toLowerCase().includes("penggajian") || 
                                 act.description.toLowerCase().includes("gaji") || 
                                 act.description.toLowerCase().includes("penggajian") ||
                                 act.action.toLowerCase().includes("slip");
                  if (isGaji) {
                    icon = <Coins className="w-3.5 h-3.5 text-rose-600" />;
                    colorClass = "bg-rose-50 text-rose-600 border border-rose-100";
                  } else {
                    icon = <Receipt className="w-3.5 h-3.5" />;
                    colorClass = "bg-rose-50 text-rose-600 border border-rose-100";
                  }
                } else if (act.type === "invoice") {
                  icon = <Landmark className="w-3.5 h-3.5" />;
                  colorClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                }

                return (
                  <div key={act.id} className="flex gap-3 text-xs border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-800 truncate" title={act.pic}>
                          {act.pic}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                          {act.date}
                        </span>
                      </div>
                      <p className="font-bold text-[11px] text-slate-900 leading-tight">
                        {act.action}
                      </p>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans line-clamp-2">
                        {act.description}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ALERTS DECK */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-blue-600" /> Pengawasan Alarm Anggaran
            </h3>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {projects
              .filter((p) => p.status !== ProjectStatus.CANCEL)
              .map((p) => {
                const contract = getProjectContractValue(p);

                const spend = transactions
                  .filter((t) => t.projectId === p.id && t.type === "PetyCash")
                  .reduce((sum, t) => sum + t.amount, 0);

                const ratio = contract > 0 ? (spend / contract) * 100 : 0;
                const isOver = ratio >= 100;
                const isWarning = ratio >= p.budgetThresholdPercent;

                if (!isWarning && !isOver) return null;

                return (
                  <div
                    key={p.id}
                    className={`p-3 border rounded-xl space-y-2 ${
                      isOver ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider block truncate max-w-[150px]">
                        {p.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          isOver ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isOver ? "KRITIS" : "DEKAT LIMIT"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Kontrak: {formatIDR(contract)}</span>
                        <span>Aktual: {formatIDR(spend)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-800">
                        <span>Realisasi Biaya: {ratio.toFixed(1)}%</span>
                        <span>Batas Alarm: {p.budgetThresholdPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* If no alerts */}
            {projects.filter((p) => {
              const contract = getProjectContractValue(p);

              const spend = transactions
                .filter((t) => t.projectId === p.id && t.type === "PetyCash")
                .reduce((sum, t) => sum + t.amount, 0);

              const ratio = contract > 0 ? (spend / contract) * 100 : 0;
              return ratio >= p.budgetThresholdPercent || ratio >= 100;
            }).length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400 italic">
                Semua proyek beroperasi dalam batas anggaran yang aman.✓
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab("projects")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer text-center block"
            >
              Konfigurasi Ulang Alarm Proyek
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT HISTORIS MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" /> Audit Historis Aktivitas Proyek (Jejak Log)
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Laporan jejak audit resmi transaksi dan aktivitas operasional untuk jajaran direksi.
                </p>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filter Controls */}
            <div className="bg-slate-50 p-5 border-b border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 text-xs">
              {/* Search */}
              <div className="space-y-1">
                <label className="font-extrabold text-gray-500 uppercase text-[9px] tracking-wider block">
                  Cari PIC / Aktivitas / Deskripsi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari PIC, tindakan, atau nomor..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tipe Transaksi Select */}
              <div className="space-y-1">
                <label className="font-extrabold text-gray-500 uppercase text-[9px] tracking-wider block">
                  Tipe Transaksi
                </label>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-xs"
                >
                  <option value="all">Semua Tipe Transaksi / Aktivitas</option>
                  <option value="po">Purchase Order (PO)</option>
                  <option value="gaji">Gaji / Penggajian Karyawan</option>
                  <option value="petycash">Petty Cash (Kas Kecil)</option>
                  <option value="invoice">Invoice / Tagihan</option>
                  <option value="project">Manajemen Proyek</option>
                </select>
              </div>

              {/* Date Range Start */}
              <div className="space-y-1">
                <label className="font-extrabold text-gray-500 uppercase text-[9px] tracking-wider block">
                  Dari Tanggal
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={activityStartDate}
                    onChange={(e) => setActivityStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Date Range End */}
              <div className="space-y-1">
                <label className="font-extrabold text-gray-500 uppercase text-[9px] tracking-wider block">
                  Hingga Tanggal
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={activityEndDate}
                    onChange={(e) => setActivityEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Clear Filter Bar */}
            {(activityTypeFilter !== "all" || activityStartDate !== "" || activityEndDate !== "" || auditSearchQuery !== "") && (
              <div className="bg-blue-50 px-5 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800 shrink-0">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filter Aktif Berhasil Diterapkan. Menunjukkan hasil kustomisasi.</span>
                </div>
                <button
                  onClick={() => {
                    setActivityTypeFilter("all");
                    setActivityStartDate("");
                    setActivityEndDate("");
                    setAuditSearchQuery("");
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1 text-xs"
                >
                  <X className="w-3 h-3" /> Bersihkan Filter
                </button>
              </div>
            )}

            {/* Modal Main Content (Log list/table) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5" id="printable-audit-section">
              {(() => {
                const filtered = getFilteredActivitiesList(activities);

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-gray-400 text-sm italic space-y-2">
                      <Filter className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="font-semibold text-gray-500">Tidak ditemukan riwayat aktivitas yang cocok dengan filter atau kueri pencarian Anda.</p>
                      <p className="text-[11px] text-gray-400 font-normal">Cobalah mengubah filter pencarian Anda atau memilih proyek lain.</p>
                    </div>
                  );
                }

                return (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                          <th className="p-3.5 w-24">Tanggal</th>
                          <th className="p-3.5 w-32">Kategori</th>
                          <th className="p-3.5 w-32">PIC / Aktor</th>
                          <th className="p-3.5">Tindakan / Aktivitas</th>
                          <th className="p-3.5">Deskripsi Detail</th>
                          <th className="p-3.5 w-44">Proyek Terkait</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((act) => {
                          let typeLabel = "Proyek";
                          let typeColor = "bg-indigo-50 text-indigo-700 border border-indigo-100";
                          
                          if (act.type === "po") {
                            typeLabel = "Purchase Order";
                            typeColor = "bg-amber-50 text-amber-700 border border-amber-100";
                          } else if (act.type === "petycash_request") {
                            typeLabel = "Kas Kecil (Pengajuan)";
                            typeColor = "bg-purple-50 text-purple-700 border border-purple-100";
                          } else if (act.type === "petycash_expense") {
                            const isGaji = act.action.toLowerCase().includes("gaji") || 
                                           act.action.toLowerCase().includes("penggajian") || 
                                           act.description.toLowerCase().includes("gaji") || 
                                           act.description.toLowerCase().includes("penggajian") ||
                                           act.action.toLowerCase().includes("slip");
                            if (isGaji) {
                              typeLabel = "Gaji Karyawan";
                              typeColor = "bg-rose-100 text-rose-800 border border-rose-200 font-bold";
                            } else {
                              typeLabel = "Kas Kecil (Pengeluaran)";
                              typeColor = "bg-rose-50 text-rose-700 border border-rose-100";
                            }
                          } else if (act.type === "invoice") {
                            typeLabel = "Invoice / Tagihan";
                            typeColor = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                          }

                          const linkedProj = projects.find((p) => p.id === act.projectId);

                          return (
                            <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-mono font-semibold text-gray-500 whitespace-nowrap">
                                {act.date}
                              </td>
                              <td className="p-3.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor}`}>
                                  {typeLabel}
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-gray-900 truncate max-w-[120px]" title={act.pic}>
                                👤 {act.pic}
                              </td>
                              <td className="p-3.5 font-extrabold text-blue-900">
                                {act.action}
                              </td>
                              <td className="p-3.5 text-gray-600 font-sans leading-relaxed break-words max-w-xs">
                                {act.description}
                              </td>
                              <td className="p-3.5 font-semibold text-slate-700 max-w-[150px] truncate" title={linkedProj ? linkedProj.name : "Sistem Umum"}>
                                🏢 {linkedProj ? linkedProj.name : "Sistem / Umum"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-gray-500 font-mono">
                Total data audit: {getFilteredActivitiesList(activities).length} dari {activities.length} aktivitas terekam.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printable = document.getElementById("printable-audit-section");
                    if (!printable) return;
                    const printWindow = window.open("", "_blank");
                    if (!printWindow) return;

                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Audit_Historis_Aktivitas_${selectedProjectId}_${Date.now()}</title>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; font-size: 11px; color: #333; }
                            h2 { text-transform: uppercase; font-size: 16px; margin-bottom: 2px; color: #0f172a; border-bottom: 2px solid #000; padding-bottom: 5px; }
                            h4 { font-size: 10px; font-weight: normal; color: #64748b; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; text-align: left; font-size: 10px; text-transform: uppercase; }
                            td { border: 1px solid #e2e8f0; padding: 8px; line-height: 1.4; }
                            .badge { display: inline-block; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase; border: 1px solid #cbd5e1; background: #f8fafc; }
                            .footer { margin-top: 40px; font-size: 9px; color: #94a3b8; font-family: monospace; display: flex; justify-content: space-between; }
                            .signature-section { margin-top: 60px; display: grid; grid-template-cols: repeat(3, 1fr); gap: 40px; text-align: center; font-size: 11px; }
                            .sig-box { margin-top: 50px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
                          </style>
                        </head>
                        <body>
                          <h2>AUDIT HISTORIS AKTIVITAS PROYEK</h2>
                          <h4>Dokumen Resmi Peninjauan Direksi | Dicetak pada: ${new Date().toLocaleString("id-ID")}</h4>
                          <table>
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Kategori</th>
                                <th>PIC / Aktor</th>
                                <th>Aktivitas</th>
                                <th>Deskripsi Detail</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${getFilteredActivitiesList(activities).map(act => {
                                let typeLabel = "Proyek";
                                if (act.type === "po") typeLabel = "PO";
                                else if (act.type === "petycash_request") typeLabel = "Kas Kecil (R)";
                                else if (act.type === "petycash_expense") {
                                  const isGaji = act.action.toLowerCase().includes("gaji") || act.action.toLowerCase().includes("penggajian") || act.action.toLowerCase().includes("slip");
                                  typeLabel = isGaji ? "Gaji" : "Kas Kecil (E)";
                                }
                                else if (act.type === "invoice") typeLabel = "Invoice";

                                return `
                                  <tr>
                                    <td style="font-family: monospace; font-weight: bold;">${act.date}</td>
                                    <td><span class="badge">${typeLabel}</span></td>
                                    <td><strong>${act.pic}</strong></td>
                                    <td style="color: #1e3a8a; font-weight: bold;">${act.action}</td>
                                    <td>${act.description}</td>
                                  </tr>
                                `;
                              }).join("")}
                            </tbody>
                          </table>

                          <div class="signature-section">
                            <div>
                              <p>Disiapkan Oleh,</p>
                              <div class="sig-box">Pengawas Lapangan</div>
                            </div>
                            <div>
                              <p>Diverifikasi Oleh,</p>
                              <div class="sig-box">Project Manager</div>
                            </div>
                            <div>
                              <p>Disetujui &amp; Disahkan Oleh,</p>
                              <div class="sig-box">Direksi Utama</div>
                            </div>
                          </div>

                          <div class="footer">
                            <span>Audit Log ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                            <span>Halaman 1 dari 1</span>
                          </div>
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Laporan Audit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-4 py-2 rounded-xl border border-gray-200 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

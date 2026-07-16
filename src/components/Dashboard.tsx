/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, ProjectStatus, Category, ActivityLog } from "../types";
import { CATEGORIES } from "../data";
import { TrendingUp, TrendingDown, Landmark, Wallet, AlertTriangle, FileSpreadsheet, Percent, BarChart3, Clock, CheckSquare, Plus, ShoppingBag, Send, Receipt, FileText, Activity } from "lucide-react";
import { motion } from "motion/react";

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

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
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
  const totalPpnRaw = totalContract * 0.11;
  const ppnSupplierSpending = filteredTxs
    .filter((t) => t.category && t.category.toLowerCase() === "ppn 11% supplier" && t.type === "PetyCash")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPpn = Math.max(0, totalPpnRaw - ppnSupplierSpending);

  const totalPph = projects
    .filter((p) => selectedProjectId === "all" || p.id === selectedProjectId)
    .filter((p) => p.status !== ProjectStatus.CANCEL)
    .reduce((sum, p) => {
      const base = getProjectContractValue(p);
      const rate = p.pphPercent !== undefined ? p.pphPercent : 4;
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

      const ppn = Math.max(0, (contractValue * 0.11) - compPpnSupplierSpending);
      const pph = compProjects.reduce((sum, p) => {
        const base = getProjectContractValue(p);
        const rate = p.pphPercent !== undefined ? p.pphPercent : 4;
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
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tren Realisasi Biaya Bulanan</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Akumulasi pengeluaran Petty Cash &amp; PO berdasarkan bulan kejadian.</p>
          </div>

          {/* SVG Area Chart */}
          <div className="h-64 relative flex flex-col justify-end">
            <svg className="w-full h-48 overflow-visible" viewBox="0 0 500 200">
              {/* Grid Lines */}
              <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Draw area and line path of trends */}
              {(() => {
                const maxVal = Math.max(...monthlyTrend.map((m) => m.total), 10000000);
                const points = monthlyTrend.map((m, idx) => {
                  const x = (idx / (monthlyTrend.length - 1)) * 500;
                  const y = 200 - (m.total / maxVal) * 180;
                  return { x, y, val: m.total, month: m.month };
                });

                const pathD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                const areaD = `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                return (
                  <>
                    {/* Fill Area gradient */}
                    <path d={areaD} fill="url(#blue-trend-grad)" opacity="0.1" />
                    {/* Solid Line */}
                    <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Nodes and markers */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" className="font-mono text-[9px] font-bold fill-gray-600">
                          {p.val > 0 ? (p.val / 1000000).toFixed(1) + "M" : ""}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}

              <defs>
                <linearGradient id="blue-trend-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>

            {/* Labels under nodes */}
            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1 mt-4">
              {monthlyTrend.map((m, idx) => (
                <span key={idx}>{m.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CATEGORY EXPENDITURES HORIZONTAL BAR CHART */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Distribusi Biaya Berdasarkan Kategori</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Urutan pengeluaran terbesar dari buku kas pety cash.</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase">
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
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{item.category}</span>
                      <span className="font-mono text-gray-600 text-[11px] font-bold">{formatIDR(item.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-slate-800 h-full rounded-full" style={{ width: `${ratio}%` }} />
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

        {/* Dynamic Responsive SVG Bar Chart */}
        {filteredProjectBudgetData.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 italic">
            Belum ada data proyek aktif untuk dibandingkan atau filter salah.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200">
              {(() => {
                const chartWidth = Math.max(760, filteredProjectBudgetData.length * 150);
                const chartHeight = 240;
                const maxVal = Math.max(
                  ...filteredProjectBudgetData.map((d) => Math.max(d.contractVal, d.spending)),
                  100000000 // min 100M for reasonable scaling
                );

                const formatShortVal = (val: number) => {
                  if (val >= 1000000000) {
                    return (val / 1000000000).toFixed(1) + " M";
                  }
                  if (val >= 1000000) {
                    return (val / 1000000).toFixed(0) + " Jt";
                  }
                  return val > 0 ? (val / 1000).toFixed(0) + " K" : "0";
                };

                return (
                  <div style={{ minWidth: `${chartWidth}px` }} className="w-full relative">
                    <svg className="w-full h-64 overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      {/* Grid Lines & Labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                        const y = 20 + (1 - ratio) * 160;
                        const labelValue = ratio * maxVal;
                        return (
                          <g key={index}>
                            <line
                              x1="0"
                              y1={y}
                              x2={chartWidth}
                              y2={y}
                              stroke="#f1f5f9"
                              strokeWidth="1"
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
                      <line x1="0" y1="180" x2={chartWidth} y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Project Bars Group */}
                      {filteredProjectBudgetData.map((proj, idx) => {
                        const groupWidth = chartWidth / filteredProjectBudgetData.length;
                        const groupCenterX = (idx * groupWidth) + (groupWidth / 2);
                        const barWidth = 24;
                        const gap = 5;

                        const contractHeight = (proj.contractVal / maxVal) * 160;
                        const spendingHeight = (proj.spending / maxVal) * 160;

                        const x1 = groupCenterX - barWidth - gap / 2;
                        const x2 = groupCenterX + gap / 2;

                        // Calculate spending bar color based on warnings
                        let barColor = "#10b981"; // emerald-500 (Aman)
                        if (proj.isOverBudget) {
                          barColor = "#ef4444"; // red-500 (Kritis)
                        } else if (proj.isNearingThreshold) {
                          barColor = "#f59e0b"; // amber-500 (Peringatan)
                        }

                        return (
                          <g key={proj.id} className="group">
                            {/* Bar 1: Contract Value (Indigo) */}
                            <rect
                              x={x1}
                              y={180 - contractHeight}
                              width={barWidth}
                              height={Math.max(2, contractHeight)}
                              fill="#4f46e5"
                              rx="4"
                              className="transition-all duration-300 hover:opacity-90"
                            />
                            {proj.contractVal > 0 && (
                              <text
                                x={x1 + barWidth / 2}
                                y={Math.min(170, 180 - contractHeight - 6)}
                                textAnchor="middle"
                                className="font-mono text-[9px] font-bold fill-indigo-700"
                              >
                                {formatShortVal(proj.contractVal)}
                              </text>
                            )}

                            {/* Bar 2: Actual Spending */}
                            <rect
                              x={x2}
                              y={180 - spendingHeight}
                              width={barWidth}
                              height={Math.max(2, spendingHeight)}
                              fill={barColor}
                              rx="4"
                              className="transition-all duration-300 hover:opacity-90"
                            />
                            {proj.spending > 0 && (
                              <text
                                x={x2 + barWidth / 2}
                                y={Math.min(170, 180 - spendingHeight - 6)}
                                textAnchor="middle"
                                className="font-mono text-[9px] font-bold"
                                fill={barColor === "#10b981" ? "#065f46" : barColor === "#f59e0b" ? "#92400e" : "#991b1b"}
                              >
                                {formatShortVal(proj.spending)}
                              </text>
                            )}

                            {/* X-Axis labels inside the group */}
                            <text
                              x={groupCenterX}
                              y="205"
                              textAnchor="middle"
                              className="font-sans text-[11px] font-bold fill-slate-800"
                            >
                              {proj.code.split(".").slice(1, 3).join(".") || proj.code}
                            </text>
                            <text
                              x={groupCenterX}
                              y="222"
                              textAnchor="middle"
                              className="font-sans text-[9px] fill-gray-400 font-medium truncate max-w-[140px]"
                            >
                              {proj.name.length > 20 ? proj.name.substring(0, 18) + "..." : proj.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* Structured Table/Grid of Project Budgets for Deep Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjectBudgetData.map((proj) => {
                let statusBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                let statusLabel = "Aman";
                if (proj.isOverBudget) {
                  statusBg = "bg-red-50 text-red-700 border border-red-200";
                  statusLabel = "Kritis (Over Budget)";
                } else if (proj.isNearingThreshold) {
                  statusBg = "bg-amber-50 text-amber-700 border border-amber-200";
                  statusLabel = `Warning (>${proj.threshold}%)`;
                }

                return (
                  <div
                    key={proj.id}
                    className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-3 shadow-xs hover:border-gray-300 hover:bg-slate-100/50 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-blue-600 block">{proj.code}</span>
                        <h4 className="font-bold text-xs text-slate-900 tracking-tight line-clamp-1">{proj.name}</h4>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${statusBg}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Nilai Kontrak Dasar:</span>
                        <span className="font-mono font-semibold text-slate-800">{formatIDR(proj.contractVal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Realisasi Pengeluaran:</span>
                        <span className="font-mono font-semibold text-red-600">{formatIDR(proj.spending)}</span>
                      </div>
                      
                      {/* Micro Progress Bar */}
                      <div className="pt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>Rasio Terpakai:</span>
                          <span>{proj.ratio.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
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
            <p className="text-[10px] text-gray-500 mt-0.5">Grafik perbandingan nilai kontrak bersih, total belanja (aktual), dan realisasi invoice yang dicairkan (Miliar Rupiah).</p>
          </div>

          <div className="h-64 relative flex flex-col justify-end">
            <svg className="w-full h-52 overflow-visible" viewBox="0 0 500 200">
              {/* Horizontal guide lines */}
              <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="200" x2="500" y2="200" stroke="#e2e8f0" strokeWidth="1.5" />

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
                        {comp.netContract > 0 ? (comp.netContract / 1000000).toFixed(0) + "M" : "0"}
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
                        {comp.spending > 0 ? (comp.spending / 1000000).toFixed(0) + "M" : "0"}
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
                        {comp.invoiced > 0 ? (comp.invoiced / 1000000).toFixed(0) + "M" : "0"}
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
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" /> Riwayat Aktivitas
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              Karyawan
            </span>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {(() => {
              const filteredActivities = selectedProjectId === "all"
                ? activities
                : activities.filter(act => !act.projectId || act.projectId === selectedProjectId);

              if (filteredActivities.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-400 text-xs italic">
                    Belum ada riwayat aktivitas untuk lingkup ini.
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
                  icon = <Receipt className="w-3.5 h-3.5" />;
                  colorClass = "bg-rose-50 text-rose-600 border border-rose-100";
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
    </div>
  );
}

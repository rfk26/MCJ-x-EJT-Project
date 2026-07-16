/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, ProjectStatus } from "../types";
import { FolderCheck, DollarSign, ArrowUpRight, TrendingUp, TrendingDown, Users, FileText, Printer, Briefcase } from "lucide-react";
import { motion } from "motion/react";

interface ClosedRecapProps {
  projects: Project[];
  transactions: Transaction[];
  onSelectProject?: (projectId: string) => void;
}

export default function ClosedRecap({ projects, transactions, onSelectProject }: ClosedRecapProps) {
  // Get all projects that are in CLOSING state
  const closedProjects = projects.filter(
    (p) => p.status === ProjectStatus.CLOSING
  );

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Aggregated totals for ALL closed projects
  const aggregated = closedProjects.reduce(
    (acc, proj) => {
      const contract = proj.customContractItems && proj.customContractItems.length > 0
        ? proj.customContractItems.reduce((sum, item) => sum + (item.value || 0), 0)
        : (proj.contractValue?.piping || 0) +
          (proj.contractValue?.electrical || 0) +
          (proj.contractValue?.mechanical || 0) +
          (proj.contractValue?.scafolder || 0);

      const ppn = contract * (proj.ppnPercent / 100);
      const pph = contract * (proj.pphPercent / 100);
      const netValue = contract + ppn - pph;

      // Expenses from PetyCash only (excluding PO)
      const expenses = transactions
        .filter((t) => t.projectId === proj.id && t.type === "PetyCash")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = netValue - expenses;
      const profitMargin = netValue > 0 ? (netProfit / netValue) * 100 : 0;

      return {
        contractTotal: acc.contractTotal + contract,
        netValueTotal: acc.netValueTotal + netValue,
        expensesTotal: acc.expensesTotal + expenses,
        profitTotal: acc.profitTotal + netProfit,
      };
    },
    { contractTotal: 0, netValueTotal: 0, expensesTotal: 0, profitTotal: 0 }
  );

  const averageProfitMargin =
    aggregated.netValueTotal > 0 ? (aggregated.profitTotal / aggregated.netValueTotal) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="closed-recap-section">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FolderCheck className="w-5.5 h-5.5 text-emerald-600" />
            Rekapan Proyek Selesai &amp; Closing Audit
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Analisis profitabilitas, penghematan anggaran, dan efisiensi operasional proyek CV. Mandiri Cipta Jaya yang sudah selesai.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Cetak Ringkasan Audit
        </button>
      </div>

      {/* STATS SUMMARY BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Proyek Closing</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-gray-900">{closedProjects.length}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Completed</span>
          </div>
          <span className="text-[11px] text-gray-500 mt-3">Semua serah terima telah selesai</span>
        </div>

        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Akumulasi Nilai Kontrak Bersih</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold text-gray-900">{formatIDR(aggregated.netValueTotal)}</span>
          </div>
          <span className="text-[11px] text-gray-500 mt-3">Sudah termasuk Ppn 11% - Pph 4%</span>
        </div>

        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Biaya Pengeluaran Aktual</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold text-gray-900 text-red-600">{formatIDR(aggregated.expensesTotal)}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {( (1 - aggregated.expensesTotal / aggregated.netValueTotal) * 100 ).toFixed(1)}% Penghematan Anggaran
          </span>
        </div>

        <div className="bg-white p-5 border border-blue-200 bg-blue-50/10 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Keuntungan Bersih Audit</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold text-emerald-700">{formatIDR(aggregated.profitTotal)}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {averageProfitMargin.toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-gray-500 mt-3">
            Rata-rata target: <strong className="text-gray-700">35.0%</strong>
          </span>
        </div>
      </div>

      {/* LIST OF CLOSED PROJECTS AUDITS */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Daftar Proyek Audit &amp; Keuangan</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {closedProjects.map((proj) => {
            const contract = proj.customContractItems && proj.customContractItems.length > 0
              ? proj.customContractItems.reduce((sum, item) => sum + (item.value || 0), 0)
              : (proj.contractValue?.piping || 0) +
                (proj.contractValue?.electrical || 0) +
                (proj.contractValue?.mechanical || 0) +
                (proj.contractValue?.scafolder || 0);

            const ppn = contract * (proj.ppnPercent / 100);
            const pph = contract * (proj.pphPercent / 100);
            const netValue = contract + ppn - pph;

            const expenses = transactions
              .filter((t) => t.projectId === proj.id && t.type === "PetyCash")
              .reduce((sum, t) => sum + t.amount, 0);

            const profit = netValue - expenses;
            const profitMargin = netValue > 0 ? (profit / netValue) * 100 : 0;
            const targetMargin = proj.expectedProfitPercent || 35;
            const isAboveTarget = profitMargin >= targetMargin;

            // Group expenses of this project
            const projectTxs = transactions.filter((t) => t.projectId === proj.id);
            const petyCashSum = projectTxs.filter((t) => t.type === "PetyCash").reduce((s, t) => s + t.amount, 0);
            const poSum = projectTxs.filter((t) => t.type === "PO").reduce((s, t) => s + t.amount, 0);
            const invoiceIn = projectTxs.filter((t) => t.type === "Invoice").reduce((s, t) => s + t.amount, 0);

            return (
              <div
                key={proj.id}
                className="bg-white border border-gray-200 rounded-2xl hover:border-gray-300 shadow-sm overflow-hidden transition-all flex flex-col justify-between"
              >
                {/* Audit Header */}
                <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-bold uppercase">
                        {proj.code}
                      </span>
                      <span className="text-xs text-gray-500">Mulai: {proj.startDate}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{proj.name}</h4>
                    <p className="text-xs text-gray-500">
                      Manajer Proyek: <strong>{proj.manager}</strong> | PIC: <strong>{proj.pic}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    CLOSED AUDIT
                  </span>
                </div>

                {/* Audit Values Grid */}
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Nilai Kontrak Kotor</span>
                    <span className="text-xs font-bold text-gray-900">{formatIDR(contract)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Nilai Kontrak Bersih</span>
                    <span className="text-xs font-bold text-gray-900 text-slate-700">{formatIDR(netValue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Biaya Riil Terpakai</span>
                    <span className="text-xs font-bold text-red-600">{formatIDR(expenses)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Keuntungan Bersih</span>
                    <span className={`text-xs font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatIDR(profit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Margin Keuntungan Aktual</span>
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                      {profitMargin.toFixed(1)}%
                      {profitMargin > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Status Profitabilitas</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded inline-block uppercase mt-0.5 tracking-wider ${
                        isAboveTarget ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isAboveTarget ? "Melampaui Target (35%)" : "Di Bawah Target"}
                    </span>
                  </div>
                </div>

                {/* Expenses breakdown mini progress */}
                <div className="p-5 bg-gray-50/25 space-y-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Pengajuan Petty Cash: <strong>{formatIDR(petyCashSum)}</strong></span>
                    <span>Nilai Kontrak PO: <strong>{formatIDR(poSum)}</strong></span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Rasio Realisasi Pendapatan vs Kontrak</span>
                      <span>{( (invoiceIn / netValue) * 100 || 0 ).toFixed(1)}% Penagihan</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-l-full"
                        style={{ width: `${Math.min((invoiceIn / netValue) * 100, 100)}%` }}
                      />
                      <div
                        className="bg-gray-200 h-full rounded-r-full"
                        style={{ width: `${Math.max(0, 100 - (invoiceIn / netValue) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Total Invoice Masuk: {formatIDR(invoiceIn)}</span>
                      <span>Sisa Belum Ditagih: {formatIDR(Math.max(0, netValue - invoiceIn))}</span>
                    </div>
                  </div>
                </div>

                {/* Audit Action Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
                  <button
                    onClick={() => onSelectProject && onSelectProject(proj.id)}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" /> Buka Laporan Detail Proyek
                  </button>
                  <span className="text-[10px] text-gray-400 italic">Audit per: {new Date().toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

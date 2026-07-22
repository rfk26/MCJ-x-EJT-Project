/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, Transaction, BudgetAlert, ProjectStatus } from "../types";
import { Bell, AlertTriangle, Check, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationCenterProps {
  projects: Project[];
  transactions: Transaction[];
  alerts: BudgetAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<BudgetAlert[]>>;
  onCloseProject?: (projectId: string) => void;
}

export function generateAlerts(projects: Project[], transactions: Transaction[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  projects.forEach((proj) => {
    if (proj.status === ProjectStatus.CANCEL) return;

    // Total contract value (excluding Ppn/Pph for raw threshold, or net)
    const baseContract =
      (proj.contractValue?.piping || 0) +
      (proj.contractValue?.electrical || 0) +
      (proj.contractValue?.mechanical || 0) +
      (proj.contractValue?.scafolder || 0) +
      (proj.contractValue?.welder || 0);

    if (baseContract === 0) return;

    // Calculate total actual spending (only Petty Cash)
    const projectSpending = transactions
      .filter((tx) => tx.projectId === proj.id && tx.type === "PetyCash")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const percentage = (projectSpending / baseContract) * 100;
    const threshold = proj.budgetThresholdPercent || 85;

    if (percentage >= 100) {
      alerts.push({
        id: `alert-${proj.id}-over`,
        projectId: proj.id,
        projectName: proj.name,
        type: "danger",
        message: `Kritis! Anggaran untuk ${proj.name} telah MELEBIHI batas maksimal kontrak (Saat ini ${percentage.toFixed(1)}%). Segera lakukan peninjauan biaya!`,
        date: new Date().toISOString().split("T")[0],
        isRead: false,
        percentage,
      });
    } else if (percentage >= threshold) {
      alerts.push({
        id: `alert-${proj.id}-near`,
        projectId: proj.id,
        projectName: proj.name,
        type: "warning",
        message: `Peringatan! Pengeluaran ${proj.name} telah mendekati batas maksimal (${percentage.toFixed(1)}% dari kontrak). Batas alarm ditentukan sebesar ${threshold}%.`,
        date: new Date().toISOString().split("T")[0],
        isRead: false,
        percentage,
      });
    }
  });

  return alerts;
}

export default function NotificationCenter({
  projects,
  transactions,
  alerts,
  setAlerts,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>(() => {
    const saved = localStorage.getItem("mcj_dismissed_alerts");
    if (!saved || saved === "undefined" || saved === "null") return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse mcj_dismissed_alerts:", e);
      return [];
    }
  });

  // Sync / regenerate alerts based on current state
  React.useEffect(() => {
    const generated = generateAlerts(projects, transactions).filter(
      (a) => !dismissedAlerts.includes(a.id)
    );
    setAlerts((prev) => {
      // Keep read status if alert existed
      return generated.map((newAlert) => {
        const existing = prev.find((p) => p.id === newAlert.id);
        return existing ? { ...newAlert, isRead: existing.isRead } : newAlert;
      });
    });
  }, [projects, transactions, dismissedAlerts, setAlerts]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const clearAlert = (id: string) => {
    setDismissedAlerts((prev) => {
      const next = [...prev, id];
      localStorage.setItem("mcj_dismissed_alerts", JSON.stringify(next));
      return next;
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: !a.isRead } : a))
    );
  };

  return (
    <div className="relative z-40" id="notification-center-container">
      {/* Trigger Button */}
      <button
        id="btn-bell-notification"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white font-sans text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-96 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-100 font-sans"
              style={{ top: "100%" }}
            >
              {/* Header */}
              <div className="p-4 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Notifikasi Anggaran</h3>
                </div>
                {alerts.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              {/* Alert list */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-5 h-5 text-gray-400" />
                    </div>
                    Semua anggaran aman! Tidak ada alarm aktif saat ini.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 transition-colors flex gap-3 ${
                        alert.isRead ? "bg-white" : "bg-blue-50/35"
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {alert.type === "danger" ? (
                          <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            {alert.projectName}
                          </span>
                          <span className="text-[10px] text-gray-400">{alert.date}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>

                        {/* Progress Bar in alert */}
                        <div className="mt-2 space-y-1">
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                alert.type === "danger" ? "bg-red-600" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400">
                            <span>Sisa Anggaran: {Math.max(0, 100 - alert.percentage).toFixed(1)}%</span>
                            <span>Total Penggunaan: {alert.percentage.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => toggleRead(alert.id)}
                            className="text-[10px] text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                          >
                            {alert.isRead ? "Tandai Belum Dibaca" : "Tandai Dibaca"}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => clearAlert(alert.id)}
                            className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer info */}
              {alerts.length > 0 && (
                <div className="p-3 bg-gray-50 text-center">
                  <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                    Pemberitahuan otomatis real-time aktif
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

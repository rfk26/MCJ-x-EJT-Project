/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ProjectStatus {
  PROGRES = "PROGRES",
  CLOSING = "CLOSING",
  CANCEL = "CANCEL"
}

export enum ReportStatus {
  SUDAH_PROSES = "Sudah Proses",
  BELUM_PROSES = "Belum Proses",
  SUDAH_LAPORAN = "Sudah Laporan",
  BELUM_LAPORAN = "Belum Laporan",
  CANCEL = "Cancel"
}

export type Category = string;

export interface ContractBreakdown {
  piping: number;
  electrical: number;
  mechanical: number;
  scafolder: number;
  welder?: number;
}

export interface ContractItem {
  id: string;
  name: string;
  value: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  manager: string;
  pic: string;
  status: ProjectStatus;
  startDate: string;
  expectedProfitPercent: number; // e.g. 35
  contractValue: ContractBreakdown;
  ppnPercent: number; // e.g. 11
  pphPercent: number; // e.g. 4
  budgetThresholdPercent: number; // alert trigger e.g. 85%
  notes?: string;
  contractNames?: {
    piping?: string;
    electrical?: string;
    mechanical?: string;
    scafolder?: string;
    welder?: string;
  };
  company?: string;
  poNo?: string;
  customContractItems?: ContractItem[];
}

export interface PetyCashItem {
  id: string;
  description: string;
  category: Category;
  amount: number;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: "PetyCash" | "Invoice" | "PO" | "Estimate" | "PetyCashRequest";
  pic: string;
  date: string;
  invoiceNo?: string;
  petyCashNo?: string;
  poNo?: string;
  supplier?: string;
  status: string; // e.g. "Sudah Proses", "Belum Laporan"
  description: string;
  paymentMethod?: string;
  category: Category;
  amount: number;
  items?: PetyCashItem[];
  contractItems?: ContractItem[];
  company?: string;
  requestId?: string;
}

export interface MonthlyBudget {
  month: string; // e.g. "Januari", "Februari"
  estimate: {
    piping: number;
    electrical: number;
    mechanical: number;
    scafolder: number;
  };
  po: {
    piping: number;
    electrical: number;
    mechanical: number;
    scafolder: number;
  };
  invoiceIncome: number;
}

export interface BudgetAlert {
  id: string;
  projectId: string;
  projectName: string;
  type: "warning" | "danger";
  message: string;
  date: string;
  isRead: boolean;
  percentage: number;
}

export interface ActivityLog {
  id: string;
  type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice";
  action: string;
  description: string;
  pic: string;
  date: string;
  projectId?: string;
}


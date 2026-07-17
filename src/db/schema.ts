import { pgTable, text, timestamp, integer, boolean, numeric, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  username: text("username").primaryKey(),
  fullName: text("full_name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  manager: text("manager").notNull(),
  pic: text("pic").notNull(),
  status: text("status").notNull(), // PROGRES, CLOSING, CANCEL
  startDate: text("start_date").notNull(),
  expectedProfitPercent: integer("expected_profit_percent").notNull(),
  contractValue: jsonb("contract_value").notNull(), // ContractBreakdown object
  ppnPercent: integer("ppn_percent").notNull(),
  pphPercent: integer("pph_percent").notNull(),
  budgetThresholdPercent: integer("budget_threshold_percent").notNull(),
  notes: text("notes"),
  contractNames: jsonb("contract_names"),
  company: text("company"),
  poNo: text("po_no"),
  customContractItems: jsonb("custom_contract_items"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // PetyCash | Invoice | PO | Estimate | PetyCashRequest
  pic: text("pic").notNull(),
  date: text("date").notNull(),
  invoiceNo: text("invoice_no"),
  petyCashNo: text("pety_cash_no"),
  poNo: text("po_no"),
  supplier: text("supplier"),
  status: text("status").notNull(),
  description: text("description").notNull(),
  paymentMethod: text("payment_method"),
  category: text("category").notNull(),
  amount: numeric("amount").notNull(),
  items: jsonb("items"), // PetyCashItem[]
  contractItems: jsonb("contract_items"), // ContractItem[]
  company: text("company"),
  requestId: text("request_id"),
  transferProof: text("transfer_proof"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // project | po | petycash_request | petycash_expense | invoice
  action: text("action").notNull(),
  description: text("description").notNull(),
  pic: text("pic").notNull(),
  date: text("date").notNull(),
  projectId: text("project_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // We can store the name directly as id for easy lookup
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  projectName: text("project_name").notNull(),
  type: text("type").notNull(), // warning | danger
  message: text("message").notNull(),
  date: text("date").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

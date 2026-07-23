/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Project, ProjectStatus, ContractBreakdown, Transaction, ContractItem, ActivityLog } from "../types";
import { Plus, Briefcase, FileDigit, ShieldCheck, Percent, HelpCircle, Edit2, CheckCircle2, XCircle, AlertTriangle, Trash2, Search, X, Calendar, Clock, History, Activity, FileText, Receipt, ChevronDown, ChevronUp, Package, DollarSign, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface ProjectManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  activities?: ActivityLog[];
  isReadOnly?: boolean;
  onAddActivity?: (
    type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice",
    action: string,
    description: string,
    pic: string,
    projectId?: string
  ) => void;
}

export default function ProjectManager({
  projects,
  setProjects,
  transactions,
  setTransactions,
  activities = [],
  onAddActivity,
  isReadOnly = false,
}: ProjectManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedLogProjectId, setExpandedLogProjectId] = React.useState<string | null>(null);

  // Memoized filtered projects list based on name or registration code
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter((p) => {
      const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
      const codeMatch = p.code ? p.code.toLowerCase().includes(q) : false;
      const managerMatch = p.manager ? p.manager.toLowerCase().includes(q) : false;
      const picMatch = p.pic ? p.pic.toLowerCase().includes(q) : false;
      return nameMatch || codeMatch || managerMatch || picMatch;
    });
  }, [projects, searchQuery]);

  // Memoized list of projects near or past target completion date (< 7 days)
  const urgentProjects = React.useMemo(() => {
    const todayMs = new Date(new Date().toISOString().split("T")[0]).getTime();
    return projects.filter((p) => {
      if (p.status !== ProjectStatus.PROGRES || !p.targetCompletionDate) return false;
      const targetMs = new Date(p.targetCompletionDate).getTime();
      const daysLeft = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7;
    });
  }, [projects]);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [pic, setPic] = React.useState("");
  const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
  const [expectedProfitPercent, setExpectedProfitPercent] = React.useState(35);
  const [budgetThresholdPercent, setBudgetThresholdPercent] = React.useState(85);
  const [ppnPercent, setPpnPercent] = React.useState<number>(11);
  const [pphPercent, setPphPercent] = React.useState<number>(4);

  // Auto-detect HO / EJT to suggest 0% for PPN & PPh
  React.useEffect(() => {
    const isHoOrEjt = name.toUpperCase().includes("HO") || code.toUpperCase().includes("HO") || name.toUpperCase().includes("EJT");
    if (isHoOrEjt) {
      setPpnPercent(0);
      setPphPercent(0);
    }
  }, [name, code]);

  const [company, setCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [customCompany, setCustomCompany] = React.useState("");

  const [notes, setNotes] = React.useState("");

  // Select PO copy states and helper
  const [selectedPoCopy, setSelectedPoCopy] = React.useState<string>("");

  const poOptions = React.useMemo(() => {
    const poTxs = transactions.filter((t) => t.type === "PO");
    const list: Array<{ id: string; name: string; code: string; poNo?: string }> = [];
    const seenProjIds = new Set<string>();
    
    poTxs.forEach((tx) => {
      if (tx.projectId && !seenProjIds.has(tx.projectId)) {
        seenProjIds.add(tx.projectId);
        const proj = projects.find((p) => p.id === tx.projectId);
        if (proj) {
          list.push({
            id: proj.id,
            name: proj.name,
            code: proj.code,
            poNo: tx.poNo,
          });
        }
      }
    });

    // Add any projects that have a poNo but might not have a transaction yet
    projects.forEach((proj) => {
      if (proj.poNo && !seenProjIds.has(proj.id)) {
        seenProjIds.add(proj.id);
        list.push({
          id: proj.id,
          name: proj.name,
          code: proj.code,
          poNo: proj.poNo,
        });
      }
    });

    return list;
  }, [transactions, projects]);

  const handleCopyFromPo = (projId: string) => {
    setSelectedPoCopy(projId);
    if (!projId) return;
    const foundProj = projects.find((p) => p.id === projId);
    if (foundProj) {
      setName(foundProj.name);
      setCode(foundProj.code);
      setManager(foundProj.manager || foundProj.pic || "");
      setPic(foundProj.pic || "");
      setCompany(foundProj.company || "CV. Mandiri Cipta Jaya");
      setExpectedProfitPercent(foundProj.expectedProfitPercent || 35);
      setBudgetThresholdPercent(foundProj.budgetThresholdPercent || 85);
      setNotes(foundProj.notes || "");
      
      // Load contract items
      if (foundProj.customContractItems && foundProj.customContractItems.length > 0) {
        const pipingItem = foundProj.customContractItems.find(i => i.name.toLowerCase().includes("piping") || i.id === "1" || i.id === "piping");
        const electricalItem = foundProj.customContractItems.find(i => i.name.toLowerCase().includes("elect") || i.id === "2" || i.id === "electrical");
        const mechanicalItem = foundProj.customContractItems.find(i => i.name.toLowerCase().includes("mech") || i.id === "3" || i.id === "mechanical");
        const scafolderItem = foundProj.customContractItems.find(i => i.name.toLowerCase().includes("scaf") || i.id === "4" || i.id === "scafolder");
        const welderItem = foundProj.customContractItems.find(i => i.name.toLowerCase().includes("weld") || i.id === "5" || i.id === "welder");

        setPipingVal(pipingItem ? pipingItem.value : (foundProj.contractValue?.piping ?? 0));
        setElectricalVal(electricalItem ? electricalItem.value : (foundProj.contractValue?.electrical ?? 0));
        setMechanicalVal(mechanicalItem ? mechanicalItem.value : (foundProj.contractValue?.mechanical ?? 0));
        setScafolderVal(scafolderItem ? scafolderItem.value : (foundProj.contractValue?.scafolder ?? 0));
        setWelderVal(welderItem ? welderItem.value : (foundProj.contractValue?.welder ?? 0));

        setPipingName(pipingItem ? pipingItem.name : (foundProj.contractNames?.piping || "Piping"));
        setElectricalName(electricalItem ? electricalItem.name : (foundProj.contractNames?.electrical || "Electrical"));
        setMechanicalName(mechanicalItem ? mechanicalItem.name : (foundProj.contractNames?.mechanical || "Mechanical"));
        setScafolderName(scafolderItem ? scafolderItem.name : (foundProj.contractNames?.scafolder || "Scafolder"));
        setWelderName(welderItem ? welderItem.name : (foundProj.contractNames?.welder || "Welder"));
      } else {
        setPipingVal(foundProj.contractValue?.piping ?? 0);
        setElectricalVal(foundProj.contractValue?.electrical ?? 0);
        setMechanicalVal(foundProj.contractValue?.mechanical ?? 0);
        setScafolderVal(foundProj.contractValue?.scafolder ?? 0);
        setWelderVal(foundProj.contractValue?.welder ?? 0);

        setPipingName(foundProj.contractNames?.piping || "Piping");
        setElectricalName(foundProj.contractNames?.electrical || "Electrical");
        setMechanicalName(foundProj.contractNames?.mechanical || "Mechanical");
        setScafolderName(foundProj.contractNames?.scafolder || "Scafolder");
        setWelderName(foundProj.contractNames?.welder || "Welder");
      }
    }
  };

  // Custom Modal Confirmation for Delete & Banner alerts
  const [projectToDelete, setProjectToDelete] = React.useState<{ id: string; name: string } | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Edit Project States
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCode, setEditCode] = React.useState("");
  const [editManager, setEditManager] = React.useState("");
  const [editPic, setEditPic] = React.useState("");
  const [editTargetCompletionDate, setEditTargetCompletionDate] = React.useState("");
  const [editExpectedProfitPercent, setEditExpectedProfitPercent] = React.useState(35);
  const [editBudgetThresholdPercent, setEditBudgetThresholdPercent] = React.useState(85);
  const [editCompany, setEditCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [editCustomCompany, setEditCustomCompany] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editPoNo, setEditPoNo] = React.useState("");
  const [editPpnPercent, setEditPpnPercent] = React.useState(11);
  const [editPphPercent, setEditPphPercent] = React.useState(4);
  const [editCustomContractItems, setEditCustomContractItems] = React.useState<ContractItem[]>([]);
  
  const [editPipingVal, setEditPipingVal] = React.useState(0);
  const [editElectricalVal, setEditElectricalVal] = React.useState(0);
  const [editMechanicalVal, setEditMechanicalVal] = React.useState(0);
  const [editScafolderVal, setEditScafolderVal] = React.useState(0);
  const [editWelderVal, setEditWelderVal] = React.useState(0);

  const [editPipingName, setEditPipingName] = React.useState("Piping");
  const [editElectricalName, setEditElectricalName] = React.useState("Electrical");
  const [editMechanicalName, setEditMechanicalName] = React.useState("Mechanical");
  const [editScafolderName, setEditScafolderName] = React.useState("Scafolder");
  const [editWelderName, setEditWelderName] = React.useState("Welder");

  // Add Project Contract States
  const [pipingVal, setPipingVal] = React.useState(0);
  const [electricalVal, setElectricalVal] = React.useState(0);
  const [mechanicalVal, setMechanicalVal] = React.useState(0);
  const [scafolderVal, setScafolderVal] = React.useState(0);
  const [welderVal, setWelderVal] = React.useState(0);

  const [pipingName, setPipingName] = React.useState("Piping");
  const [electricalName, setElectricalName] = React.useState("Electrical");
  const [mechanicalName, setMechanicalName] = React.useState("Mechanical");
  const [scafolderName, setScafolderName] = React.useState("Scafolder");
  const [welderName, setWelderName] = React.useState("Welder");

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getProjectHistoryLogs = React.useCallback(
    (proj: Project) => {
      const logs: {
        id: string;
        type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice" | "milestone";
        action: string;
        description: string;
        pic: string;
        date: string;
      }[] = [];

      // 1. Activity logs explicitly for this project or referencing project name/code
      if (activities && activities.length > 0) {
        activities.forEach((act) => {
          const isForProj =
            act.projectId === proj.id ||
            (act.description &&
              (act.description.toLowerCase().includes(proj.name.toLowerCase()) ||
                act.description.toLowerCase().includes(proj.code.toLowerCase())));
          if (isForProj) {
            logs.push({
              id: act.id,
              type: act.type || "project",
              action: act.action || "Aktivitas Proyek",
              description: act.description,
              pic: act.pic || proj.manager || "Admin",
              date: act.date || new Date().toISOString().split("T")[0],
            });
          }
        });
      }

      // 2. Transactions for this project
      const projTx = transactions.filter((t) => t.projectId === proj.id);
      projTx.forEach((t) => {
        const isVoucher = t.type === "PetyCash";
        let action = "Transaksi Kas Kecil";
        if (t.type === "PetyCash") action = "Realisasi Voucher Kas Kecil";
        else if (t.type === "PetyCashRequest") action = "Pengajuan Kas Kecil";
        else if (t.type === "Invoice") action = `Invoice #${t.invoiceNo || ""}`;
        else if (t.type === "PO") action = `Purchase Order #${t.poNo || ""}`;

        logs.push({
          id: `tx-${t.id}`,
          type: isVoucher ? "petycash_expense" : t.type === "PetyCashRequest" ? "petycash_request" : t.type === "Invoice" ? "invoice" : "po",
          action,
          description: `${t.description || "Transaksi"} - ${formatIDR(t.amount)} (${t.status || "Selesai"})`,
          pic: t.pic || proj.manager || "Admin",
          date: t.date || new Date().toISOString().split("T")[0],
        });
      });

      // 5. Default milestones if needed
      if (proj.targetCompletionDate) {
        logs.push({
          id: `m-target-${proj.id}`,
          type: "milestone",
          action: "Target Penyelesaian Set",
          description: `Target penyelesaian proyek ditetapkan ke ${proj.targetCompletionDate}`,
          pic: proj.manager,
          date: proj.targetCompletionDate,
        });
      }

      if (proj.startDate) {
        const contractBase = proj.customContractItems && proj.customContractItems.length > 0
          ? proj.customContractItems.reduce((s, item) => s + Number(item.value || 0), 0)
          : (proj.contractValue?.piping || 0) +
            (proj.contractValue?.electrical || 0) +
            (proj.contractValue?.mechanical || 0) +
            (proj.contractValue?.scafolder || 0) +
            (proj.contractValue?.welder || 0);

        logs.push({
          id: `m-start-${proj.id}`,
          type: "project",
          action: "Inisialisasi Proyek",
          description: `Pendaftaran proyek "${proj.name}" dengan nilai kontrak ${formatIDR(contractBase)}`,
          pic: proj.manager,
          date: proj.startDate,
        });
      }

      // Deduplicate logs by unique action + description + date
      const uniqueLogs: typeof logs = [];
      const seen = new Set<string>();

      logs.forEach((item) => {
        const key = `${item.date}-${item.action}-${item.description}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLogs.push(item);
        }
      });

      // Sort descending by date
      uniqueLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Return top 5 most recent entries
      return uniqueLogs.slice(0, 5);
    },
    [activities, transactions]
  );

  const resetProjectForm = () => {
    setName("");
    setCode("");
    setManager("");
    setPic("");
    setTargetCompletionDate("");
    setExpectedProfitPercent(35);
    setBudgetThresholdPercent(85);
    setPpnPercent(11);
    setPphPercent(4);
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setNotes("");
    setPipingVal(0);
    setElectricalVal(0);
    setMechanicalVal(0);
    setScafolderVal(0);
    setWelderVal(0);
    setPipingName("Piping");
    setElectricalName("Electrical");
    setMechanicalName("Mechanical");
    setScafolderName("Scafolder");
    setWelderName("Welder");
    setSelectedPoCopy("");
    setValidationError(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !code || !manager) {
      setValidationError("Nama, Kode, dan Manager Proyek wajib diisi!");
      return;
    }

    setValidationError(null);

    const updatedCompany = company === "Lainnya" ? customCompany : company;

    // Create a new project - values will be populated from PO Management
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      code,
      manager,
      pic: pic || manager,
      status: ProjectStatus.PROGRES,
      startDate: new Date().toISOString().split("T")[0],
      expectedProfitPercent: Number(expectedProfitPercent),
      contractValue: {
        piping: 0,
        electrical: 0,
        mechanical: 0,
        scafolder: 0,
        welder: 0,
      },
      contractNames: {
        piping: "Piping",
        electrical: "Electrical",
        mechanical: "Mechanical",
        scafolder: "Scafolder",
        welder: "Welder",
      },
      ppnPercent: Number(ppnPercent),
      pphPercent: Number(pphPercent),
      budgetThresholdPercent: Number(budgetThresholdPercent),
      notes,
      company: updatedCompany,
      targetCompletionDate: targetCompletionDate || undefined,
      customContractItems: [
        { id: "piping", name: "Piping", value: 0 },
        { id: "electrical", name: "Electrical", value: 0 },
        { id: "mechanical", name: "Mechanical", value: 0 },
        { id: "scafolder", name: "Scafolder", value: 0 },
        { id: "welder", name: "Welder", value: 0 },
      ],
    };
    setProjects((prev) => [newProject, ...prev]);
    if (onAddActivity) {
      onAddActivity(
        "project",
        "Proyek Baru Dibuat",
        `Mendaftarkan proyek baru: [${code}] ${name}`,
        pic || manager || "Sistem",
        newProject.id
      );
    }
    setAlertMessage(`Proyek "${name}" berhasil didaftarkan. Hubungkan dengan PO di tab Manajemen PO untuk menetapkan nominal kontrak dasar.`);

    // Reset Form
    resetProjectForm();
    setShowAddForm(false);
  };

  const updateStatus = (id: string, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (onAddActivity) {
            onAddActivity(
              "project",
              "Status Proyek Diubah",
              `Mengubah status proyek "${p.name}" menjadi "${newStatus}"`,
              "Administrator",
              p.id
            );
          }
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const updateThreshold = (id: string, val: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, budgetThresholdPercent: val } : p))
    );
  };

  const triggerDeleteProject = (id: string, name: string) => {
    setProjectToDelete({ id, name });
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const { id, name } = projectToDelete;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (setTransactions) {
      setTransactions((prev) => prev.filter((t) => t.projectId !== id));
    }
    setProjectToDelete(null);
    setAlertMessage(`Proyek "${name}" dan seluruh datanya berhasil dihapus secara permanen.`);
  };

  const handleStartEdit = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditCode(proj.code);
    setEditManager(proj.manager);
    setEditPic(proj.pic || proj.manager);
    setEditTargetCompletionDate(proj.targetCompletionDate || "");
    setEditExpectedProfitPercent(proj.expectedProfitPercent);
    setEditBudgetThresholdPercent(proj.budgetThresholdPercent);
    
    const standardCompanies = ["CV. Mandiri Cipta Jaya", "PT. Elqia Jaya Teknik"];
    if (proj.company && standardCompanies.includes(proj.company)) {
      setEditCompany(proj.company);
      setEditCustomCompany("");
    } else if (proj.company) {
      setEditCompany("Lainnya");
      setEditCustomCompany(proj.company);
    } else {
      setEditCompany("CV. Mandiri Cipta Jaya");
      setEditCustomCompany("");
    }

    const isHoOrEjt = proj.name.toUpperCase().includes("HO") || (proj.code && proj.code.toUpperCase().includes("HO")) || proj.name.toUpperCase().includes("EJT");
    setEditNotes(proj.notes || "");
    setEditPoNo(proj.poNo || "");
    setEditPpnPercent(isHoOrEjt ? ((proj.ppnPercent === 11 || proj.ppnPercent === undefined) ? 0 : proj.ppnPercent) : (proj.ppnPercent !== undefined ? proj.ppnPercent : 11));
    setEditPphPercent(isHoOrEjt ? ((proj.pphPercent === 4 || proj.pphPercent === undefined) ? 0 : proj.pphPercent) : (proj.pphPercent !== undefined ? proj.pphPercent : 4));
    
    if (proj.customContractItems && proj.customContractItems.length > 0) {
      setEditCustomContractItems(JSON.parse(JSON.stringify(proj.customContractItems)));
    } else {
      setEditCustomContractItems([]);
    }

    setEditPipingVal(proj.contractValue?.piping ?? 0);
    setEditElectricalVal(proj.contractValue?.electrical ?? 0);
    setEditMechanicalVal(proj.contractValue?.mechanical ?? 0);
    setEditScafolderVal(proj.contractValue?.scafolder ?? 0);
    setEditWelderVal(proj.contractValue?.welder ?? 0);

    setEditPipingName(proj.contractNames?.piping || "Piping");
    setEditElectricalName(proj.contractNames?.electrical || "Electrical");
    setEditMechanicalName(proj.contractNames?.mechanical || "Mechanical");
    setEditScafolderName(proj.contractNames?.scafolder || "Scafolder");
    setEditWelderName(proj.contractNames?.welder || "Welder");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!editName || !editCode || !editManager) {
      setValidationError("Nama, Kode, dan Manager Proyek wajib diisi!");
      return;
    }

    const updatedCompany = editCompany === "Lainnya" ? editCustomCompany : editCompany;

    const newTotalContract = editCustomContractItems.length > 0
      ? editCustomContractItems.reduce((s, item) => s + Number(item.value || 0), 0)
      : Number(editPipingVal) + Number(editElectricalVal) + Number(editMechanicalVal) + Number(editScafolderVal) + Number(editWelderVal);

    const updatedProject: Project = {
      ...editingProject,
      name: editName,
      code: editCode,
      manager: editManager,
      pic: editPic || editManager,
      expectedProfitPercent: Number(editExpectedProfitPercent),
      budgetThresholdPercent: Number(editBudgetThresholdPercent),
      company: updatedCompany,
      targetCompletionDate: editTargetCompletionDate || undefined,
      notes: editNotes || undefined,
      poNo: editPoNo || undefined,
      ppnPercent: Number(editPpnPercent),
      pphPercent: Number(editPphPercent),
      customContractItems: editCustomContractItems.length > 0 ? editCustomContractItems : undefined,
      contractValue: {
        piping: Number(editPipingVal),
        electrical: Number(editElectricalVal),
        mechanical: Number(editMechanicalVal),
        scafolder: Number(editScafolderVal),
        welder: Number(editWelderVal),
      },
      contractNames: {
        piping: editPipingName,
        electrical: editElectricalName,
        mechanical: editMechanicalName,
        scafolder: editScafolderName,
        welder: editWelderName,
      }
    };

    // Update in projects list
    setProjects((prev) =>
      prev.map((p) => (p.id === editingProject.id ? updatedProject : p))
    );

    if (setTransactions) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.projectId === editingProject.id && t.type === "PO") {
            return {
              ...t,
              amount: newTotalContract,
              company: updatedCompany,
              poNo: editPoNo || t.poNo,
              description: `Owner PO - ${editNotes || "Diubah via Manajemen Proyek"}`
            };
          }
          if (t.projectId === editingProject.id) {
            return {
              ...t,
              company: updatedCompany,
            };
          }
          return t;
        })
      );
    }

    if (onAddActivity) {
      onAddActivity(
        "project",
        "Pembaruan Data Proyek",
        `Pembaruan data/anggaran proyek "${editName}" (Manager: ${editManager}, Alarm: ${editBudgetThresholdPercent}%)`,
        "Administrator",
        editingProject.id
      );
    }

    setEditingProject(null);
    setAlertMessage(`Proyek "${editName}" berhasil diperbarui.`);
  };

  return (
    <div className="space-y-6 font-sans pb-12" id="project-manager-container">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5.5 h-5.5 text-blue-600" />
            Manajemen Project {isReadOnly && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">ReadOnly</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Daftarkan proyek baru, rincian anggaran kontrak (Piping, Electrical, dll.), serta konfigurasi alarm batas anggaran otomatis.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                resetProjectForm();
              } else {
                resetProjectForm();
                setShowAddForm(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? "Tutup Form" : "Daftarkan Proyek Baru"}
          </button>
        )}
      </div>

      {/* NEW PROJECT CREATOR FORM */}
      {!isReadOnly && showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-blue-500/20 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-blue-500/5 p-4 border-b border-blue-500/10 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900">Form Pendaftaran Proyek Baru</h3>
          </div>

          <form onSubmit={handleCreateProject} className="p-6 space-y-6">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            )}

            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nama Proyek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT SMART MARUNDA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Kode Registrasi Proyek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TSRT.SMART.001.2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Project Manager / PM</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BPK. Ujang N"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">PIC Lapangan</label>
                <input
                  type="text"
                  placeholder="Contoh: P Haryanto (Opsional)"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Target Selesai
                </label>
                <input
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Perusahaan</label>
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
            </div>

            {/* Tax, Threshold & Profit Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  PPN (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ppnPercent}
                  onChange={(e) => setPpnPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-emerald-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  PPh (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={pphPercent}
                  onChange={(e) => setPphPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-red-700 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Persentase Target Profit (%) <Percent className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={expectedProfitPercent}
                  onChange={(e) => setExpectedProfitPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Alarm Batas Pengeluaran (%) <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetThresholdPercent}
                  onChange={(e) => setBudgetThresholdPercent(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Sistem akan otomatis memicu alarm notifikasi jika pengeluaran aktual mencapai persentase ini dari nilai kontrak dasar.
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-700">Catatan Tambahan Proyek</label>
              <textarea
                rows={2}
                placeholder="Ketikan rincian singkat, lokasi kerja, deskripsi tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetProjectForm();
                }}
                className="border border-gray-200 text-gray-600 px-4 py-2 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Simpan &amp; Rilis Proyek
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ALL PROJECTS TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Daftar Kontrak Proyek Terdaftar</span>
            <span className="text-xs font-medium text-gray-400">
              {filteredProjects.length !== projects.length 
                ? `Menampilkan ${filteredProjects.length} dari ${projects.length} proyek`
                : `${projects.length} Terdaftar`}
            </span>
          </div>

          {/* Search Bar Input */}
          <div className="relative max-w-md w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Cari nama proyek atau kode registrasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:bg-white text-gray-800 font-medium placeholder-gray-400 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Urgent Projects Warning Banner (< 7 Days or Overdue) */}
        {urgentProjects.length > 0 && (
          <div className="mx-6 my-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-2">
                  <span>⚠️ Peringatan Target Penyelesaian Proyek (&lt; 7 Hari)</span>
                  <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold font-mono">
                    {urgentProjects.length} Proyek
                  </span>
                </h4>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Proyek berikut mendekati atau melewati tenggat tanggal penyelesaian:{" "}
                  <strong className="text-amber-950 font-bold">
                    {urgentProjects.map((p) => `${p.name} (${p.targetCompletionDate})`).join(", ")}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-4">Kode / Nama Proyek</th>
                <th className="p-4">Manager / PIC</th>
                <th className="p-4">Total Kontrak Dasar</th>
                <th className="p-4">Total Pengajuan Petty Cash</th>
                <th className="p-4">Realisasi Pengeluaran</th>
                <th className="p-4">Estimasi Profit &amp; Net</th>
                <th className="p-4">Rasio Penggunaan</th>
                <th className="p-4 text-center">Status</th>
                {!isReadOnly && <th className="p-4 text-right">Status &amp; Hapus</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredProjects.map((proj) => {
                // Compute target date deadline status
                const todayStr = new Date().toISOString().split("T")[0];
                const todayMs = new Date(todayStr).getTime();
                let deadlineDaysLeft: number | null = null;

                if (proj.targetCompletionDate) {
                  const targetMs = new Date(proj.targetCompletionDate).getTime();
                  deadlineDaysLeft = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
                }

                // Compute total spending (only Petty Cash actual expenditures)
                const totalSpending = transactions
                  .filter((t) => t.projectId === proj.id && t.type === "PetyCash")
                  .reduce((sum, t) => sum + t.amount, 0);

                const totalRequests = transactions.filter((t) => t.projectId === proj.id && t.type === "PetyCashRequest");
                const totalRequestAmount = totalRequests.reduce((sum, t) => sum + t.amount, 0);
                const approvedRequestAmount = totalRequests
                  .filter((t) => t.status === "Disetujui" || t.status === "Sudah Realisasi" || t.status === "Realisasi Sebagian")
                  .reduce((sum, t) => sum + t.amount, 0);
                const pendingRequestAmount = totalRequests
                  .filter((t) => t.status === "Belum Proses")
                  .reduce((sum, t) => sum + t.amount, 0);

                const contractBase = proj.customContractItems && proj.customContractItems.length > 0
                  ? proj.customContractItems.reduce((s, item) => s + Number(item.value || 0), 0)
                  : (proj.contractValue?.piping || 0) +
                    (proj.contractValue?.electrical || 0) +
                    (proj.contractValue?.mechanical || 0) +
                    (proj.contractValue?.scafolder || 0) +
                    (proj.contractValue?.welder || 0);

                const spendRatio = contractBase > 0 ? (totalSpending / contractBase) * 100 : 0;
                const isOverBudget = totalSpending >= contractBase;
                const isNearingThreshold = spendRatio >= proj.budgetThresholdPercent;

                const isHoOrEjt = proj.name.toUpperCase().includes("HO") || (proj.code && proj.code.toUpperCase().includes("HO")) || proj.name.toUpperCase().includes("EJT");
                const ppnRate = isHoOrEjt ? ((proj.ppnPercent === 11 || proj.ppnPercent === undefined) ? 0 : proj.ppnPercent) : (proj.ppnPercent !== undefined ? proj.ppnPercent : 11);
                const pphRate = isHoOrEjt ? ((proj.pphPercent === 4 || proj.pphPercent === undefined) ? 0 : proj.pphPercent) : (proj.pphPercent !== undefined ? proj.pphPercent : 4);
                const netValue = contractBase + (contractBase * (ppnRate / 100)) - (contractBase * (pphRate / 100));
                const profit = netValue - totalSpending;
                const profitMargin = netValue > 0 ? (profit / netValue) * 100 : 0;
                const targetMargin = proj.expectedProfitPercent || 35;

                const projLogs = getProjectHistoryLogs(proj);

                return (
                  <React.Fragment key={proj.id}>
                    <tr className="hover:bg-slate-50/50">
                    {/* Code & Name */}
                    <td className="p-4 space-y-1 max-w-[240px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-extrabold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                          {proj.code}
                        </span>
                        <span className="text-[10px] text-gray-400">{proj.startDate}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{proj.name}</div>
                      {proj.company && (
                        <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                          🏢 {proj.company}
                        </div>
                      )}
                      {proj.poNo && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.poNo.split(",").map((po) => po.trim()).filter(Boolean).map((po, idx) => (
                            <span key={idx} className="text-[9px] bg-blue-50 text-blue-700 font-extrabold border border-blue-200/50 px-2 py-0.5 rounded font-mono shadow-xs flex items-center gap-0.5" title={po}>
                              📋 {po}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.notes && <p className="text-[10px] text-gray-400 line-clamp-1 italic">{proj.notes}</p>}

                      {/* Target Deadline Visual Warning Indicator */}
                      {proj.targetCompletionDate && (
                        <div className="mt-1.5 pt-1 border-t border-slate-100">
                          {proj.status === ProjectStatus.PROGRES && deadlineDaysLeft !== null && deadlineDaysLeft <= 7 && deadlineDaysLeft >= 0 ? (
                            <div
                              title={`Target penyelesaian: ${proj.targetCompletionDate}`}
                              className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-900 px-2 py-1 rounded-lg text-[10px] font-extrabold w-fit shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                {deadlineDaysLeft === 0 ? "Target Hari Ini!" : `Mendekati Deadline (H-${deadlineDaysLeft})`}
                              </span>
                            </div>
                          ) : proj.status === ProjectStatus.PROGRES && deadlineDaysLeft !== null && deadlineDaysLeft < 0 ? (
                            <div
                              title={`Target penyelesaian: ${proj.targetCompletionDate}`}
                              className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/40 text-red-900 px-2 py-1 rounded-lg text-[10px] font-extrabold w-fit shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>Lewat Target ({Math.abs(deadlineDaysLeft)} hr)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                Target: <strong className="font-mono text-slate-700">{proj.targetCompletionDate}</strong>
                                {deadlineDaysLeft !== null && ` (H-${deadlineDaysLeft})`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Log Riwayat Quick Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedLogProjectId(expandedLogProjectId === proj.id ? null : proj.id)}
                        className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border shadow-2xs ${
                          expandedLogProjectId === proj.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                        }`}
                      >
                        <History className="w-3 h-3" />
                        <span>Log Riwayat ({getProjectHistoryLogs(proj).length})</span>
                        {expandedLogProjectId === proj.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>

                    {/* Manager & PIC */}
                    <td className="p-4 space-y-1">
                      <p className="font-semibold text-gray-800">{proj.manager}</p>
                      <p className="text-[10px] text-gray-400">PIC: {proj.pic}</p>
                    </td>

                    {/* Contract Base */}
                    <td className="p-4 space-y-1 font-mono">
                      <p className="font-bold text-gray-900 text-sm">{formatIDR(contractBase)}</p>
                      <p className="text-[9px] text-gray-400 border-b border-gray-100 pb-1">Ppn {ppnRate}% / Pph {pphRate}%</p>
                      <div className="text-[10px] text-gray-500 space-y-0.5 pt-1 font-sans">
                        {proj.customContractItems && proj.customContractItems.length > 0 ? (
                          proj.customContractItems
                            .filter((item) => (item.value || 0) > 0)
                            .map((item, index) => (
                              <div key={`${item.id || ''}-${index}`} className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{item.name || `Item ${index + 1}`}:</span>
                                <span className="font-mono font-medium">{formatIDR(item.value)}</span>
                              </div>
                            ))
                        ) : (
                          <>
                            {proj.contractValue?.piping ? (
                              <div className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{proj.contractNames?.piping || "Piping"}:</span>
                                <span className="font-mono font-medium">{formatIDR(proj.contractValue.piping)}</span>
                              </div>
                            ) : null}
                            {proj.contractValue?.electrical ? (
                              <div className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{proj.contractNames?.electrical || "Electrical"}:</span>
                                <span className="font-mono font-medium">{formatIDR(proj.contractValue.electrical)}</span>
                              </div>
                            ) : null}
                            {proj.contractValue?.mechanical ? (
                              <div className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{proj.contractNames?.mechanical || "Mechanical"}:</span>
                                <span className="font-mono font-medium">{formatIDR(proj.contractValue.mechanical)}</span>
                              </div>
                            ) : null}
                            {proj.contractValue?.scafolder ? (
                              <div className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{proj.contractNames?.scafolder || "Scafolder"}:</span>
                                <span className="font-mono font-medium">{formatIDR(proj.contractValue.scafolder)}</span>
                              </div>
                            ) : null}
                            {proj.contractValue?.welder ? (
                              <div className="flex justify-between gap-3 text-[9px]">
                                <span className="text-gray-400">{proj.contractNames?.welder || "Welder"}:</span>
                                <span className="font-mono font-medium">{formatIDR(proj.contractValue.welder)}</span>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Total Pengajuan Petty Cash */}
                    <td className="p-4 space-y-1 font-mono">
                      <p className="font-bold text-slate-950 text-sm">{formatIDR(totalRequestAmount)}</p>
                      <div className="flex flex-col gap-1 text-[9px] mt-1 font-sans">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 w-fit">
                          Disetujui: {formatIDR(approvedRequestAmount)}
                        </span>
                        <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50 w-fit">
                          Pending: {formatIDR(pendingRequestAmount)}
                        </span>
                      </div>
                    </td>

                    {/* Actual spending */}
                    <td className="p-4 font-mono">
                      <p className={`font-bold ${isOverBudget ? "text-red-600" : isNearingThreshold ? "text-amber-500" : "text-slate-800"}`}>
                        {formatIDR(totalSpending)}
                      </p>
                      <p className="text-[9px] text-gray-400">Voucher Pengeluaran</p>
                    </td>

                    {/* Estimasi Profit */}
                    <td className="p-4 space-y-1 font-mono">
                      <p className={`font-bold text-sm ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {formatIDR(profit)}
                      </p>
                      <div className="text-[10px] space-y-0.5 font-sans mt-1">
                        <div className="flex justify-between gap-1 text-[9px]">
                          <span className="text-gray-400">Margin Aktual:</span>
                          <span className={`font-extrabold ${profitMargin >= targetMargin ? "text-emerald-600" : "text-amber-600"}`}>
                            {profitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-1 text-[9px]">
                          <span className="text-gray-400">Rencana Target:</span>
                          <span className="text-slate-600 font-semibold">{targetMargin}%</span>
                        </div>
                        <div className="text-[9px] text-blue-700 font-semibold pt-0.5 border-t border-gray-100/60 mt-1">
                          Net Kontrak: {formatIDR(netValue)}
                        </div>
                      </div>
                    </td>

                    {/* Spend Ratio Progress Bar */}
                    <td className="p-4 max-w-[180px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`font-bold ${isOverBudget ? "text-red-600" : isNearingThreshold ? "text-amber-500" : "text-emerald-600"}`}>
                          {spendRatio.toFixed(1)}%
                        </span>
                        <span className="text-gray-400 text-[9px]">Alarm: {proj.budgetThresholdPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          className={`h-full rounded-l-full ${
                            isOverBudget ? "bg-red-600" : isNearingThreshold ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(spendRatio, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block ${
                          proj.status === ProjectStatus.PROGRES
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : proj.status === ProjectStatus.CLOSING
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>

                    {/* Actions */}
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* PROGRES status */}
                          <button
                            title="Set ke Progres"
                            disabled={proj.status === ProjectStatus.PROGRES}
                            onClick={() => updateStatus(proj.id, ProjectStatus.PROGRES)}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              proj.status === ProjectStatus.PROGRES
                                ? "text-amber-400 bg-amber-50"
                                : "text-gray-400 hover:text-amber-500 hover:bg-gray-100"
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>

                          {/* CLOSING status */}
                          <button
                            title="Set ke Closing"
                            disabled={proj.status === ProjectStatus.CLOSING}
                            onClick={() => updateStatus(proj.id, ProjectStatus.CLOSING)}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              proj.status === ProjectStatus.CLOSING
                                ? "text-emerald-500 bg-emerald-50"
                                : "text-gray-400 hover:text-emerald-500 hover:bg-gray-100"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* CANCEL status */}
                          <button
                            title="Batalkan Proyek"
                            disabled={proj.status === ProjectStatus.CANCEL}
                            onClick={() => updateStatus(proj.id, ProjectStatus.CANCEL)}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              proj.status === ProjectStatus.CANCEL
                                ? "text-red-500 bg-red-50"
                                : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* EDIT Project */}
                          <button
                            title="Edit Proyek"
                            onClick={() => handleStartEdit(proj)}
                            className="p-1.5 rounded-xl cursor-pointer text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* DELETE Project */}
                          <button
                            title="Hapus Proyek"
                            onClick={() => triggerDeleteProject(proj.id, proj.name)}
                            className="p-1.5 rounded-xl cursor-pointer text-red-500 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick trigger slide adjustment */}
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          <span className="text-[9px] text-gray-400">Alarm:</span>
                          <input
                            type="range"
                            min="60"
                            max="95"
                            step="5"
                            value={proj.budgetThresholdPercent}
                            onChange={(e) => updateThreshold(proj.id, Number(e.target.value))}
                            className="w-16 accent-blue-600 h-1"
                          />
                          <span className="text-[9px] font-bold text-gray-700 w-6 text-right">
                            {proj.budgetThresholdPercent}%
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expandable Log Riwayat Row (Shows 5 Latest Changes) */}
                  {expandedLogProjectId === proj.id && (
                    <tr className="bg-slate-50/90 border-b-2 border-blue-200/60 animate-in fade-in duration-200">
                      <td colSpan={isReadOnly ? 8 : 9} className="p-4 sm:p-5">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
                                <History className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                                  <span>📜 Log Riwayat Perubahan & Transaksi (5 Terakhir)</span>
                                  <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 font-mono">
                                    {proj.code}
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Transparansi pembaruan anggaran, pengajuan, voucher pengeluaran, dan riwayat aktivitas proyek <strong>{proj.name}</strong>.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedLogProjectId(null)}
                              className="self-start sm:self-auto text-xs text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-xl hover:bg-slate-100 flex items-center gap-1 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                            >
                              <span>Tutup Log</span>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* List of 5 History Logs */}
                          <div className="grid grid-cols-1 gap-2">
                            {projLogs.length > 0 ? (
                              projLogs.map((log, idx) => {
                                let logIcon = <Activity className="w-3.5 h-3.5 text-blue-600" />;
                                let badgeBg = "bg-blue-50 text-blue-700 border-blue-200";

                                if (log.type === "petycash_expense") {
                                  logIcon = <Receipt className="w-3.5 h-3.5 text-emerald-600" />;
                                  badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                } else if (log.type === "petycash_request") {
                                  logIcon = <DollarSign className="w-3.5 h-3.5 text-amber-600" />;
                                  badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
                                } else if (log.type === "invoice") {
                                  logIcon = <FileText className="w-3.5 h-3.5 text-purple-600" />;
                                  badgeBg = "bg-purple-50 text-purple-700 border-purple-200";
                                } else if (log.type === "po") {
                                  logIcon = <Package className="w-3.5 h-3.5 text-indigo-600" />;
                                  badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                                } else if (log.type === "milestone") {
                                  logIcon = <Calendar className="w-3.5 h-3.5 text-sky-600" />;
                                  badgeBg = "bg-sky-50 text-sky-200 text-sky-700";
                                }

                                return (
                                  <div
                                    key={log.id || idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-blue-200 transition-all text-xs"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                                        {logIcon}
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border font-mono ${badgeBg}`}>
                                            {log.action}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {log.date}
                                          </span>
                                        </div>
                                        <p className="text-slate-800 font-semibold text-xs mt-1 leading-snug">
                                          {log.description}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="text-[10px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-center flex items-center gap-1 font-sans">
                                      <UserCheck className="w-3 h-3 text-slate-400" />
                                      <span>Oleh: <strong className="text-slate-700 font-semibold">{log.pic}</strong></span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Belum ada data log riwayat transaksi atau perubahan data untuk proyek ini.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs text-gray-400 italic bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <span>Tidak ada proyek yang cocok dengan pencarian "{searchQuery}"</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Hapus Proyek Secara Permanen?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus proyek <span className="font-bold text-gray-800">"{projectToDelete.name}"</span>?
                </p>
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-[11px] text-red-700 leading-relaxed text-left font-medium">
                  ⚠️ Seluruh data pengeluaran (Petty Cash), Purchase Order (PO), pengajuan kasbon, dan invoice yang berkaitan dengan proyek ini akan dihapus secara permanen dari database.
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8"
          >
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">Edit Rincian Proyek</h3>
                  <p className="text-[10px] text-blue-100">ID Proyek: {editingProject.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-white hover:bg-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                  <span>{validationError}</span>
                  <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Nama Proyek</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-bold text-gray-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Kode Registrasi Proyek</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Project Manager / PM</label>
                  <input
                    type="text"
                    required
                    value={editManager}
                    onChange={(e) => setEditManager(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">PIC Lapangan</label>
                  <input
                    type="text"
                    value={editPic}
                    onChange={(e) => setEditPic(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Target Selesai
                  </label>
                  <input
                    type="date"
                    value={editTargetCompletionDate}
                    onChange={(e) => setEditTargetCompletionDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">No. Purchase Order (PO)</label>
                  <input
                    type="text"
                    value={editPoNo}
                    onChange={(e) => setEditPoNo(e.target.value)}
                    placeholder="Contoh: PO-2026-001"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono text-blue-700 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Perusahaan</label>
                  <select
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-gray-800 font-semibold"
                  >
                    <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
                    <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
                    <option value="Lainnya">Lainnya (Ketik Manual)</option>
                  </select>
                  {editCompany === "Lainnya" && (
                    <input
                      type="text"
                      required
                      placeholder="Nama Perusahaan..."
                      value={editCustomCompany}
                      onChange={(e) => setEditCustomCompany(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white mt-1.5"
                    />
                  )}
                </div>
              </div>

              {/* Taxation & Alert Rules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Persentase Target Profit (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editExpectedProfitPercent}
                    onChange={(e) => setEditExpectedProfitPercent(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Alarm Batas Pengeluaran (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={editBudgetThresholdPercent}
                    onChange={(e) => setEditBudgetThresholdPercent(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">PPN (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editPpnPercent}
                    onChange={(e) => setEditPpnPercent(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">PPh (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editPphPercent}
                    onChange={(e) => setEditPphPercent(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Dynamic Contract Items / Values Section */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Anggaran Rincian Kontrak Dasar
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <span><strong>Info Sinkronisasi Anggaran:</strong> Rincian nilai kontrak dasar dikelola otomatis secara terpusat melalui tab <strong>Manajemen PO</strong>. Anda tidak dapat mengedit rincian ini secara manual di sini untuk menjaga konsistensi keuangan proyek.</span>
                </div>

                {editingProject.customContractItems && editingProject.customContractItems.length > 0 ? (
                  /* RENDER CUSTOM CONTRACT ITEMS */
                  <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {editCustomContractItems.filter((item) => (item.value || 0) > 0).length > 0 ? (
                      editCustomContractItems
                        .filter((item) => (item.value || 0) > 0)
                        .map((item, index) => (
                          <div key={`${item.id || ''}-${index}`} className="flex gap-2 items-center">
                            <input
                              type="text"
                              required
                              disabled
                              placeholder="Nama item"
                              value={item.name}
                              className="flex-[2] bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 cursor-not-allowed"
                            />
                            <div className="flex-[1.5] relative font-mono font-bold text-gray-500">
                              <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                              <input
                                type="number"
                                min="0"
                                required
                                disabled
                                placeholder="Nilai Anggaran"
                                value={item.value || ""}
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                              />
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-400 font-medium">
                        Belum ada rincian kontrak. Hubungkan PO di tab Manajemen PO untuk mengisi rincian.
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 text-xs text-gray-600">
                      <span className="font-bold">Total Nilai Kontrak (Custom):</span>
                      <span className="font-extrabold font-mono text-sm text-blue-700">
                        {formatIDR(editCustomContractItems.reduce((s, x) => s + Number(x.value || 0), 0))}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* RENDER STANDARD BREAKDOWN VALUES */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600 flex justify-between">
                        <span>Label Piping:</span>
                        <input
                          type="text"
                          disabled
                          value={editPipingName}
                          onChange={(e) => setEditPipingName(e.target.value)}
                          className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-24 text-right cursor-not-allowed"
                        />
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          disabled
                          value={editPipingVal}
                          onChange={(e) => setEditPipingVal(Number(e.target.value))}
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600 flex justify-between">
                        <span>Label Electrical:</span>
                        <input
                          type="text"
                          disabled
                          value={editElectricalName}
                          onChange={(e) => setEditElectricalName(e.target.value)}
                          className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-24 text-right cursor-not-allowed"
                        />
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          disabled
                          value={editElectricalVal}
                          onChange={(e) => setEditElectricalVal(Number(e.target.value))}
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600 flex justify-between">
                        <span>Label Mechanical:</span>
                        <input
                          type="text"
                          disabled
                          value={editMechanicalName}
                          onChange={(e) => setEditMechanicalName(e.target.value)}
                          className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-24 text-right cursor-not-allowed"
                        />
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          disabled
                          value={editMechanicalVal}
                          onChange={(e) => setEditMechanicalVal(Number(e.target.value))}
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600 flex justify-between">
                        <span>Label Scafolder:</span>
                        <input
                          type="text"
                          disabled
                          value={editScafolderName}
                          onChange={(e) => setEditScafolderName(e.target.value)}
                          className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-24 text-right cursor-not-allowed"
                        />
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          disabled
                          value={editScafolderVal}
                          onChange={(e) => setEditScafolderVal(Number(e.target.value))}
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600 flex justify-between">
                        <span>Label Welder:</span>
                        <input
                          type="text"
                          disabled
                          value={editWelderName}
                          onChange={(e) => setEditWelderName(e.target.value)}
                          className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-24 text-right cursor-not-allowed"
                        />
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          disabled
                          value={editWelderVal}
                          onChange={(e) => setEditWelderVal(Number(e.target.value))}
                          className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 flex justify-between items-center pt-2 border-t border-dashed border-gray-200 text-xs text-gray-600">
                      <span className="font-bold">Total Nilai Kontrak Dasar:</span>
                      <span className="font-extrabold font-mono text-sm text-blue-700">
                        {formatIDR(
                          Number(editPipingVal) +
                          Number(editElectricalVal) +
                          Number(editMechanicalVal) +
                          Number(editScafolderVal) +
                          Number(editWelderVal)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-700">Catatan Tambahan Proyek</label>
                <textarea
                  rows={2}
                  placeholder="Ketikan rincian singkat, lokasi kerja, deskripsi tambahan..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="border border-gray-200 text-gray-600 px-4 py-2.5 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
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

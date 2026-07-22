/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import jsPDF from "jspdf";
import { Project, Transaction, Category, ProjectStatus } from "../types";
import { COMPANY_INFO } from "../data";
import { Plus, ListFilter, Search, FileText, ShoppingBag, Trash2, HelpCircle, AlertTriangle, ShieldCheck, Landmark, Briefcase, Percent, CheckCircle2, Coins, Edit, Download } from "lucide-react";
import { motion } from "motion/react";
import PdfViewerModal from "./PdfViewerModal";

interface PurchaseOrderManagerProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  selectedProjectId: string;
  isReadOnly?: boolean;
  onAddActivity?: (
    type: "project" | "po" | "petycash_request" | "petycash_expense" | "invoice",
    action: string,
    description: string,
    pic: string,
    projectId?: string
  ) => void;
}

export default function PurchaseOrderManager({
  projects,
  setProjects,
  transactions,
  setTransactions,
  selectedProjectId,
  onAddActivity,
  isReadOnly = false,
}: PurchaseOrderManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingPoId, setEditingPoId] = React.useState<string | null>(null);
  const isRestoringRef = React.useRef(false);

  // Link to existing project state
  const [linkProjectId, setLinkProjectId] = React.useState<string>("new");

  // Form Fields
  const [poNo, setPoNo] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectCode, setProjectCode] = React.useState("");
  const [supplier, setSupplier] = React.useState(""); // Owner / Client
  const [pic, setPic] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);

  // PDF Upload states
  const [pdfFileBase64, setPdfFileBase64] = React.useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedPdfPreview, setSelectedPdfPreview] = React.useState<{ name: string; data: string } | null>(null);

  // Sync with selected existing project
  React.useEffect(() => {
    if (isRestoringRef.current || editingPoId) return;
    if (linkProjectId && linkProjectId !== "new") {
      const foundProj = projects.find((p) => p.id === linkProjectId);
      if (foundProj) {
        setProjectName(foundProj.name);
        setProjectCode(foundProj.code);
        setPic(foundProj.pic || foundProj.manager || "");
        setCompany(foundProj.company || "CV. Mandiri Cipta Jaya");
        const isHoOrEjt = foundProj.name.toUpperCase().includes("HO") || (foundProj.code && foundProj.code.toUpperCase().includes("HO")) || foundProj.name.toUpperCase().includes("EJT");
        setPpnPercentInput(foundProj.ppnPercent !== undefined ? foundProj.ppnPercent : (isHoOrEjt ? 0 : 11));
        setPphPercentInput(foundProj.pphPercent !== undefined ? foundProj.pphPercent : (isHoOrEjt ? 0 : 4));
        
        // Populate contract items for the NEW PO - starting at 0 so they can enter the new PO's nominal values
        let items = [];
        if (foundProj.customContractItems && foundProj.customContractItems.length > 0) {
          items = foundProj.customContractItems.map((item) => ({
            id: item.id,
            name: item.name,
            value: 0,
          }));
        } else {
          items = [
            { id: "piping", name: foundProj.contractNames?.piping || "Piping", value: 0 },
            { id: "electrical", name: foundProj.contractNames?.electrical || "Electrical", value: 0 },
            { id: "mechanical", name: foundProj.contractNames?.mechanical || "Mechanical", value: 0 },
            { id: "scafolder", name: foundProj.contractNames?.scafolder || "Scafolder", value: 0 },
            { id: "welder", name: foundProj.contractNames?.welder || "Welder", value: 0 },
          ];
        }
        setContractItems(items);
      }
    } else if (linkProjectId === "new") {
      setProjectName("");
      setProjectCode("");
      setPic("");
      setContractItems([
        { id: "piping", name: "Piping", value: 0 },
        { id: "electrical", name: "Electrical", value: 0 },
        { id: "mechanical", name: "Mechanical", value: 0 },
        { id: "scafolder", name: "Scafolder", value: 0 },
        { id: "welder", name: "Welder", value: 0 },
      ]);
    }
  }, [linkProjectId, projects]);

  // Dynamic Contract Breakdown Items
  const [contractItems, setContractItems] = React.useState<Array<{ id: string; name: string; value: number }>>([
    { id: "piping", name: "Piping", value: 0 },
    { id: "electrical", name: "Electrical", value: 0 },
    { id: "mechanical", name: "Mechanical", value: 0 },
    { id: "scafolder", name: "Scafolder", value: 0 },
    { id: "welder", name: "Welder", value: 0 },
  ]);

  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("Waiting PO");

  const [company, setCompany] = React.useState("CV. Mandiri Cipta Jaya");
  const [customCompany, setCustomCompany] = React.useState("");
  const [ppnPercentInput, setPpnPercentInput] = React.useState<number>(11);
  const [pphPercentInput, setPphPercentInput] = React.useState<number>(4);

  // HO Cut automatic / manual settings
  const [applyHoCut, setApplyHoCut] = React.useState(true);
  const [hoPercent, setHoPercent] = React.useState(2);
  const [hoCutValue, setHoCutValue] = React.useState(0);

  const rawContractSum = contractItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  React.useEffect(() => {
    if (applyHoCut) {
      setHoCutValue(Math.round(rawContractSum * (hoPercent / 100)));
    } else {
      setHoCutValue(0);
    }
  }, [rawContractSum, applyHoCut]);

  // Filter States
  const [filterProject, setFilterProject] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Custom Modal Confirmation for Delete & Alert States
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [poToDelete, setPoToDelete] = React.useState<string | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // AUTO-SAVE & AUTO-LOAD DRAFT FOR PURCHASE ORDER FORM
  React.useEffect(() => {
    const savedDraft = localStorage.getItem("purchase_order_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft) {
          isRestoringRef.current = true;
          if (draft.linkProjectId) setLinkProjectId(draft.linkProjectId);
          if (draft.poNo) setPoNo(draft.poNo);
          if (draft.projectName) setProjectName(draft.projectName);
          if (draft.projectCode) setProjectCode(draft.projectCode);
          if (draft.supplier) setSupplier(draft.supplier);
          if (draft.pic) setPic(draft.pic);
          if (draft.date) setDate(draft.date);
          if (draft.contractItems) setContractItems(draft.contractItems);
          if (draft.description) setDescription(draft.description);
          if (draft.status) setStatus(draft.status);
          if (draft.company) setCompany(draft.company);
          if (draft.customCompany) setCustomCompany(draft.customCompany);
          if (draft.pphPercentInput !== undefined) setPphPercentInput(draft.pphPercentInput);
          if (draft.showAddForm !== undefined) setShowAddForm(draft.showAddForm);
          if (draft.applyHoCut !== undefined) setApplyHoCut(draft.applyHoCut);
          if (draft.hoPercent !== undefined) setHoPercent(draft.hoPercent);
          if (draft.hoCutValue !== undefined) setHoCutValue(draft.hoCutValue);
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        }
      } catch (err) {
        console.error("Error loading purchase order draft", err);
      }
    }
  }, []);

  React.useEffect(() => {
    if (editingPoId) return;
    const draft = {
      linkProjectId,
      poNo,
      projectName,
      projectCode,
      supplier,
      pic,
      date,
      contractItems,
      description,
      status,
      company,
      customCompany,
      pphPercentInput,
      showAddForm,
      applyHoCut,
      hoPercent,
      hoCutValue
    };
    localStorage.setItem("purchase_order_draft", JSON.stringify(draft));
  }, [
    linkProjectId,
    poNo,
    projectName,
    projectCode,
    supplier,
    pic,
    date,
    contractItems,
    description,
    status,
    company,
    customCompany,
    pphPercentInput,
    showAddForm,
    applyHoCut,
    hoPercent,
    hoCutValue,
    editingPoId
  ]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      setValidationError("File harus berformat PDF!");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setValidationError("Ukuran file PDF maksimal adalah 15MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setPdfFileBase64(e.target.result);
        setPdfFileName(file.name);
        setValidationError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateDummyPdf = (name: string) => {
    try {
      const totalVal = contractItems.reduce((acc, curr) => acc + (curr.value || 0), 0);
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CV. MANDIRI CIPTA JAYA", 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DOKUMEN PURCHASE ORDER (PO)", 20, 30);
      doc.setLineWidth(0.5);
      doc.line(20, 33, 190, 33);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Nomor PO: ${poNo || "MCJ-PO-2026-001"}`, 20, 43);
      doc.text(`Tanggal: ${date || new Date().toISOString().split("T")[0]}`, 20, 50);
      doc.text(`Supplier / Vendor: ${supplier || "PT. Supplier Utama"}`, 20, 57);
      doc.text(`Project: ${projectName || "Project General"}`, 20, 64);
      doc.text(`Total Nilai PO: Rp ${(totalVal || 0).toLocaleString("id-ID")}`, 20, 71);
      doc.text("Status: RESMI TERVERIFIKASI SISTEM", 20, 78);

      doc.setFont("helvetica", "bold");
      doc.text("Rincian Pekerjaan / Material PO:", 20, 90);
      doc.setFont("helvetica", "normal");

      let y = 98;
      if (contractItems && contractItems.length > 0) {
        contractItems.forEach((item, idx) => {
          doc.text(`${idx + 1}. ${item.name || "Item Material/Jasa"}: Rp ${(item.value || 0).toLocaleString("id-ID")}`, 25, y);
          y += 7;
        });
      } else {
        doc.text("1. Pembelian Material & Jasa Konstruksi Lapangan", 25, y);
        y += 7;
      }

      doc.setFontSize(8);
      doc.text("Dokumen ini dihasilkan secara otomatis dan dapat diverifikasi oleh CV. Mandiri Cipta Jaya.", 20, y + 20);

      const pdfDataUri = doc.output("datauristring");
      setPdfFileBase64(pdfDataUri);
      setPdfFileName(name);
    } catch (e) {
      console.error("jsPDF generation error:", e);
    }
  };

  const handleAddContractItem = () => {
    setContractItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name: "", value: 0 },
    ]);
  };

  const handleUpdateContractItemName = (id: string, name: string) => {
    setContractItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const handleUpdateContractItemValue = (id: string, value: number) => {
    setContractItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
  };

  const handleRemoveContractItem = (id: string) => {
    setContractItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Generate automatic PO Number placeholder
  React.useEffect(() => {
    if (showAddForm && !poNo) {
      const existingPOs = transactions.filter((t) => t.type === "PO");
      const nextNum = existingPOs.length + 1;
      setPoNo(`PO-OWNER-${String(nextNum).padStart(3, "0")}-2026`);
    }
  }, [showAddForm, transactions]);

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();

    if (!poNo || !projectName || !projectCode || !supplier || !pic || !description) {
      setValidationError("Harap lengkapi semua isian wajib (Nomor PO, Nama Proyek, Kode Proyek, Owner / Client, PIC, Deskripsi)!");
      return;
    }

    const totalContractValue = contractItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
    if (totalContractValue <= 0) {
      setValidationError("Total Nilai Rincian Kontrak harus lebih dari Rp 0!");
      return;
    }

    setValidationError(null);

    const oldPO = editingPoId ? transactions.find(t => t.id === editingPoId) : null;
    let projectsTemp = [...projects];

    // Ensure HO MCJ and HO EJT projects exist
    let hasHoMcj = projectsTemp.some((p) => p.name.toUpperCase().trim() === "HO MCJ" || p.code.toUpperCase().trim() === "HO.MCJ.2026");
    if (!hasHoMcj) {
      const hoMcjProject: Project = {
        id: "proj-ho-mcj",
        name: "HO MCJ",
        code: "HO.MCJ.2026",
        manager: "Direksi",
        pic: "Direksi",
        status: ProjectStatus.PROGRES,
        startDate: "2026-01-01",
        expectedProfitPercent: 100,
        contractValue: { piping: 0, electrical: 0, mechanical: 0, scafolder: 0, welder: 0 },
        ppnPercent: 0,
        pphPercent: 0,
        budgetThresholdPercent: 100,
        company: "CV. Mandiri Cipta Jaya",
        customContractItems: [],
        notes: "Head Office CV. Mandiri Cipta Jaya"
      };
      projectsTemp = [hoMcjProject, ...projectsTemp];
    }

    let hasHoEjt = projectsTemp.some((p) => p.name.toUpperCase().trim() === "HO EJT" || p.code.toUpperCase().trim() === "HO.EJT.2026");
    if (!hasHoEjt) {
      const hoEjtProject: Project = {
        id: "proj-ho-ejt",
        name: "HO EJT",
        code: "HO.EJT.2026",
        manager: "Direksi",
        pic: "Direksi",
        status: ProjectStatus.PROGRES,
        startDate: "2026-01-01",
        expectedProfitPercent: 100,
        contractValue: { piping: 0, electrical: 0, mechanical: 0, scafolder: 0, welder: 0 },
        ppnPercent: 0,
        pphPercent: 0,
        budgetThresholdPercent: 100,
        company: "PT. Elqia Jaya Teknik",
        customContractItems: [],
        notes: "Head Office PT. Elqia Jaya Teknik"
      };
      projectsTemp = [hoEjtProject, ...projectsTemp];
    }

    // If editing, subtract old PO values from the old project first to maintain consistency
    if (oldPO && oldPO.projectId) {
      const oldProjId = oldPO.projectId;
      const oldItemsToSubtract = oldPO.contractItems || [];

      projectsTemp = projectsTemp.map((proj) => {
        if (proj.id === oldProjId) {
          let updatedCustomItems = proj.customContractItems
            ? proj.customContractItems.map((item) => ({ ...item }))
            : [];
          oldItemsToSubtract.forEach((subItem) => {
            const match = updatedCustomItems.find(
              (item) => item.name.toLowerCase().trim() === subItem.name.toLowerCase().trim()
            );
            if (match) {
              match.value = Math.max(0, Number(match.value || 0) - Number(subItem.value || 0));
            }
          });

          const subPiping = Number(oldItemsToSubtract.find(i => i.name.toLowerCase().includes("piping") || i.id === "piping" || i.id === "1")?.value || 0);
          const subElectrical = Number(oldItemsToSubtract.find(i => i.name.toLowerCase().includes("elect") || i.id === "electrical" || i.id === "2")?.value || 0);
          const subMechanical = Number(oldItemsToSubtract.find(i => i.name.toLowerCase().includes("mech") || i.id === "mechanical" || i.id === "3")?.value || 0);
          const subScafolder = Number(oldItemsToSubtract.find(i => i.name.toLowerCase().includes("scaf") || i.id === "scafolder" || i.id === "4")?.value || 0);
          const subWelder = Number(oldItemsToSubtract.find(i => i.name.toLowerCase().includes("weld") || i.id === "welder" || i.id === "5")?.value || 0);

          const pipingVal = Math.max(0, (proj.contractValue?.piping || 0) - subPiping);
          const electricalVal = Math.max(0, (proj.contractValue?.electrical || 0) - subElectrical);
          const mechanicalVal = Math.max(0, (proj.contractValue?.mechanical || 0) - subMechanical);
          const scafolderVal = Math.max(0, (proj.contractValue?.scafolder || 0) - subScafolder);
          const welderVal = Math.max(0, (proj.contractValue?.welder || 0) - subWelder);

          let existingPoList = proj.poNo ? proj.poNo.split(", ").map(p => p.trim()) : [];
          if (oldPO.poNo) {
            existingPoList = existingPoList.filter(p => p !== oldPO.poNo.trim());
          }
          const updatedPoNo = existingPoList.join(", ");

          return {
            ...proj,
            poNo: updatedPoNo,
            customContractItems: updatedCustomItems,
            contractValue: {
              piping: pipingVal,
              electrical: electricalVal,
              mechanical: mechanicalVal,
              scafolder: scafolderVal,
              welder: welderVal,
            }
          };
        }
        return proj;
      });
    }

    const targetProjectId = linkProjectId === "new" ? (oldPO ? oldPO.projectId : `proj-${Date.now()}`) : linkProjectId;
    const updatedCompany = company === "Lainnya" ? customCompany : company;

    const cutAmount = applyHoCut ? hoCutValue : 0;
    const finalPoAmount = totalContractValue - cutAmount;
    const targetPoId = editingPoId ? editingPoId : `po-${Date.now()}`;

    let targetHoProj: Project | undefined = undefined;
    if (updatedCompany === "CV. Mandiri Cipta Jaya") {
      targetHoProj = projectsTemp.find((p) => p.name.toUpperCase().trim() === "HO MCJ" || p.code.toUpperCase().trim() === "HO.MCJ.2026");
    } else if (updatedCompany === "PT. Elqia Jaya Teknik") {
      targetHoProj = projectsTemp.find((p) => p.name.toUpperCase().trim() === "HO EJT" || p.code.toUpperCase().trim() === "HO.EJT.2026");
    }

    // Allocate the HO Cut as Contract Value (Nilai Kontrak) of the HO project instead of an Invoice transaction
    if (targetHoProj) {
      projectsTemp = projectsTemp.map((proj) => {
        if (proj.id === targetHoProj!.id) {
          let existingItems = proj.customContractItems ? [...proj.customContractItems] : [];
          
          // Remove old cut item from this PO (if editing or previously added)
          existingItems = existingItems.filter(
            (item) => item.id !== `ho-cut-${targetPoId}` && item.id !== `ho-cut-${editingPoId}`
          );

          // If there is an active HO cut, push the new value
          if (cutAmount > 0) {
            existingItems.push({
              id: `ho-cut-${targetPoId}`,
              name: `Potongan HO ${hoPercent}% PO ${poNo}`,
              value: cutAmount
            });
          }

          return {
            ...proj,
            customContractItems: existingItems
          };
        }
        return proj;
      });
    }

    // We do NOT create any Invoice transactions for HO. It is purely mapped to the HO project's Nilai Kontrak.
    const hoTx = null;

    // Apply new values to target project
    if (linkProjectId === "new") {
      const pipingItem = contractItems.find(i => i.name.toLowerCase().includes("piping") || i.id === "piping" || i.id === "1");
      const electricalItem = contractItems.find(i => i.name.toLowerCase().includes("elect") || i.id === "electrical" || i.id === "2");
      const mechanicalItem = contractItems.find(i => i.name.toLowerCase().includes("mech") || i.id === "mechanical" || i.id === "3");
      const scafolderItem = contractItems.find(i => i.name.toLowerCase().includes("scaf") || i.id === "scafolder" || i.id === "4");
      const welderItem = contractItems.find(i => i.name.toLowerCase().includes("weld") || i.id === "welder" || i.id === "5");

      const existingProj = projectsTemp.find(p => p.id === targetProjectId);
      if (existingProj) {
        projectsTemp = projectsTemp.map(proj => {
          if (proj.id === targetProjectId) {
            return {
              ...proj,
              name: projectName,
              code: projectCode,
              pic: pic,
              company: updatedCompany,
              poNo: poNo,
              customContractItems: contractItems,
              contractValue: {
                piping: Number(pipingItem?.value || 0),
                electrical: Number(electricalItem?.value || 0),
                mechanical: Number(mechanicalItem?.value || 0),
                scafolder: Number(scafolderItem?.value || 0),
                welder: Number(welderItem?.value || 0),
              }
            };
          }
          return proj;
        });
      } else {
        const newProject: Project = {
          id: targetProjectId,
          name: projectName,
          code: projectCode,
          manager: pic,
          pic: pic,
          status: ProjectStatus.PROGRES,
          startDate: date,
          expectedProfitPercent: 35,
          contractValue: {
            piping: Number(pipingItem?.value || 0),
            electrical: Number(electricalItem?.value || 0),
            mechanical: Number(mechanicalItem?.value || 0),
            scafolder: Number(scafolderItem?.value || 0),
            welder: Number(welderItem?.value || 0),
          },
          contractNames: {
            piping: pipingItem?.name || "Piping",
            electrical: electricalItem?.name || "Electrical",
            mechanical: mechanicalItem?.name || "Mechanical",
            scafolder: scafolderItem?.name || "Scafolder",
            welder: welderItem?.name || "Welder",
          },
          ppnPercent: ppnPercentInput,
          pphPercent: pphPercentInput,
          budgetThresholdPercent: 85,
          notes: description,
          company: updatedCompany,
          poNo: poNo,
          customContractItems: contractItems,
        };
        projectsTemp = [newProject, ...projectsTemp];
      }
    } else {
      projectsTemp = projectsTemp.map((proj) => {
        if (proj.id === linkProjectId) {
          let existingItems = proj.customContractItems ? [...proj.customContractItems] : [];
          if (existingItems.length === 0) {
            existingItems = [
              { id: "piping", name: proj.contractNames?.piping || "Piping", value: proj.contractValue?.piping || 0 },
              { id: "electrical", name: proj.contractNames?.electrical || "Electrical", value: proj.contractValue?.electrical || 0 },
              { id: "mechanical", name: proj.contractNames?.mechanical || "Mechanical", value: proj.contractValue?.mechanical || 0 },
              { id: "scafolder", name: proj.contractNames?.scafolder || "Scafolder", value: proj.contractValue?.scafolder || 0 },
              { id: "welder", name: proj.contractNames?.welder || "Welder", value: proj.contractValue?.welder || 0 },
            ];
          }

          const mergedItems = existingItems.map((item) => ({ ...item }));

          contractItems.forEach((newItem) => {
            const match = mergedItems.find(
              (item) => item.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
            );
            if (match) {
              match.value = Number(match.value || 0) + Number(newItem.value || 0);
            } else {
              const isIdTaken = mergedItems.some((item) => item.id === newItem.id);
              const uniqueId = (isIdTaken || !newItem.id)
                ? `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
                : newItem.id;
              mergedItems.push({
                id: uniqueId,
                name: newItem.name,
                value: Number(newItem.value || 0),
              });
            }
          });

          const poPiping = Number(contractItems.find(i => i.name.toLowerCase().includes("piping") || i.id === "piping" || i.id === "1")?.value || 0);
          const poElectrical = Number(contractItems.find(i => i.name.toLowerCase().includes("elect") || i.id === "electrical" || i.id === "2")?.value || 0);
          const poMechanical = Number(contractItems.find(i => i.name.toLowerCase().includes("mech") || i.id === "mechanical" || i.id === "3")?.value || 0);
          const poScafolder = Number(contractItems.find(i => i.name.toLowerCase().includes("scaf") || i.id === "scafolder" || i.id === "4")?.value || 0);
          const poWelder = Number(contractItems.find(i => i.name.toLowerCase().includes("weld") || i.id === "welder" || i.id === "5")?.value || 0);

          const pipingVal = (proj.contractValue?.piping || 0) + poPiping;
          const electricalVal = (proj.contractValue?.electrical || 0) + poElectrical;
          const mechanicalVal = (proj.contractValue?.mechanical || 0) + poMechanical;
          const scafolderVal = (proj.contractValue?.scafolder || 0) + poScafolder;
          const welderVal = (proj.contractValue?.welder || 0) + poWelder;

          const existingPoList = proj.poNo ? proj.poNo.split(", ").map(p => p.trim()) : [];
          if (poNo && !existingPoList.includes(poNo.trim())) {
            existingPoList.push(poNo.trim());
          }
          const updatedPoNo = existingPoList.join(", ");

          return {
            ...proj,
            name: projectName,
            code: projectCode,
            pic: pic || proj.pic || proj.manager,
            company: updatedCompany,
            poNo: updatedPoNo,
            ppnPercent: ppnPercentInput,
            pphPercent: pphPercentInput,
            customContractItems: mergedItems,
            contractValue: {
              piping: pipingVal,
              electrical: electricalVal,
              mechanical: mechanicalVal,
              scafolder: scafolderVal,
              welder: welderVal,
            },
          };
        }
        return proj;
      });
    }

    setProjects(projectsTemp);

    const finalTransferProof = pdfFileBase64 ? JSON.stringify({ name: pdfFileName, data: pdfFileBase64 }) : "";

    if (editingPoId) {
      setTransactions((prev) => {
        const filtered = prev.filter((t) => t.id !== `po-ho-cut-${editingPoId}`);
        const mapped = filtered.map((t) => {
          if (t.id === editingPoId) {
            return {
              ...t,
              projectId: targetProjectId,
              pic: pic,
              date: date,
              poNo: poNo,
              supplier: supplier,
              status: status,
              description: `Owner PO - ${description}${applyHoCut ? ` (Potongan HO ${hoPercent}%)` : ""}`,
              amount: finalPoAmount,
              contractItems: contractItems,
              company: updatedCompany,
              transferProof: finalTransferProof || undefined,
            };
          }
          return t;
        });
        if (hoTx) {
          return [hoTx, ...mapped];
        }
        return mapped;
      });
    } else {
      const newPO: Transaction = {
        id: targetPoId,
        projectId: targetProjectId,
        type: "PO",
        pic: pic,
        date: date,
        poNo: poNo,
        supplier: supplier,
        status: status,
        description: `Owner PO - ${description}${applyHoCut ? ` (Potongan HO ${hoPercent}%)` : ""}`,
        category: "Material",
        amount: finalPoAmount,
        contractItems: contractItems,
        company: updatedCompany,
        transferProof: finalTransferProof || undefined,
      };
      setTransactions((prev) => {
        const base = [newPO, ...prev];
        if (hoTx) {
          return [hoTx, ...base];
        }
        return base;
      });
    }

    if (onAddActivity) {
      const displayAmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalContractValue);
      const displayCut = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cutAmount);
      const proj = projectsTemp.find((p) => p.id === targetProjectId);
      onAddActivity(
        "po",
        editingPoId ? "Material PO Diperbarui" : "Material PO Tersimpan",
        editingPoId 
          ? `Memperbarui Purchase Order [${poNo}] senilai ${displayAmt}${applyHoCut ? ` (Potongan HO ${hoPercent}%: ${displayCut})` : ""} untuk proyek "${proj ? proj.name : (projectName || "Proyek")}"`
          : `Menginput Purchase Order baru [${poNo}] senilai ${displayAmt}${applyHoCut ? ` (Potongan HO ${hoPercent}%: ${displayCut})` : ""} untuk proyek "${proj ? proj.name : (projectName || "Proyek Baru")}"`,
        pic || "Administrator",
        targetProjectId
      );

      if (targetHoProj && cutAmount > 0) {
        onAddActivity(
          "project",
          "Nilai Kontrak HO Ditambah",
          `Alokasi Nilai Kontrak HO otomatis dari PO [${poNo}] sebesar ${displayCut} (${hoPercent}%) untuk Project ${targetHoProj.name}`,
          "Sistem Otomatis",
          targetHoProj.id
        );
      }
    }

    // Reset Form fields
    setLinkProjectId("new");
    setProjectName("");
    setProjectCode("");
    setPoNo("");
    setSupplier("");
    setPic("");
    setContractItems([
      { id: "piping", name: "Piping", value: 0 },
      { id: "electrical", name: "Electrical", value: 0 },
      { id: "mechanical", name: "Mechanical", value: 0 },
      { id: "scafolder", name: "Scafolder", value: 0 },
      { id: "welder", name: "Welder", value: 0 },
    ]);
    setDescription("");
    setStatus("Waiting PO");
    setCompany("CV. Mandiri Cipta Jaya");
    setCustomCompany("");
    setPpnPercentInput(11);
    setPphPercentInput(4);
    setApplyHoCut(true);
    setHoPercent(2);
    setHoCutValue(0);
    setEditingPoId(null);
    setShowAddForm(false);
    setPdfFileBase64(null);
    setPdfFileName(null);
    setAlertMessage(editingPoId ? `Purchase Order (PO) "${poNo}" berhasil diperbarui.` : `Purchase Order (PO) "${poNo}" berhasil dicatat.`);
  };

  const handleEditPO = (po: Transaction) => {
    setEditingPoId(po.id);
    setLinkProjectId(po.projectId || "");
    setPoNo(po.poNo || "");
    setSupplier(po.supplier || "");
    setPic(po.pic || "");
    setDate(po.date || "");
    
    if (po.contractItems && po.contractItems.length > 0) {
      setContractItems(po.contractItems.map(item => ({ ...item })));
    } else {
      setContractItems([
        { id: "piping", name: "Piping", value: 0 },
        { id: "electrical", name: "Electrical", value: 0 },
        { id: "mechanical", name: "Mechanical", value: 0 },
        { id: "scafolder", name: "Scafolder", value: 0 },
        { id: "welder", name: "Welder", value: 0 },
      ]);
    }
    
    const proj = projects.find((p) => p.id === po.projectId);
    if (proj) {
      setProjectName(proj.name);
      setProjectCode(proj.code || "");
      if (proj.company === "CV. Mandiri Cipta Jaya" || proj.company === "PT. Elqia Jaya Teknik") {
        setCompany(proj.company);
        setCustomCompany("");
      } else if (proj.company) {
        setCompany("Lainnya");
        setCustomCompany(proj.company);
      } else {
        setCompany("CV. Mandiri Cipta Jaya");
        setCustomCompany("");
      }
      const isHoOrEjt = proj.name.toUpperCase().includes("HO") || (proj.code && proj.code.toUpperCase().includes("HO")) || proj.name.toUpperCase().includes("EJT");
      setPpnPercentInput(proj.ppnPercent !== undefined ? proj.ppnPercent : (isHoOrEjt ? 0 : 11));
      setPphPercentInput(proj.pphPercent !== undefined ? proj.pphPercent : (isHoOrEjt ? 0 : 4));
    } else {
      setProjectName("");
      setProjectCode("");
      setCompany("CV. Mandiri Cipta Jaya");
      setCustomCompany("");
      setPpnPercentInput(11);
      setPphPercentInput(4);
    }
    
    setDescription(po.description ? po.description.replace(/^Owner PO - /, "").replace(/\s*\(Potongan HO \d+(\.\d+)?%\)$/, "") : "");
    setStatus(po.status || "Waiting PO");

    if (po.transferProof) {
      try {
        const parsed = JSON.parse(po.transferProof);
        if (parsed && parsed.data) {
          setPdfFileBase64(parsed.data);
          setPdfFileName(parsed.name || "dokumen.pdf");
        } else {
          setPdfFileBase64(po.transferProof);
          setPdfFileName("dokumen.pdf");
        }
      } catch (e) {
        setPdfFileBase64(po.transferProof);
        setPdfFileName("dokumen.pdf");
      }
    } else {
      setPdfFileBase64(null);
      setPdfFileName(null);
    }

    // Check if there is an existing HO cut for this PO (either custom contract item in HO project or a legacy transaction)
    const foundHoItem = projects.flatMap((p) => p.customContractItems || []).find((item) => item.id === `ho-cut-${po.id}`);
    const foundHoTx = transactions.find((t) => t.id === `po-ho-cut-${po.id}`);

    const savedCutAmount = foundHoItem ? foundHoItem.value : (foundHoTx ? Number(foundHoTx.amount) : 0);
    const totalPOBruto = po.contractItems ? po.contractItems.reduce((sum, item) => sum + Number(item.value || 0), 0) : po.amount;

    if (savedCutAmount > 0) {
      setApplyHoCut(true);
      setHoCutValue(savedCutAmount);
      const calculatedPercent = totalPOBruto > 0 ? (savedCutAmount / totalPOBruto) * 100 : 2;
      setHoPercent(Number(calculatedPercent.toFixed(2)));
    } else {
      setApplyHoCut(false);
      setHoCutValue(0);
      setHoPercent(2);
    }

    setShowAddForm(true);
  };

  const triggerDeletePO = (id: string) => {
    setPoToDelete(id);
  };

  const confirmDeletePO = () => {
    if (!poToDelete) return;
    const id = poToDelete;
    const poToDel = transactions.find((t) => t.id === id);
    if (poToDel && poToDel.projectId) {
      const projId = poToDel.projectId;
      const itemsToSubtract = poToDel.contractItems || [];

      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          let updatedCustomItems = proj.customContractItems
            ? proj.customContractItems.map((item) => ({ ...item }))
            : [];
          
          // Clean up any HO cut custom item associated with this PO
          updatedCustomItems = updatedCustomItems.filter((item) => item.id !== `ho-cut-${id}`);

          if (proj.id === projId) {
            // Subtract customContractItems
            itemsToSubtract.forEach((subItem) => {
              const match = updatedCustomItems.find(
                (item) => item.name.toLowerCase().trim() === subItem.name.toLowerCase().trim()
              );
              if (match) {
                match.value = Math.max(0, Number(match.value || 0) - Number(subItem.value || 0));
              }
            });

            // Subtract contractValue categories
            const subPiping = Number(
              itemsToSubtract.find((i) => i.name.toLowerCase().includes("piping") || i.id === "1")?.value || 0
            );
            const subElectrical = Number(
              itemsToSubtract.find((i) => i.name.toLowerCase().includes("elect") || i.id === "2")?.value || 0
            );
            const subMechanical = Number(
              itemsToSubtract.find((i) => i.name.toLowerCase().includes("mech") || i.id === "3")?.value || 0
            );
            const subScafolder = Number(
              itemsToSubtract.find((i) => i.name.toLowerCase().includes("scaf") || i.id === "4")?.value || 0
            );
            const subWelder = Number(
              itemsToSubtract.find((i) => i.name.toLowerCase().includes("weld") || i.id === "5")?.value || 0
            );

            const pipingVal = Math.max(0, (proj.contractValue?.piping || 0) - subPiping);
            const electricalVal = Math.max(0, (proj.contractValue?.electrical || 0) - subElectrical);
            const mechanicalVal = Math.max(0, (proj.contractValue?.mechanical || 0) - subMechanical);
            const scafolderVal = Math.max(0, (proj.contractValue?.scafolder || 0) - subScafolder);
            const welderVal = Math.max(0, (proj.contractValue?.welder || 0) - subWelder);

            // Remove PO Number from project's poNo list
            let updatedPoNo = proj.poNo || "";
            if (poToDel.poNo) {
              const poList = proj.poNo ? proj.poNo.split(", ").map((p) => p.trim()) : [];
              const filteredPoList = poList.filter((p) => p !== poToDel.poNo?.trim());
              updatedPoNo = filteredPoList.join(", ");
            }

            return {
              ...proj,
              poNo: updatedPoNo,
              customContractItems: updatedCustomItems,
              contractValue: {
                piping: pipingVal,
                electrical: electricalVal,
                mechanical: mechanicalVal,
                scafolder: scafolderVal,
                welder: welderVal,
              },
            };
          }
          return {
            ...proj,
            customContractItems: updatedCustomItems
          };
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id && t.id !== `po-ho-cut-${id}`));
    setPoToDelete(null);
    setAlertMessage("Purchase Order (PO) berhasil dihapus.");
  };

  // Filter list of POs
  const poList = transactions.filter((t) => t.type === "PO");

  const filteredPOs = poList.filter((po) => {
    if (filterProject !== "all" && po.projectId !== filterProject) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const picMatch = po.pic?.toLowerCase().includes(q);
      const supplierMatch = po.supplier?.toLowerCase().includes(q);
      const poNoMatch = po.poNo?.toLowerCase().includes(q);
      const descMatch = po.description?.toLowerCase().includes(q);
      return picMatch || supplierMatch || poNoMatch || descMatch;
    }

    return true;
  });

  const totalPOSum = filteredPOs.reduce((sum, po) => sum + po.amount, 0);

  return (
    <div className="space-y-6 font-sans pb-12" id="purchase-order-section">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5.5 h-5.5 text-blue-600" />
            Manajemen Purchase Order (PO) Material &amp; Jasa {isReadOnly && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">ReadOnly</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Registrasi dan pelacakan PO Material atau Jasa yang dibebankan langsung ke anggaran masing-masing proyek.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingPoId(null);
              } else {
                setEditingPoId(null);
                setLinkProjectId("new");
                setProjectName("");
                setProjectCode("");
                setPoNo("");
                setSupplier("");
                setPic("");
                setContractItems([
                  { id: "piping", name: "Piping", value: 0 },
                  { id: "electrical", name: "Electrical", value: 0 },
                  { id: "mechanical", name: "Mechanical", value: 0 },
                  { id: "scafolder", name: "Scafolder", value: 0 },
                  { id: "welder", name: "Welder", value: 0 },
                ]);
                setDescription("");
                setStatus("Waiting PO");
                setPphPercentInput(4);
                setApplyHoCut(true);
                setHoPercent(2);
                setHoCutValue(0);
                setShowAddForm(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            {showAddForm ? (editingPoId ? "Batal Edit" : "Tutup Form") : <><Plus className="w-4 h-4" /> Registrasi PO Baru</>}
          </button>
        )}
      </div>

      {/* PO FORM CONTAINER */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-blue-500/20 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-blue-50/50 p-4 border-b border-blue-500/10 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-gray-900 font-sans">
              {editingPoId ? "Form Edit Purchase Order (PO)" : "Form Registrasi Purchase Order (PO)"}
            </h3>
          </div>

          <form onSubmit={handleCreatePO} className="p-6 space-y-6">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{validationError}</span>
                <button type="button" onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Hubungkan dengan Proyek */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Hubungkan dengan Proyek <span className="text-red-500">*</span>
                </label>
                <select
                  value={linkProjectId}
                  onChange={(e) => setLinkProjectId(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-gray-800 font-bold"
                >
                  <option value="new">+ Buat Registrasi Proyek Baru +</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Nomor Purchase Order (PO) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PO-MCJ-EJT-001/IV/2026"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono font-bold"
                />
              </div>

              {/* Nama Proyek */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  Nama Proyek {linkProjectId === "new" ? "Baru" : ""} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={linkProjectId !== "new"}
                  placeholder="Contoh: PT SMART MARUNDA"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-50 disabled:opacity-75 disabled:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Kode Registrasi Proyek */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Kode Registrasi Proyek <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  disabled={linkProjectId !== "new"}
                  placeholder="Contoh: TSRT.SMART.001.2026"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  className="w-full bg-gray-50 disabled:opacity-75 disabled:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              {/* Perusahaan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Perusahaan Pelaksana <span className="text-red-500">*</span></label>
                <select
                  value={company}
                  disabled={linkProjectId !== "new"}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-gray-50 disabled:opacity-75 disabled:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-gray-800 font-semibold"
                >
                  <option value="CV. Mandiri Cipta Jaya">CV. Mandiri Cipta Jaya</option>
                  <option value="PT. Elqia Jaya Teknik">PT. Elqia Jaya Teknik</option>
                  <option value="Lainnya">Lainnya (Ketik Manual)</option>
                </select>
                {company === "Lainnya" && (
                  <input
                    type="text"
                    required
                    disabled={linkProjectId !== "new"}
                    placeholder="Nama Perusahaan..."
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="w-full bg-gray-50 disabled:opacity-75 disabled:bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white mt-1.5"
                  />
                )}
              </div>

              {/* Owner / Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Owner / Client (Pemberi Kerja) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sinar Mas, Pertamina"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* PIC Pembuat PO / PM */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  PIC / Project Manager <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={linkProjectId !== "new"}
                  placeholder="Contoh: Bpk Lily, Rifky, Ujang"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-gray-50 disabled:opacity-75 disabled:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tanggal PO</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono"
                />
              </div>

              {/* Status PO */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Status PO saat ini</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-amber-700 font-bold"
                >
                  <option value="Waiting PO">Waiting PO</option>
                  <option value="Sudah Proses">Sudah Proses (Aktif)</option>
                  <option value="Belum Proses">Belum Proses (Draft)</option>
                  <option value="Selesai">Selesai (Barang Diterima)</option>
                </select>
              </div>

              {/* PPN Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tingkat PPN Proyek</label>
                <select
                  value={ppnPercentInput}
                  onChange={(e) => setPpnPercentInput(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-emerald-700 font-bold"
                >
                  <option value={11}>PPN 11% (Standar)</option>
                  <option value={0}>Tanpa PPN (0%)</option>
                </select>
              </div>

              {/* PPh Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tingkat PPh Proyek</label>
                <select
                  value={pphPercentInput}
                  onChange={(e) => setPphPercentInput(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white text-red-700 font-bold"
                >
                  <option value={2}>PPh 2% (Jasa Konstruksi)</option>
                  <option value={4}>PPh 4% (Jasa Non-Konstruksi)</option>
                  <option value={0}>Tanpa PPh (0%)</option>
                </select>
              </div>
            </div>

            {/* Rincian Nilai Kontrak Dasar */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" /> Rincian Nilai Kontrak Dasar (Rupiah)
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Rincian nilai pekerjaan yang akan dipindahkan ke Manajemen Proyek secara dinamis.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddContractItem}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-150 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all self-start sm:self-auto shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Rincian Manual
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="bg-slate-50 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5 relative group">
                    {/* Delete button */}
                    {contractItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContractItem(item.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-all cursor-pointer"
                        title="Hapus rincian ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-blue-500" /> Nama Rincian {index + 1}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Piping"
                        value={item.name}
                        onChange={(e) => handleUpdateContractItemName(item.id, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-semibold text-gray-800 pr-6"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nilai Kontrak (Rp)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 1.000.000"
                        value={item.value ? new Intl.NumberFormat("id-ID").format(item.value) : ""}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          handleUpdateContractItemValue(item.id, clean ? Number(clean) : 0);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono font-bold text-gray-800"
                      />
                      <span className="text-[10px] text-gray-500 font-mono block mt-1">{formatIDR(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pengaturan Potongan HO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Alokasi / Potongan HO (Head Office)
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        Tentukan apakah PO ini akan dipotong otomatis/manual untuk alokasi dana ke proyek HO.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyHoCut}
                      onChange={(e) => setApplyHoCut(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-semibold text-gray-700">Terapkan</span>
                  </label>
                </div>

                {applyHoCut && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-600">
                        Persentase Potongan HO (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={hoPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHoPercent(val);
                            setHoCutValue(Math.round(rawContractSum * (val / 100)));
                          }}
                          className="w-full bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono font-bold text-gray-800"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-xs text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-600">
                        Nilai Potongan HO (IDR)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 1.000.000"
                        value={hoCutValue ? new Intl.NumberFormat("id-ID").format(hoCutValue) : ""}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          const val = clean ? Number(clean) : 0;
                          setHoCutValue(val);
                          if (rawContractSum > 0) {
                            setHoPercent(Number(((val / rawContractSum) * 100).toFixed(2)));
                          } else {
                            setHoPercent(0);
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white font-mono font-bold text-gray-800"
                      />
                      <span className="text-[10px] text-gray-500 font-mono block">
                        {formatIDR(hoCutValue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Display */}
              {(() => {
                const calculatedPpn = rawContractSum * (ppnPercentInput / 100);
                const calculatedPph = rawContractSum * (pphPercentInput / 100);
                const calculatedHoCut = applyHoCut ? hoCutValue : 0;
                const calculatedNetto = rawContractSum + calculatedPpn - calculatedPph - calculatedHoCut;

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 mt-2 space-y-2 text-xs shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-600">Total Nilai Dasar Kontrak (Bruto):</span>
                      <span className="font-mono font-bold text-gray-800">
                        {formatIDR(rawContractSum)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] border-b border-dashed border-gray-200 pb-2">
                      <span>PPN ({ppnPercentInput}%):</span>
                      <span className="font-mono text-emerald-600">+{formatIDR(calculatedPpn)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] border-b border-dashed border-gray-200 pb-2">
                      <span className="font-semibold text-red-700">
                        Potongan PPh ({pphPercentInput}%):
                      </span>
                      <span className="font-mono font-bold text-red-600">
                        -{formatIDR(calculatedPph)}
                      </span>
                    </div>
                    {applyHoCut && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px] border-b border-gray-200 pb-2">
                        <span className="font-semibold text-amber-700">
                          Alokasi Potongan HO ({hoPercent}%):
                        </span>
                        <span className="font-mono font-bold text-amber-600">
                          -{formatIDR(calculatedHoCut)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold text-slate-700 text-[11px] sm:text-xs">
                        Estimasi Nilai Netto Kontrak (setelah PPN, PPh &amp; HO Cut):
                      </span>
                      <span className="font-mono font-black text-blue-700 text-sm">
                        {formatIDR(calculatedNetto)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Upload PDF PO Section */}
            <div className="bg-blue-50/20 border border-blue-500/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Dokumen Pendukung PDF Purchase Order (PO)
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Unggah salinan dokumen PDF PO resmi untuk disimpan dalam sistem dan dijalankan/diakses secara instan.</p>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    handleFileSelect(files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : pdfFileBase64
                    ? "border-emerald-500 bg-emerald-50/10"
                    : "border-gray-300 hover:border-blue-400 bg-gray-50/50"
                }`}
                onClick={() => {
                  document.getElementById("pdf-upload-input")?.click();
                }}
              >
                <input
                  id="pdf-upload-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFileSelect(files[0]);
                    }
                  }}
                />

                {pdfFileBase64 ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-800">{pdfFileName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">PDF Berhasil Diunggah</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pdfFileBase64) {
                            setSelectedPdfPreview({ name: pdfFileName || "Preview PO", data: pdfFileBase64 });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" /> Buka / Jalankan PDF
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfFileBase64(null);
                          setPdfFileName(null);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                      >
                        Hapus File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-10 h-10 bg-gray-150 text-gray-500 rounded-full flex items-center justify-center mb-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Tarik &amp; lepas file PDF PO di sini, atau klik untuk memilih</p>
                      <p className="text-[10px] text-gray-400">Hanya format file PDF yang diperbolehkan (Maksimal 15MB)</p>
                    </div>
                    {/* Direct run helper button */}
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateDummyPdf(`PO-${poNo || "MCJ-SAMPLE"}.pdf`);
                        }}
                        className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-sm cursor-pointer"
                      >
                        ✨ Gunakan Contoh PO PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Deskripsi &amp; Catatan Proyek / PO Owner <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ketikan deskripsi lengkap proyek, ruang lingkup kerja, lokasi, atau rincian spesifikasi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPoId(null);
                  setLinkProjectId("new");
                  setProjectName("");
                  setProjectCode("");
                  setPoNo("");
                  setSupplier("");
                  setPic("");
                  setContractItems([
                    { id: "piping", name: "Piping", value: 0 },
                    { id: "electrical", name: "Electrical", value: 0 },
                    { id: "mechanical", name: "Mechanical", value: 0 },
                    { id: "scafolder", name: "Scafolder", value: 0 },
                    { id: "welder", name: "Welder", value: 0 },
                  ]);
                  setDescription("");
                  setStatus("Waiting PO");
                  setCompany("CV. Mandiri Cipta Jaya");
                  setCustomCompany("");
                  setPphPercentInput(4);
                  setApplyHoCut(true);
                  setHoPercent(2);
                  setHoCutValue(0);
                }}
                className="border border-gray-200 text-gray-600 px-4 py-2 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingPoId ? "Simpan Perubahan PO" : "Simpan PO & Daftarkan Proyek Otomatis"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* FILTER PANEL */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <ListFilter className="w-4 h-4 text-blue-600" /> Filter Purchase Order (PO)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Berdasarkan Proyek</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Semua Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-500">Pencarian Owner / No PO / PIC / Rincian</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500">
            Ditemukan <strong className="text-gray-900">{filteredPOs.length}</strong> purchase order dari total{" "}
            <strong>{poList.length}</strong>
          </span>
          <span className="text-slate-500 font-semibold">
            Total Saringan PO: <strong className="text-red-600 font-mono text-sm">{formatIDR(totalPOSum)}</strong>
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Nomor PO</th>
                <th className="p-3.5">Owner / Client (Pemberi Kerja)</th>
                <th className="p-3.5">Daftar Proyek / PIC</th>
                <th className="p-3.5">Deskripsi Proyek</th>
                <th className="p-3.5 text-right">Nilai Nominal Kontrak</th>
                <th className="p-3.5 text-center">Status PO</th>
                {!isReadOnly && <th className="p-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Tidak ditemukan data Purchase Order (PO) dari Owner.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const proj = projects.find((p) => p.id === po.projectId);
                  let poPdfData: { name: string; data: string } | null = null;
                  if (po.transferProof) {
                    try {
                      const parsed = JSON.parse(po.transferProof);
                      if (parsed && parsed.data) {
                        poPdfData = { name: parsed.name || "PO_Document.pdf", data: parsed.data };
                      } else {
                        poPdfData = { name: "PO_Document.pdf", data: po.transferProof };
                      }
                    } catch (e) {
                      poPdfData = { name: "PO_Document.pdf", data: po.transferProof };
                    }
                  }

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/50">
                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono">
                        {po.date}
                      </td>

                      {/* PO Number */}
                      <td className="p-3.5 whitespace-nowrap font-mono space-y-1">
                        <div className="font-bold text-slate-700">{po.poNo || "-"}</div>
                        {po.company && (
                          <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider font-sans">
                            🏢 {po.company}
                          </div>
                        )}
                        {poPdfData && (
                          <button
                            type="button"
                            onClick={() => setSelectedPdfPreview(poPdfData)}
                            className="inline-flex items-center gap-1 mt-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200 transition-colors cursor-pointer"
                            title="Buka / Jalankan File PDF PO"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            PDF Terlampir
                          </button>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="p-3.5 font-bold text-slate-800">
                        {po.supplier || "-"}
                      </td>

                      {/* Project / PIC */}
                      <td className="p-3.5 space-y-1">
                        <p className="font-semibold text-slate-700 truncate max-w-[140px]" title={proj?.name}>
                          {proj ? proj.name : "Proyek Dihapus"}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">CODE: {proj?.code || "-"}</p>
                        <p className="text-[9px] text-gray-400">PIC: {po.pic}</p>
                      </td>

                      {/* Description */}
                      <td className="p-3.5 max-w-xs">
                        <p className="text-slate-900 font-medium leading-relaxed" style={{ wordBreak: "break-word" }}>
                          {po.description}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 text-right font-mono space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{formatIDR(po.amount)}</div>
                        {proj && (() => {
                          const isHoOrEjt = proj.name.toUpperCase().includes("HO") || (proj.code && proj.code.toUpperCase().includes("HO")) || proj.name.toUpperCase().includes("EJT");
                          const ppnRate = isHoOrEjt ? ((proj.ppnPercent === 11 || proj.ppnPercent === undefined) ? 0 : proj.ppnPercent) : (proj.ppnPercent !== undefined ? proj.ppnPercent : 11);
                          const pphRate = isHoOrEjt ? ((proj.pphPercent === 4 || proj.pphPercent === undefined) ? 0 : proj.pphPercent) : (proj.pphPercent !== undefined ? proj.pphPercent : 4);
                          const ppnVal = po.amount * (ppnRate / 100);
                          const pphVal = po.amount * (pphRate / 100);
                          const nettoVal = po.amount + ppnVal - pphVal;

                          return (
                            <div className="text-[10px] text-gray-500 flex flex-col items-end gap-0.5">
                              <span className="text-[9px] text-gray-400">PPN ({ppnRate}%): +{formatIDR(ppnVal)}</span>
                              <span className="font-semibold text-red-600">
                                PPh ({pphRate}%): -{formatIDR(pphVal)}
                              </span>
                              <span className="font-bold text-blue-700 text-[10px] border-t border-gray-100 pt-0.5 mt-0.5">
                                Netto: {formatIDR(nettoVal)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            po.status === "Selesai"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : po.status === "Waiting PO"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : po.status === "Belum Proses"
                              ? "bg-gray-50 text-gray-700 border-gray-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>

                      {/* Actions */}
                      {!isReadOnly && (
                        <td className="p-3.5 text-right flex justify-end items-center gap-1.5">
                          {poPdfData && (
                            <button
                              onClick={() => setSelectedPdfPreview(poPdfData)}
                              className="text-emerald-500 hover:text-emerald-700 p-1.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Jalankan / Buka PDF PO"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPO(po)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit PO"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDeletePO(po.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {poToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">Hapus Purchase Order (PO)?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus Purchase Order (PO) ini secara permanen dari sistem?
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPoToDelete(null)}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeletePO}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/15"
              >
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
              </button>
            </div>
          </div>
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

      {/* PDF DOCUMENT PREVIEW MODAL */}
      <PdfViewerModal pdfData={selectedPdfPreview} onClose={() => setSelectedPdfPreview(null)} />
    </div>
  );
}

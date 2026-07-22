import React, { useEffect, useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Printer, AlertCircle, RefreshCw, X } from "lucide-react";

// Configure pdf.js worker CDN
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
}

interface PdfViewerModalProps {
  pdfData: { name: string; data: string } | null;
  onClose: () => void;
}

export function getPdfBlobUrl(pdfDataStr: string): string {
  if (!pdfDataStr) return "";
  if (pdfDataStr.startsWith("blob:")) return pdfDataStr;
  try {
    const base64Clean = pdfDataStr.includes(",") ? pdfDataStr.split(",")[1] : pdfDataStr;
    const binaryString = window.atob(base64Clean.trim());
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error converting PDF base64 to Blob URL:", e);
    return pdfDataStr;
  }
}

export function getPdfArrayBuffer(pdfDataStr: string): ArrayBuffer | null {
  try {
    const base64Clean = pdfDataStr.includes(",") ? pdfDataStr.split(",")[1] : pdfDataStr;
    const binaryString = window.atob(base64Clean.trim());
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Error converting PDF to ArrayBuffer:", e);
    return null;
  }
}

export default function PdfViewerModal({ pdfData, onClose }: PdfViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "embed">("canvas");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!pdfData || !pdfData.data) return;

    setIsLoading(true);
    setRenderError(null);

    const url = getPdfBlobUrl(pdfData.data);
    setBlobUrl(url);

    const arrayBuffer = getPdfArrayBuffer(pdfData.data);

    if (!arrayBuffer) {
      setRenderError("Gagal membaca data file PDF.");
      setIsLoading(false);
      setViewMode("embed");
      return;
    }

    // Load PDF Document via pdf.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    loadingTask.promise
      .then((doc) => {
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("pdfjs-dist canvas load failed, switching to embedded mode:", err);
        setRenderError("Mode kanvas tidak dapat merender PDF ini secara penuh. Beralih ke pratinjau browser.");
        setIsLoading(false);
        setViewMode("embed");
      });

    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pdfData]);

  // Render current page to canvas
  useEffect(() => {
    if (viewMode !== "canvas" || !pdfDocRef.current || currentPage < 1) return;

    let isCancelled = false;

    pdfDocRef.current
      .getPage(currentPage)
      .then((page) => {
        if (isCancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale, rotation });
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        return page.render(renderContext).promise;
      })
      .catch((err) => {
        console.error("Error rendering page to canvas:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, scale, rotation, viewMode]);

  if (!pdfData) return null;

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank");
    } else {
      const url = getPdfBlobUrl(pdfData.data);
      window.open(url, "_blank");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = blobUrl || getPdfBlobUrl(pdfData.data);
    a.download = pdfData.name || "Dokumen_PO.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (blobUrl) {
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider line-clamp-1">{pdfData.name}</h3>
              <p className="text-[10px] text-slate-400">Dokumen Resmi Purchase Order (PO)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Buka PDF di tab browser baru"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Unduh file PDF"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Unduh PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Page Controls */}
          {viewMode === "canvas" && numPages > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2 py-1 shadow-sm">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700 px-1">
                Halaman {currentPage} dari {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="p-1 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom & Rotate Controls */}
          {viewMode === "canvas" && (
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-600 px-1 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
                className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 hover:bg-gray-100 rounded text-gray-700 cursor-pointer"
                title="Putar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mode Switcher & Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "canvas" ? "embed" : "canvas")}
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-gray-300 px-2.5 py-1 rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {viewMode === "canvas" ? "Mode Embed Browser" : "Mode Kanvas PDF"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-white border border-gray-300 px-2.5 py-1 rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" /> Cetak
            </button>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="sm:hidden text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Tab Baru
            </button>
          </div>
        </div>

        {/* Notice bar if error or fallback */}
        {renderError && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-amber-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{renderError}</span>
            </div>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="font-bold underline hover:text-amber-900 cursor-pointer shrink-0"
            >
              Buka PDF di Tab Baru &rarr;
            </button>
          </div>
        )}

        {/* Viewer Content Area */}
        <div className="flex-1 bg-slate-200/80 p-4 overflow-auto relative flex flex-col items-center justify-start">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-600">Memuat Dokumen PDF...</p>
            </div>
          ) : viewMode === "canvas" ? (
            <div className="my-auto shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-300 transition-all">
              <canvas ref={canvasRef} className="max-w-full h-auto block" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <object
                data={blobUrl || getPdfBlobUrl(pdfData.data)}
                type="application/pdf"
                className="w-full h-full rounded-xl border border-gray-300 bg-white shadow-lg"
              >
                <iframe
                  src={blobUrl || getPdfBlobUrl(pdfData.data)}
                  className="w-full h-full rounded-xl border-none"
                  title={pdfData.name}
                >
                  <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl text-center space-y-3 my-auto">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-sm font-bold text-gray-800">Browser tidak dapat menampilkan pratinjau PDF dalam iframe.</p>
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka PDF di Tab Baru Browser
                    </button>
                  </div>
                </iframe>
              </object>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-3 sm:p-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 font-medium hidden sm:block">
            CV. MANDIRI CIPTA JAYA &bull; Sistem Arsip PDF Terintegrasi
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

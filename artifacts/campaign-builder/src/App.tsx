import { useState, useMemo, useCallback } from "react";
import { CampaignRow, createEmptyRow } from "@/data/masterColumns";
import { validateRows, ValidationResult } from "@/lib/validation";
import { exportToExcel } from "@/lib/excelUtils";
import CampaignGrid from "@/components/CampaignGrid";
import SnapshotPanel from "@/components/SnapshotPanel";
import FileUploadPanel from "@/components/FileUploadPanel";
import ValidationPanel from "@/components/ValidationPanel";
import ConnectorsPanel from "@/components/ConnectorsPanel";
import {
  Download,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  LayoutGrid,
  AlertTriangle,
  ChevronRight,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidePanel = "snapshots" | "upload" | "validation" | "connectors" | null;

export default function App() {
  const [rows, setRows] = useState<CampaignRow[]>(() => [createEmptyRow()]);
  const [activePanel, setActivePanel] = useState<SidePanel>(null);
  const [exportFilename, setExportFilename] = useState("");

  const validationResult: ValidationResult = useMemo(
    () => validateRows(rows),
    [rows]
  );

  const handleImport = useCallback(
    (importedRows: CampaignRow[], mode: "append" | "replace") => {
      if (mode === "append") {
        setRows((prev) => [...prev, ...importedRows]);
      } else {
        setRows(importedRows);
      }
      setActivePanel(null);
    },
    []
  );

  const handleRestore = useCallback((restoredRows: CampaignRow[]) => {
    setRows(restoredRows);
    setActivePanel(null);
  }, []);

  const handleExport = () => {
    const name =
      exportFilename.trim() ||
      `campaign_data_${new Date().toISOString().slice(0, 10)}`;
    exportToExcel(rows, `${name}.xlsx`);
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      <header className="bg-slate-900 text-white px-4 py-0 flex items-center gap-4 shrink-0 h-12 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <LayoutGrid className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">
            Smart Campaign Builder
          </span>
        </div>

        <div className="h-5 w-px bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePanel("upload")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors",
              activePanel === "upload"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button
            onClick={() => togglePanel("snapshots")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors",
              activePanel === "snapshots"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            <Camera className="w-3.5 h-3.5" /> Snapshots
          </button>
          <button
            onClick={() => togglePanel("validation")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors",
              activePanel === "validation"
                ? "bg-blue-600 text-white"
                : validationResult.errorCount > 0
                ? "text-red-300 hover:bg-slate-700"
                : validationResult.warningCount > 0
                ? "text-yellow-300 hover:bg-slate-700"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            {validationResult.errorCount > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : validationResult.warningCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Validate
            {(validationResult.errorCount > 0 || validationResult.warningCount > 0) && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                validationResult.errorCount > 0
                  ? "bg-red-500 text-white"
                  : "bg-yellow-500 text-white"
              )}>
                {validationResult.errorCount || validationResult.warningCount}
              </span>
            )}
          </button>
          <button
            onClick={() => togglePanel("connectors")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors",
              activePanel === "connectors"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            <Plug className="w-3.5 h-3.5" /> Connect
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder={`campaign_data_${new Date().toISOString().slice(0, 10)}`}
              className="w-48 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500">.xlsx</span>
          </div>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors",
              rows.length === 0
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white"
            )}
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded",
                validationResult.isValid
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}>
                {validationResult.isValid ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                {validationResult.isValid
                  ? "Valid"
                  : `${validationResult.errorCount} error${validationResult.errorCount !== 1 ? "s" : ""}`}
              </div>
              {validationResult.warningCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded bg-yellow-50 text-yellow-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {validationResult.warningCount} warning{validationResult.warningCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <div className="ml-auto text-xs text-slate-400">
              33 master columns · Tab/Enter to navigate cells
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <CampaignGrid
              rows={rows}
              onChange={setRows}
              issues={validationResult.issues}
            />
          </div>
        </main>

        {activePanel && (
          <>
            <div className="w-px bg-slate-200 shrink-0" />
            <aside className="w-80 flex flex-col overflow-hidden bg-white shrink-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 shrink-0">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {activePanel === "snapshots"
                    ? "Snapshots"
                    : activePanel === "upload"
                    ? "Import File"
                    : activePanel === "connectors"
                    ? "API Connectors"
                    : "Validation"}
                </span>
                <button
                  onClick={() => setActivePanel(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {activePanel === "snapshots" && (
                  <SnapshotPanel rows={rows} onRestore={handleRestore} />
                )}
                {activePanel === "upload" && (
                  <FileUploadPanel onImport={handleImport} />
                )}
                {activePanel === "validation" && (
                  <ValidationPanel result={validationResult} />
                )}
                {activePanel === "connectors" && (
                  <ConnectorsPanel
                    onImport={(importedRows, mode) => {
                      if (mode === "append") {
                        setRows((prev) => [...prev, ...importedRows]);
                      } else {
                        setRows(importedRows);
                      }
                      setActivePanel(null);
                    }}
                  />
                )}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

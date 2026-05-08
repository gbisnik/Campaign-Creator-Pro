import { useState, useRef, useCallback } from "react";
import { importFromExcel, ImportResult } from "@/lib/excelUtils";
import { CampaignRow } from "@/data/masterColumns";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Plus, Replace } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadPanelProps {
  onImport: (rows: CampaignRow[], mode: "append" | "replace") => void;
}

export default function FileUploadPanel({ onImport }: FileUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRows, setPendingRows] = useState<CampaignRow[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please upload a .xlsx or .xls file");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setPendingRows(null);
    try {
      const importResult = await importFromExcel(file);
      setResult(importResult);
      setPendingRows(importResult.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleImport = (mode: "append" | "replace") => {
    if (!pendingRows) return;
    onImport(pendingRows, mode);
    setResult(null);
    setPendingRows(null);
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setPendingRows(null);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" /> Import Excel File
        </h2>
        <p className="text-xs text-slate-500">
          Upload an Excel file with any subset of the master columns. Columns not in the master schema will be ignored.
        </p>
      </div>

      {!result && !error && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className={cn("w-10 h-10", isDragging ? "text-blue-500" : "text-slate-400")} />
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? "Drop to upload" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-slate-400">.xlsx or .xls files</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={reset} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {result && pendingRows && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm font-medium text-green-800">
                File parsed — {result.totalImported} rows ready
              </p>
              <button onClick={reset} className="ml-auto text-green-400 hover:text-green-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {result.importedColumns.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-green-700 mb-1">
                  Matched columns ({result.importedColumns.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.importedColumns.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-800 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.skippedColumns.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Skipped (not in master schema) ({result.skippedColumns.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.skippedColumns.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded line-through">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-slate-600">How to add to master view?</p>
            <button
              onClick={() => handleImport("append")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Append {result.totalImported} rows to existing data
            </button>
            <button
              onClick={() => handleImport("replace")}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Replace className="w-4 h-4" />
              Replace all existing rows with imported rows
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs font-medium text-slate-600 mb-1">Expected format</p>
        <p className="text-xs text-slate-500">
          Your file must have column headers in the first row matching any subset of the 33 master field names (e.g. <code className="bg-slate-100 px-1 rounded">vendor_channel</code>, <code className="bg-slate-100 px-1 rounded">utm_source</code>).
          Extra columns will be silently ignored.
        </p>
      </div>
    </div>
  );
}

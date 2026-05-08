import * as XLSX from "xlsx";
import { MASTER_COLUMNS, CampaignRow, createEmptyRow } from "@/data/masterColumns";

export function exportToExcel(rows: CampaignRow[], filename: string): void {
  const headers = MASTER_COLUMNS.map((c) => c.key);
  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    for (const key of headers) {
      obj[key] = row[key] ?? "";
    }
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Campaign Data");

  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, filename);
}

export interface ImportResult {
  rows: CampaignRow[];
  importedColumns: string[];
  skippedColumns: string[];
  totalImported: number;
}

export function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });

        const masterKeys = new Set(MASTER_COLUMNS.map((c) => c.key));
        const importedColumns: string[] = [];
        const skippedColumns: string[] = [];

        if (rawRows.length > 0) {
          for (const key of Object.keys(rawRows[0])) {
            if (masterKeys.has(key)) {
              importedColumns.push(key);
            } else {
              skippedColumns.push(key);
            }
          }
        }

        const rows: CampaignRow[] = rawRows.map((raw) => {
          const row = createEmptyRow();
          for (const col of MASTER_COLUMNS) {
            if (raw[col.key] !== undefined) {
              row[col.key] = String(raw[col.key]);
            }
          }
          return row;
        });

        resolve({
          rows,
          importedColumns,
          skippedColumns,
          totalImported: rows.length,
        });
      } catch (err) {
        reject(new Error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  rowCount: number;
  rows: CampaignRow[];
}

const STORAGE_KEY = "campaign_builder_snapshots";

export function getSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

export function saveSnapshot(name: string, rows: CampaignRow[]): Snapshot {
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    rowCount: rows.length,
    rows,
  };
  const existing = getSnapshots();
  const updated = [snapshot, ...existing].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return snapshot;
}

export function deleteSnapshot(id: string): void {
  const existing = getSnapshots();
  const updated = existing.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

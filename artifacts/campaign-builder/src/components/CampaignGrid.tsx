import { useRef, useState, useCallback } from "react";
import { MASTER_COLUMNS, CampaignRow, createEmptyRow } from "@/data/masterColumns";
import { ValidationIssue, getCellSeverity } from "@/lib/validation";
import { Trash2, Plus, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignGridProps {
  rows: CampaignRow[];
  onChange: (rows: CampaignRow[]) => void;
  issues: ValidationIssue[];
}

const COL_WIDTH = 160;
const ROW_NUM_WIDTH = 48;
const ACTION_WIDTH = 48;

export default function CampaignGrid({ rows, onChange, issues }: CampaignGridProps) {
  const [activeCell, setActiveCell] = useState<{ rowId: string; col: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ col: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const updateCell = useCallback(
    (rowId: string, colKey: string, value: string) => {
      onChange(rows.map((r) => (r._id === rowId ? { ...r, [colKey]: value } : r)));
    },
    [rows, onChange]
  );

  const addRow = useCallback(() => {
    onChange([...rows, createEmptyRow()]);
  }, [rows, onChange]);

  const addMultipleRows = useCallback(
    (count: number) => {
      const newRows = Array.from({ length: count }, () => createEmptyRow());
      onChange([...rows, ...newRows]);
    },
    [rows, onChange]
  );

  const deleteRow = useCallback(
    (rowId: string) => {
      onChange(rows.filter((r) => r._id !== rowId));
    },
    [rows, onChange]
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  const sortedRows = sortConfig
    ? [...rows].sort((a, b) => {
        const av = (a[sortConfig.key] ?? "").toLowerCase();
        const bv = (b[sortConfig.key] ?? "").toLowerCase();
        return sortConfig.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : rows;

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    colIndex: number
  ) => {
    const rowIndex = sortedRows.findIndex((r) => r._id === rowId);
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const nextColIndex = e.shiftKey ? colIndex - 1 : colIndex + 1;
      if (nextColIndex >= 0 && nextColIndex < MASTER_COLUMNS.length) {
        setActiveCell({ rowId, col: MASTER_COLUMNS[nextColIndex].key });
      } else if (!e.shiftKey && rowIndex < sortedRows.length - 1) {
        setActiveCell({ rowId: sortedRows[rowIndex + 1]._id, col: MASTER_COLUMNS[0].key });
      } else if (e.shiftKey && rowIndex > 0) {
        setActiveCell({ rowId: sortedRows[rowIndex - 1]._id, col: MASTER_COLUMNS[MASTER_COLUMNS.length - 1].key });
      }
    }
    if (e.key === "ArrowDown" && rowIndex < sortedRows.length - 1) {
      setActiveCell({ rowId: sortedRows[rowIndex + 1]._id, col: MASTER_COLUMNS[colIndex].key });
    }
    if (e.key === "ArrowUp" && rowIndex > 0) {
      setActiveCell({ rowId: sortedRows[rowIndex - 1]._id, col: MASTER_COLUMNS[colIndex].key });
    }
  };

  const [bulkCount, setBulkCount] = useState("10");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <span className="text-sm text-slate-500 font-medium">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={1000}
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="10"
            />
            <button
              onClick={() => addMultipleRows(Math.max(1, Math.min(1000, parseInt(bulkCount) || 10)))}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add {bulkCount} rows
            </button>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add row
          </button>
        </div>
      </div>

      <div ref={tableRef} className="overflow-auto flex-1 relative">
        <table className="border-collapse text-xs" style={{ minWidth: ROW_NUM_WIDTH + ACTION_WIDTH + MASTER_COLUMNS.length * COL_WIDTH }}>
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-800 text-white">
              <th
                className="sticky left-0 z-30 bg-slate-800 border-r border-slate-600 text-center font-medium"
                style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH }}
              >
                #
              </th>
              {MASTER_COLUMNS.map((col, colIndex) => {
                const isSorted = sortConfig?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                    className="border-r border-slate-600 px-2 py-0 font-medium"
                  >
                    <div className="flex items-center gap-1 h-8">
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex-1 flex items-center gap-1 text-left truncate hover:text-blue-200 transition-colors"
                        title={col.rules || col.label}
                      >
                        <span className="truncate leading-none">{col.label}</span>
                        {isSorted && (
                          sortConfig?.dir === "asc"
                            ? <ChevronUp className="w-3 h-3 shrink-0" />
                            : <ChevronDown className="w-3 h-3 shrink-0" />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onMouseEnter={() => setTooltip({ col: col.key })}
                          onMouseLeave={() => setTooltip(null)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                        {tooltip?.col === col.key && (
                          <div className="absolute top-5 left-0 z-50 w-56 bg-slate-900 text-white text-xs rounded shadow-xl p-2 space-y-1 border border-slate-600">
                            <div><span className="text-slate-400">Type:</span> {col.dataType}</div>
                            <div>
                              <span className="text-slate-400">Required:</span>{" "}
                              {col.requiredLevel === "required" ? (
                                <span className="text-red-400">Required</span>
                              ) : col.requiredLevel === "conditional" ? (
                                <span className="text-yellow-400">{col.requiredNote}</span>
                              ) : (
                                <span className="text-slate-400">Optional</span>
                              )}
                            </div>
                            {col.example && <div><span className="text-slate-400">Example:</span> {col.example}</div>}
                            {col.source && <div><span className="text-slate-400">Source:</span> {col.source}</div>}
                            {col.rules && <div className="text-slate-300 leading-relaxed">{col.rules}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pb-1">
                      <span className={cn(
                        "text-[9px] font-normal px-1 rounded",
                        col.dataType === "date" ? "bg-purple-800 text-purple-200" : "bg-slate-700 text-slate-300"
                      )}>
                        {col.dataType}
                      </span>
                      <span className={cn(
                        "text-[9px] font-normal px-1 rounded",
                        col.requiredLevel === "required" ? "bg-red-800 text-red-200" :
                        col.requiredLevel === "conditional" ? "bg-yellow-800 text-yellow-200" :
                        "bg-slate-700 text-slate-400"
                      )}>
                        {col.requiredLevel === "required" ? "req" : col.requiredLevel === "conditional" ? "cond" : "opt"}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th
                className="sticky right-0 z-30 bg-slate-800 border-l border-slate-600"
                style={{ width: ACTION_WIDTH, minWidth: ACTION_WIDTH }}
              />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => {
              const rowIssueMap = new Map(
                issues
                  .filter((i) => i.rowId === row._id)
                  .map((i) => [i.columnKey, i])
              );
              const hasError = [...rowIssueMap.values()].some((i) => i.severity === "error");
              const hasWarning = !hasError && [...rowIssueMap.values()].some((i) => i.severity === "warning");

              return (
                <tr
                  key={row._id}
                  className={cn(
                    "group hover:bg-blue-50 transition-colors",
                    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  )}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 border-r border-b border-slate-200 text-center font-medium text-slate-400 select-none",
                      hasError ? "bg-red-50 text-red-400" : hasWarning ? "bg-yellow-50 text-yellow-600" : "bg-inherit"
                    )}
                    style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH }}
                  >
                    {hasError ? "!" : hasWarning ? "~" : rowIndex + 1}
                  </td>
                  {MASTER_COLUMNS.map((col, colIndex) => {
                    const issue = rowIssueMap.get(col.key);
                    const isActive = activeCell?.rowId === row._id && activeCell?.col === col.key;

                    return (
                      <td
                        key={col.key}
                        style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                        className={cn(
                          "border-r border-b border-slate-200 p-0 relative",
                          issue?.severity === "error" ? "bg-red-50" :
                          issue?.severity === "warning" ? "bg-yellow-50" : ""
                        )}
                        title={issue?.message}
                      >
                        <input
                          type={col.dataType === "date" ? "date" : "text"}
                          value={row[col.key] ?? ""}
                          onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                          onFocus={() => setActiveCell({ rowId: row._id, col: col.key })}
                          onBlur={() => setActiveCell(null)}
                          onKeyDown={(e) => handleKeyDown(e, row._id, colIndex)}
                          placeholder={col.example ? col.example.substring(0, 20) : ""}
                          className={cn(
                            "w-full h-7 px-2 text-xs bg-transparent border-0 outline-none",
                            "focus:bg-white focus:ring-2 focus:ring-inset",
                            isActive ? "ring-2 ring-blue-500 ring-inset bg-white" : "",
                            issue?.severity === "error" ? "focus:ring-red-400 text-red-700" :
                            issue?.severity === "warning" ? "focus:ring-yellow-400" : "focus:ring-blue-500"
                          )}
                        />
                        {issue && (
                          <div className={cn(
                            "absolute top-0 right-0 w-1.5 h-1.5 rounded-bl",
                            issue.severity === "error" ? "bg-red-500" : "bg-yellow-400"
                          )} />
                        )}
                      </td>
                    );
                  })}
                  <td
                    className="sticky right-0 z-10 bg-white border-l border-b border-slate-200 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: ACTION_WIDTH, minWidth: ACTION_WIDTH }}
                  >
                    <button
                      onClick={() => deleteRow(row._id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-slate-600">No rows yet</p>
            <p className="text-sm mt-1">Add rows manually or upload an Excel file</p>
          </div>
        )}
      </div>
    </div>
  );
}

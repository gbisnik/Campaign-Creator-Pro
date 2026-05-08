import { ValidationResult, ValidationIssue } from "@/lib/validation";
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ValidationPanelProps {
  result: ValidationResult;
  onFocusRow?: (rowIndex: number) => void;
}

export default function ValidationPanel({ result, onFocusRow }: ValidationPanelProps) {
  const [filter, setFilter] = useState<"all" | "error" | "warning">("all");

  const filtered = result.issues.filter((i) =>
    filter === "all" ? true : i.severity === filter
  );

  const grouped = filtered.reduce<Record<number, ValidationIssue[]>>((acc, issue) => {
    if (!acc[issue.rowIndex]) acc[issue.rowIndex] = [];
    acc[issue.rowIndex].push(issue);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          {result.isValid ? (
            <ShieldCheck className="w-4 h-4 text-green-600" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500" />
          )}
          <h2 className="text-sm font-semibold text-slate-800">
            {result.isValid ? "Validation Passed" : "Validation Issues"}
          </h2>
        </div>

        <div className="flex gap-2">
          <div className={cn(
            "flex-1 flex flex-col items-center py-2 rounded-lg text-center",
            result.errorCount > 0 ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"
          )}>
            <span className={cn("text-xl font-bold", result.errorCount > 0 ? "text-red-600" : "text-slate-400")}>
              {result.errorCount}
            </span>
            <span className="text-xs text-slate-500">Errors</span>
          </div>
          <div className={cn(
            "flex-1 flex flex-col items-center py-2 rounded-lg text-center",
            result.warningCount > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-slate-50 border border-slate-200"
          )}>
            <span className={cn("text-xl font-bold", result.warningCount > 0 ? "text-yellow-600" : "text-slate-400")}>
              {result.warningCount}
            </span>
            <span className="text-xs text-slate-500">Warnings</span>
          </div>
        </div>

        {result.issues.length > 0 && (
          <div className="flex gap-1 mt-3">
            {(["all", "error", "warning"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md font-medium transition-colors capitalize",
                  filter === f
                    ? f === "error" ? "bg-red-600 text-white"
                      : f === "warning" ? "bg-yellow-500 text-white"
                      : "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f === "all" ? `All (${result.issues.length})` : f === "error" ? `Errors (${result.errorCount})` : `Warnings (${result.warningCount})`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {result.isValid && result.issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
            <p className="font-medium text-slate-700">All rows are valid</p>
            <p className="text-sm text-slate-400 mt-1">
              All required fields are filled and data types are correct.
            </p>
          </div>
        )}

        {filtered.length === 0 && result.issues.length > 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            No {filter} issues
          </p>
        )}

        <div className="space-y-3">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([rowIndexStr, issues]) => {
              const rowIndex = Number(rowIndexStr);
              return (
                <div key={rowIndex} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onFocusRow?.(rowIndex)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-slate-600">Row {rowIndex + 1}</span>
                    <span className="flex items-center gap-1 ml-auto">
                      {issues.some((i) => i.severity === "error") && (
                        <span className="flex items-center gap-0.5 text-xs text-red-600">
                          <ShieldAlert className="w-3 h-3" />
                          {issues.filter((i) => i.severity === "error").length}
                        </span>
                      )}
                      {issues.some((i) => i.severity === "warning") && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                          <AlertTriangle className="w-3 h-3" />
                          {issues.filter((i) => i.severity === "warning").length}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </span>
                  </button>
                  <div className="divide-y divide-slate-100">
                    {issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2">
                        {issue.severity === "error" ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="text-xs font-medium text-slate-700 font-mono">
                            {issue.columnLabel}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

import { MASTER_COLUMNS, CampaignRow } from "@/data/masterColumns";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  rowIndex: number;
  rowId: string;
  columnKey: string;
  columnLabel: string;
  severity: ValidationSeverity;
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  isValid: boolean;
}

function isValidDate(value: string): boolean {
  if (!value.trim()) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function validateRows(rows: CampaignRow[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  rows.forEach((row, rowIndex) => {
    for (const col of MASTER_COLUMNS) {
      const value = (row[col.key] ?? "").trim();

      if (col.requiredLevel === "required") {
        if (!value) {
          issues.push({
            rowIndex,
            rowId: row._id,
            columnKey: col.key,
            columnLabel: col.label,
            severity: "error",
            message: `"${col.label}" is required but empty`,
          });
          continue;
        }
      }

      if (col.requiredLevel === "conditional" && value === "") {
        issues.push({
          rowIndex,
          rowId: row._id,
          columnKey: col.key,
          columnLabel: col.label,
          severity: "warning",
          message: `"${col.label}" may be required (${col.requiredNote})`,
        });
        continue;
      }

      if (value && col.dataType === "date") {
        if (!isValidDate(value)) {
          issues.push({
            rowIndex,
            rowId: row._id,
            columnKey: col.key,
            columnLabel: col.label,
            severity: "error",
            message: `"${col.label}" has invalid date format — expected YYYY-MM-DD`,
          });
        }
      }

      if (value && col.dataType === "number") {
        if (isNaN(Number(value))) {
          issues.push({
            rowIndex,
            rowId: row._id,
            columnKey: col.key,
            columnLabel: col.label,
            severity: "error",
            message: `"${col.label}" must be a number`,
          });
        }
      }
    }
  });

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    issues,
    errorCount,
    warningCount,
    isValid: errorCount === 0,
  };
}

export function getRowIssues(
  issues: ValidationIssue[],
  rowId: string
): ValidationIssue[] {
  return issues.filter((i) => i.rowId === rowId);
}

export function getCellSeverity(
  issues: ValidationIssue[],
  rowId: string,
  columnKey: string
): ValidationSeverity | null {
  const match = issues.find(
    (i) => i.rowId === rowId && i.columnKey === columnKey
  );
  return match?.severity ?? null;
}

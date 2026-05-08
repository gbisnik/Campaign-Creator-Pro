import { useState } from "react";
import { Snapshot, getSnapshots, saveSnapshot, deleteSnapshot, exportToExcel } from "@/lib/excelUtils";
import { CampaignRow } from "@/data/masterColumns";
import { Camera, Download, Upload, Trash2, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotPanelProps {
  rows: CampaignRow[];
  onRestore: (rows: CampaignRow[]) => void;
}

export default function SnapshotPanel({ rows, onRestore }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(getSnapshots);
  const [snapshotName, setSnapshotName] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = () => {
    const name = snapshotName.trim() || `Snapshot ${new Date().toLocaleString()}`;
    saveSnapshot(name, rows);
    setSnapshots(getSnapshots());
    setSnapshotName("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportSnapshot = (snapshot: Snapshot) => {
    exportToExcel(
      snapshot.rows,
      `${snapshot.name.replace(/[^a-z0-9]/gi, "_")}_${snapshot.createdAt.slice(0, 10)}.xlsx`
    );
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSnapshot(id);
      setSnapshots(getSnapshots());
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleRestore = (snapshot: Snapshot) => {
    onRestore(snapshot.rows);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" /> Save Snapshot
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Snapshot name (optional)"
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          />
          <button
            onClick={handleSave}
            disabled={rows.length === 0}
            className={cn(
              "px-3 py-1.5 text-xs rounded font-medium transition-colors",
              saved
                ? "bg-green-600 text-white"
                : rows.length === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Saves {rows.length} rows to local storage. Up to 20 snapshots.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Saved Snapshots ({snapshots.length})
        </h3>

        {snapshots.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No snapshots yet</p>
            <p className="text-xs mt-1">Save your work to restore it later</p>
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{snap.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(snap.createdAt).toLocaleString()} · {snap.rowCount} rows
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestore(snap)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      title="Restore this snapshot to the master view"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                    <button
                      onClick={() => handleExportSnapshot(snap)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Download as Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className={cn(
                        "p-1 transition-colors",
                        confirmDelete === snap.id
                          ? "text-red-500"
                          : "text-slate-400 hover:text-red-400"
                      )}
                      title={confirmDelete === snap.id ? "Click again to confirm delete" : "Delete snapshot"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { CampaignRow, createEmptyRow, MASTER_COLUMNS } from "@/data/masterColumns";
import {
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Replace,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectorsPanelProps {
  onImport: (rows: CampaignRow[], mode: "append" | "replace") => void;
}

type Platform = "cm360" | "veeva";
type ConnStatus = "idle" | "testing" | "ok" | "error";

interface CM360Form {
  serviceAccountJson: string;
  profileId: string;
  advertiserId: string;
  dataType: "campaigns" | "creatives";
  maxResults: string;
}

interface VeevaForm {
  vaultDns: string;
  username: string;
  password: string;
  limit: string;
}

const API_BASE = "/api";

function mapToMasterRow(raw: Record<string, string>): CampaignRow {
  const masterKeys = new Set(MASTER_COLUMNS.map((c) => c.key));
  const row = createEmptyRow();
  for (const [k, v] of Object.entries(raw)) {
    if (masterKeys.has(k)) {
      row[k] = String(v ?? "");
    }
  }
  return row;
}

export default function ConnectorsPanel({ onImport }: ConnectorsPanelProps) {
  const [active, setActive] = useState<Platform | null>("cm360");

  const [cm360Form, setCm360Form] = useState<CM360Form>({
    serviceAccountJson: "",
    profileId: "",
    advertiserId: "",
    dataType: "campaigns",
    maxResults: "500",
  });
  const [cm360Status, setCm360Status] = useState<ConnStatus>("idle");
  const [cm360Msg, setCm360Msg] = useState("");
  const [cm360Preview, setCm360Preview] = useState<CampaignRow[] | null>(null);
  const [cm360Fetching, setCm360Fetching] = useState(false);
  const [showSaJson, setShowSaJson] = useState(false);

  const [veevaForm, setVeevaForm] = useState<VeevaForm>({
    vaultDns: "",
    username: "",
    password: "",
    limit: "200",
  });
  const [veevaStatus, setVeevaStatus] = useState<ConnStatus>("idle");
  const [veevaMsg, setVeevaMsg] = useState("");
  const [veevaPreview, setVeevaPreview] = useState<CampaignRow[] | null>(null);
  const [veevaFetching, setVeevaFetching] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const testCM360 = useCallback(async () => {
    setCm360Status("testing");
    setCm360Msg("");
    try {
      const res = await fetch(`${API_BASE}/connectors/cm360/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceAccountJson: cm360Form.serviceAccountJson,
          profileId: cm360Form.profileId,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        profileName?: string;
        error?: string;
      };
      if (data.ok) {
        setCm360Status("ok");
        setCm360Msg(`Connected as profile: ${data.profileName ?? cm360Form.profileId}`);
      } else {
        setCm360Status("error");
        setCm360Msg(data.error ?? "Connection failed");
      }
    } catch (e) {
      setCm360Status("error");
      setCm360Msg(String(e));
    }
  }, [cm360Form]);

  const fetchCM360 = useCallback(async () => {
    setCm360Fetching(true);
    setCm360Preview(null);
    try {
      const res = await fetch(`${API_BASE}/connectors/cm360/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceAccountJson: cm360Form.serviceAccountJson,
          profileId: cm360Form.profileId,
          advertiserId: cm360Form.advertiserId || undefined,
          dataType: cm360Form.dataType,
          maxResults: parseInt(cm360Form.maxResults) || 500,
        }),
      });
      const data = (await res.json()) as {
        rows?: Record<string, string>[];
        count?: number;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      const mapped = (data.rows ?? []).map(mapToMasterRow);
      setCm360Preview(mapped);
    } catch (e) {
      setCm360Status("error");
      setCm360Msg(String(e));
    } finally {
      setCm360Fetching(false);
    }
  }, [cm360Form]);

  const testVeeva = useCallback(async () => {
    setVeevaStatus("testing");
    setVeevaMsg("");
    try {
      const res = await fetch(`${API_BASE}/connectors/veeva/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultDns: veevaForm.vaultDns,
          username: veevaForm.username,
          password: veevaForm.password,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        vaultName?: string;
        error?: string;
      };
      if (data.ok) {
        setVeevaStatus("ok");
        setVeevaMsg(`Connected to vault: ${data.vaultName ?? veevaForm.vaultDns}`);
      } else {
        setVeevaStatus("error");
        setVeevaMsg(data.error ?? "Connection failed");
      }
    } catch (e) {
      setVeevaStatus("error");
      setVeevaMsg(String(e));
    }
  }, [veevaForm]);

  const fetchVeeva = useCallback(async () => {
    setVeevaFetching(true);
    setVeevaPreview(null);
    try {
      const res = await fetch(`${API_BASE}/connectors/veeva/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultDns: veevaForm.vaultDns,
          username: veevaForm.username,
          password: veevaForm.password,
          limit: parseInt(veevaForm.limit) || 200,
        }),
      });
      const data = (await res.json()) as {
        rows?: Record<string, string>[];
        count?: number;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      const mapped = (data.rows ?? []).map(mapToMasterRow);
      setVeevaPreview(mapped);
    } catch (e) {
      setVeevaStatus("error");
      setVeevaMsg(String(e));
    } finally {
      setVeevaFetching(false);
    }
  }, [veevaForm]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Plug className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-800">API Connectors</h2>
        </div>
        <p className="text-xs text-slate-500">
          Pull data directly from Google Campaign Manager 360 or Veeva Vault Promomats into the master view.
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <Section
          id="cm360"
          active={active === "cm360"}
          onToggle={() => setActive((p) => (p === "cm360" ? null : "cm360"))}
          title="Google Campaign Manager 360"
          logo="🔵"
          status={cm360Status}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Service Account JSON *
              </label>
              <div className="relative">
                <textarea
                  value={showSaJson ? cm360Form.serviceAccountJson : cm360Form.serviceAccountJson ? "••••••••••••••••••••••••" : ""}
                  onFocus={() => setShowSaJson(true)}
                  onBlur={() => setShowSaJson(false)}
                  onChange={(e) => setCm360Form((f) => ({ ...f, serviceAccountJson: e.target.value }))}
                  placeholder='Paste your GCP service account JSON here...'
                  rows={showSaJson ? 5 : 2}
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded bg-white font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                From GCP Console → IAM → Service Accounts → Keys. Needs <code>DFA Reporting</code> role.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Profile ID *</label>
                <input
                  type="text"
                  value={cm360Form.profileId}
                  onChange={(e) => setCm360Form((f) => ({ ...f, profileId: e.target.value }))}
                  placeholder="e.g. 12345678"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Advertiser ID</label>
                <input
                  type="text"
                  value={cm360Form.advertiserId}
                  onChange={(e) => setCm360Form((f) => ({ ...f, advertiserId: e.target.value }))}
                  placeholder="optional"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fetch</label>
                <select
                  value={cm360Form.dataType}
                  onChange={(e) => setCm360Form((f) => ({ ...f, dataType: e.target.value as "campaigns" | "creatives" }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="campaigns">Campaigns</option>
                  <option value="creatives">Creatives</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Max rows</label>
                <input
                  type="number"
                  value={cm360Form.maxResults}
                  onChange={(e) => setCm360Form((f) => ({ ...f, maxResults: e.target.value }))}
                  min={1}
                  max={1000}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <StatusBadge status={cm360Status} message={cm360Msg} />

            <div className="flex gap-2">
              <button
                onClick={testCM360}
                disabled={!cm360Form.serviceAccountJson || !cm360Form.profileId || cm360Status === "testing"}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded font-medium transition-colors",
                  !cm360Form.serviceAccountJson || !cm360Form.profileId
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                )}
              >
                {cm360Status === "testing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                Test Connection
              </button>
              <button
                onClick={fetchCM360}
                disabled={!cm360Form.serviceAccountJson || !cm360Form.profileId || cm360Fetching}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded font-medium transition-colors",
                  !cm360Form.serviceAccountJson || !cm360Form.profileId
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {cm360Fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Fetch Data
              </button>
            </div>

            {cm360Preview && (
              <ImportPreview
                rows={cm360Preview}
                source="CM360"
                onImport={(mode) => { onImport(cm360Preview, mode); setCm360Preview(null); }}
                onDiscard={() => setCm360Preview(null)}
              />
            )}
          </div>
        </Section>

        <Section
          id="veeva"
          active={active === "veeva"}
          onToggle={() => setActive((p) => (p === "veeva" ? null : "veeva"))}
          title="Veeva Vault Promomats"
          logo="🟢"
          status={veevaStatus}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vault DNS *</label>
              <input
                type="text"
                value={veevaForm.vaultDns}
                onChange={(e) => setVeevaForm((f) => ({ ...f, vaultDns: e.target.value }))}
                placeholder="yourcompany.veevavault.com"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username *</label>
                <input
                  type="text"
                  value={veevaForm.username}
                  onChange={(e) => setVeevaForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="user@company.com"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={veevaForm.password}
                    onChange={(e) => setVeevaForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pr-7 px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max documents</label>
              <input
                type="number"
                value={veevaForm.limit}
                onChange={(e) => setVeevaForm((f) => ({ ...f, limit: e.target.value }))}
                min={1}
                max={1000}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <StatusBadge status={veevaStatus} message={veevaMsg} />

            <div className="flex gap-2">
              <button
                onClick={testVeeva}
                disabled={!veevaForm.vaultDns || !veevaForm.username || !veevaForm.password || veevaStatus === "testing"}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded font-medium transition-colors",
                  !veevaForm.vaultDns || !veevaForm.username || !veevaForm.password
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                )}
              >
                {veevaStatus === "testing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                Test Connection
              </button>
              <button
                onClick={fetchVeeva}
                disabled={!veevaForm.vaultDns || !veevaForm.username || !veevaForm.password || veevaFetching}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded font-medium transition-colors",
                  !veevaForm.vaultDns || !veevaForm.username || !veevaForm.password
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {veevaFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Fetch Data
              </button>
            </div>

            {veevaPreview && (
              <ImportPreview
                rows={veevaPreview}
                source="Veeva"
                onImport={(mode) => { onImport(veevaPreview, mode); setVeevaPreview(null); }}
                onDiscard={() => setVeevaPreview(null)}
              />
            )}
          </div>
        </Section>

        <div className="p-4 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-500">Data mapping</p>
          <p><span className="text-slate-600">CM360 Campaigns</span> → campaign_name, campaign_id, expiration_date, brand</p>
          <p><span className="text-slate-600">CM360 Creatives</span> → creative_name, creative_id, campaign_id, vendor_channel</p>
          <p><span className="text-slate-600">Veeva Documents</span> → vault_global_id, vault_asset_id, name, status, brand, last_modified_date, expiration_date, indication</p>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  active,
  onToggle,
  title,
  logo,
  status,
  children,
}: {
  id: string;
  active: boolean;
  onToggle: () => void;
  title: string;
  logo: string;
  status: ConnStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-base">{logo}</span>
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
          {status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
          {status === "testing" && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
          {active ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {active && (
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, message }: { status: ConnStatus; message: string }) {
  if (status === "idle" || !message) return null;
  return (
    <div className={cn(
      "flex items-start gap-2 p-2 rounded text-xs",
      status === "ok" ? "bg-green-50 text-green-700 border border-green-200" :
      status === "error" ? "bg-red-50 text-red-700 border border-red-200" :
      "bg-blue-50 text-blue-700 border border-blue-200"
    )}>
      {status === "ok" && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      {status === "error" && <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      {status === "testing" && <Loader2 className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin" />}
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

function ImportPreview({
  rows,
  source,
  onImport,
  onDiscard,
}: {
  rows: CampaignRow[];
  source: string;
  onImport: (mode: "append" | "replace") => void;
  onDiscard: () => void;
}) {
  const nonEmpty = rows.filter((r) =>
    MASTER_COLUMNS.some((c) => r[c.key]?.trim())
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-medium text-slate-700">
          {rows.length} rows fetched from {source}
        </span>
        <button onClick={onDiscard} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
          Discard
        </button>
      </div>
      <div className="p-3 space-y-2">
        <button
          onClick={() => onImport("append")}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Append {rows.length} rows
        </button>
        <button
          onClick={() => onImport("replace")}
          className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded hover:bg-slate-50 transition-colors"
        >
          <Replace className="w-3.5 h-3.5" />
          Replace all rows
        </button>
        {nonEmpty.length < rows.length && (
          <p className="text-[10px] text-slate-400">
            {rows.length - nonEmpty.length} rows had no mapped data (fields not in master schema)
          </p>
        )}
      </div>
    </div>
  );
}

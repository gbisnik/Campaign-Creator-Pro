export type DataType = "varchar" | "date" | "number" | "unknown";
export type RequiredLevel = "required" | "optional" | "conditional";

export interface MasterColumn {
  key: string;
  label: string;
  dataType: DataType;
  requiredLevel: RequiredLevel;
  requiredNote?: string;
  example?: string;
  source?: string;
  rules?: string;
}

export const MASTER_COLUMNS: MasterColumn[] = [
  {
    key: "vendor_channel",
    label: "vendor_channel",
    dataType: "varchar",
    requiredLevel: "required",
    example: "Programmatic",
    source: "IE PROD Support Team",
    rules: "Represents the vendor channel or tactic type for the media.",
  },
  {
    key: "vault_global_id",
    label: "vault_global_id",
    dataType: "varchar",
    requiredLevel: "required",
    example: "4075_660750",
    source: "Veeva Vault Promomats",
    rules: "Global ID from PRC approval job for most media.",
  },
  {
    key: "vault_asset_id",
    label: "vault_asset_id",
    dataType: "varchar",
    requiredLevel: "required",
    example: "US-YES-00248",
    source: "Veeva Vault Promomats",
    rules: "Asset ID from PRC approval job for most media.",
  },
  {
    key: "utm_source",
    label: "utm_source",
    dataType: "varchar",
    requiredLevel: "required",
    example: "deepintent",
    source: "IE PROD Support Team",
    rules: "Platform or site source the event data is coming from.",
  },
  {
    key: "utm_medium",
    label: "utm_medium",
    dataType: "varchar",
    requiredLevel: "required",
    example: "display",
    source: "IE PROD Support Team",
  },
  {
    key: "utm_content",
    label: "utm_content",
    dataType: "varchar",
    requiredLevel: "required",
    example: "programmatic_us-yes-00248",
    source: "IE PROD Support Team",
  },
  {
    key: "utm_campaign",
    label: "utm_campaign",
    dataType: "varchar",
    requiredLevel: "required",
    example: "yescarta_hcp_lbcl_branded_uc1-15",
    source: "IE PROD Support Team",
  },
  {
    key: "use_case",
    label: "use_case",
    dataType: "varchar",
    requiredLevel: "required",
    example: "MVP-1",
    source: "IE PROD Support Team",
  },
  {
    key: "url_link",
    label: "url_link",
    dataType: "varchar",
    requiredLevel: "required",
    example: "https://gilead-eame.veevavault.com/ui/#doc_info/660750/1/0",
    source: "Veeva Vault Promomats",
  },
  {
    key: "topic",
    label: "topic",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "Disease",
    source: "Veeva Vault Promomats",
  },
  {
    key: "tactic_name",
    label: "tactic_name",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for MedScape or Relevate",
    source: "Medscape or Relevate Health Platforms",
  },
  {
    key: "tactic_id",
    label: "tactic_id",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for MedScape or Relevate",
    source: "Medscape or Relevate Health Platforms",
  },
  {
    key: "subtopic",
    label: "subtopic",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "T-cell Fitness",
    source: "Veeva Vault Promomats",
  },
  {
    key: "step_id",
    label: "step_id",
    dataType: "varchar",
    requiredLevel: "required",
    example: "UC1-15",
    source: "IE PROD Support Team",
  },
  {
    key: "status",
    label: "status",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "Approved for Use",
    source: "Veeva Vault Promomats",
  },
  {
    key: "platform",
    label: "platform",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "DeepIntent Orchestrate",
    source: "IE PROD Support Team",
  },
  {
    key: "name",
    label: "name",
    dataType: "varchar",
    requiredLevel: "required",
    example: "Yescarta - www-banner - US-YES-00248",
    source: "Veeva Vault Promomats",
  },
  {
    key: "metadata_status",
    label: "metadata_status",
    dataType: "varchar",
    requiredLevel: "required",
    example: "Active",
    source: "IE PROD Support Team",
  },
  {
    key: "last_modified_date",
    label: "last_modified_date",
    dataType: "date",
    requiredLevel: "optional",
    source: "Veeva Vault Promomats",
  },
  {
    key: "indication",
    label: "indication",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "2L LBCL",
    source: "Veeva Vault Promomats",
  },
  {
    key: "ID",
    label: "ID",
    dataType: "varchar",
    requiredLevel: "required",
    example: "16",
    source: "IE PROD Support Team",
  },
  {
    key: "expiration_date",
    label: "expiration_date",
    dataType: "date",
    requiredLevel: "optional",
    source: "Veeva Vault Promomats",
  },
  {
    key: "creative_name",
    label: "creative_name",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for DeepIntent",
    example: "english_us-yes-00248_deepintent_programmatic_display",
    source: "DeepIntent Platform",
  },
  {
    key: "creative_id",
    label: "creative_id",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for DeepIntent",
    example: "152926",
    source: "DeepIntent Platform",
  },
  {
    key: "content",
    label: "content",
    dataType: "varchar",
    requiredLevel: "optional",
    source: "Veeva Vault Promomats",
  },
  {
    key: "campaign_name",
    label: "campaign_name",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for DeepIntent",
    example: "Kite_Yescarta_HCP_LBCL_2024",
    source: "DeepIntent Platform",
  },
  {
    key: "campaign_id",
    label: "campaign_id",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for DeepIntent",
    example: "19604",
    source: "DeepIntent Platform",
  },
  {
    key: "business_tactic_name",
    label: "business_tactic_name",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "EHR",
  },
  {
    key: "business_tactic_id",
    label: "business_tactic_id",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "12",
  },
  {
    key: "business_campaign_name",
    label: "business_campaign_name",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "YESCARTA - LBCL - Endemic",
  },
  {
    key: "business_campaign_id",
    label: "business_campaign_id",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "11",
  },
  {
    key: "brand",
    label: "brand",
    dataType: "varchar",
    requiredLevel: "optional",
    example: "YESCARTA",
    source: "Veeva Vault Promomats",
  },
  {
    key: "audience_ids",
    label: "audience_ids",
    dataType: "varchar",
    requiredLevel: "conditional",
    requiredNote: "Required for DeepIntent",
    example: "41104",
    source: "DeepIntent Platform",
  },
];

export type CampaignRow = Record<string, string> & { _id: string };

export function createEmptyRow(): CampaignRow {
  const row: CampaignRow = { _id: crypto.randomUUID() };
  for (const col of MASTER_COLUMNS) {
    row[col.key] = "";
  }
  return row;
}

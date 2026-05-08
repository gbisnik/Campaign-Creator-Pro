import { Router, type IRouter } from "express";
import {
  testVeevaConnection,
  fetchVeevaDocuments,
} from "../../lib/veevaClient.js";

const router: IRouter = Router();

router.post("/connectors/veeva/test", async (req, res): Promise<void> => {
  const { vaultDns, username, password } = req.body as {
    vaultDns?: string;
    username?: string;
    password?: string;
  };

  if (!vaultDns || !username || !password) {
    res.status(400).json({ error: "vaultDns, username, and password are required" });
    return;
  }

  const result = await testVeevaConnection({ vaultDns, username, password });
  res.json(result);
});

router.post("/connectors/veeva/fetch", async (req, res): Promise<void> => {
  const { vaultDns, username, password, limit, offset } = req.body as {
    vaultDns?: string;
    username?: string;
    password?: string;
    limit?: number;
    offset?: number;
  };

  if (!vaultDns || !username || !password) {
    res.status(400).json({ error: "vaultDns, username, and password are required" });
    return;
  }

  const docs = await fetchVeevaDocuments(
    { vaultDns, username, password },
    { limit, offset }
  );

  const rows = docs.map((d) => ({
    vault_asset_id: d.documentNumber ?? "",
    vault_global_id: d.id,
    name: d.name,
    status: d.status ?? "",
    brand: d.brand ?? "",
    last_modified_date: d.versionModifiedDate
      ? d.versionModifiedDate.split("T")[0]
      : "",
    expiration_date: d.expirationDate
      ? d.expirationDate.split("T")[0]
      : "",
    indication: d.indication ?? "",
    vendor_channel: d.type ?? "",
  }));

  res.json({ rows, count: rows.length });
});

export default router;

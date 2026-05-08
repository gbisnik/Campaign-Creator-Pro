import { Router, type IRouter } from "express";
import {
  testCM360Connection,
  fetchCM360Campaigns,
  fetchCM360Creatives,
} from "../../lib/cm360Client.js";

const router: IRouter = Router();

router.post("/connectors/cm360/test", async (req, res): Promise<void> => {
  const { serviceAccountJson, profileId } = req.body as {
    serviceAccountJson?: string;
    profileId?: string;
  };

  if (!serviceAccountJson || !profileId) {
    res.status(400).json({ error: "serviceAccountJson and profileId are required" });
    return;
  }

  const result = await testCM360Connection({ serviceAccountJson, profileId });
  res.json(result);
});

router.post("/connectors/cm360/fetch", async (req, res): Promise<void> => {
  const { serviceAccountJson, profileId, advertiserId, dataType, maxResults } =
    req.body as {
      serviceAccountJson?: string;
      profileId?: string;
      advertiserId?: string;
      dataType?: "campaigns" | "creatives";
      maxResults?: number;
    };

  if (!serviceAccountJson || !profileId) {
    res.status(400).json({ error: "serviceAccountJson and profileId are required" });
    return;
  }

  const creds = { serviceAccountJson, profileId };

  if (dataType === "creatives") {
    const creatives = await fetchCM360Creatives(creds, {
      advertiserId,
      maxResults,
    });
    res.json({ rows: creatives, count: creatives.length });
    return;
  }

  const campaigns = await fetchCM360Campaigns(creds, {
    advertiserId,
    maxResults,
  });

  const rows = campaigns.map((c) => ({
    campaign_name: c.name,
    campaign_id: c.id,
    vendor_channel: "Campaign Manager 360",
    platform: "Campaign Manager 360",
    expiration_date: c.endDate ?? "",
    brand: c.advertiserName ?? "",
  }));

  res.json({ rows, count: rows.length });
});

export default router;

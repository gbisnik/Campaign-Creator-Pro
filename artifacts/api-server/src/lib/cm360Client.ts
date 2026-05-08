import { createSign } from "crypto";

export interface CM360Credentials {
  serviceAccountJson: string;
  profileId: string;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(serviceAccountJson) as ServiceAccount;
  } catch {
    throw new Error("Invalid service account JSON");
  }

  if (!sa.client_email || !sa.private_key) {
    throw new Error("Service account JSON missing client_email or private_key");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/dfareporting https://www.googleapis.com/auth/dfatrafficking",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenData.access_token) {
    throw new Error(
      `Google auth failed: ${tokenData.error_description ?? tokenData.error ?? "unknown error"}`
    );
  }

  return tokenData.access_token;
}

export interface CM360Campaign {
  id: string;
  name: string;
  advertiserId: string;
  advertiserName?: string;
  startDate?: string;
  endDate?: string;
  archived?: boolean;
}

export async function testCM360Connection(
  creds: CM360Credentials
): Promise<{ ok: boolean; profileName?: string; error?: string }> {
  try {
    const token = await getAccessToken(creds.serviceAccountJson);
    const res = await fetch(
      `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${creds.profileId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      return {
        ok: false,
        error: err.error?.message ?? `HTTP ${res.status}`,
      };
    }
    const profile = (await res.json()) as { profileName?: string };
    return { ok: true, profileName: profile.profileName };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function fetchCM360Campaigns(
  creds: CM360Credentials,
  opts: { advertiserId?: string; maxResults?: number } = {}
): Promise<CM360Campaign[]> {
  const token = await getAccessToken(creds.serviceAccountJson);

  const params = new URLSearchParams({
    maxResults: String(opts.maxResults ?? 500),
    archived: "false",
  });
  if (opts.advertiserId) {
    params.set("advertiserIds", opts.advertiserId);
  }

  const res = await fetch(
    `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${creds.profileId}/campaigns?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `CM360 API error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    campaigns?: Array<{
      id: string;
      name: string;
      advertiserId: string;
      advertiserName?: string;
      startDate?: string;
      endDate?: string;
      archived?: boolean;
    }>;
  };

  return (data.campaigns ?? []).map((c) => ({
    id: String(c.id),
    name: c.name,
    advertiserId: String(c.advertiserId),
    advertiserName: c.advertiserName,
    startDate: c.startDate,
    endDate: c.endDate,
    archived: c.archived,
  }));
}

export async function fetchCM360Creatives(
  creds: CM360Credentials,
  opts: { advertiserId?: string; campaignId?: string; maxResults?: number } = {}
): Promise<Array<Record<string, string>>> {
  const token = await getAccessToken(creds.serviceAccountJson);

  const params = new URLSearchParams({
    maxResults: String(opts.maxResults ?? 500),
  });
  if (opts.advertiserId) params.set("advertiserIds", opts.advertiserId);
  if (opts.campaignId) params.set("campaignIds", opts.campaignId);

  const res = await fetch(
    `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${creds.profileId}/creatives?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `CM360 API error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    creatives?: Array<{
      id: string;
      name: string;
      advertiserId: string;
      campaignId?: string;
      type?: string;
    }>;
  };

  return (data.creatives ?? []).map((c) => ({
    creative_id: String(c.id),
    creative_name: c.name ?? "",
    campaign_id: String(c.campaignId ?? ""),
    vendor_channel: c.type?.toLowerCase() ?? "",
    platform: "Campaign Manager 360",
  }));
}

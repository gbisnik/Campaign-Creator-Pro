export interface VeevaCredentials {
  vaultDns: string;
  username: string;
  password: string;
}

function baseUrl(vaultDns: string): string {
  const dns = vaultDns.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${dns}/api/v24.3`;
}

export async function getVeevaSessionId(
  creds: VeevaCredentials
): Promise<string> {
  const url = `${baseUrl(creds.vaultDns)}/auth`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: creds.username,
      password: creds.password,
    }),
  });

  const data = (await res.json()) as {
    responseStatus?: string;
    sessionId?: string;
    errors?: Array<{ message?: string }>;
  };

  if (data.responseStatus !== "SUCCESS" || !data.sessionId) {
    const msg =
      data.errors?.[0]?.message ??
      `Veeva auth failed (status: ${data.responseStatus ?? res.status})`;
    throw new Error(msg);
  }

  return data.sessionId;
}

export async function testVeevaConnection(
  creds: VeevaCredentials
): Promise<{ ok: boolean; vaultName?: string; error?: string }> {
  try {
    const sessionId = await getVeevaSessionId(creds);
    const url = `${baseUrl(creds.vaultDns)}/objects/vaults`;
    const res = await fetch(url, {
      headers: { Authorization: sessionId },
    });
    const data = (await res.json()) as {
      responseStatus?: string;
      vaults?: Array<{ name?: string }>;
      errors?: Array<{ message?: string }>;
    };
    if (data.responseStatus !== "SUCCESS") {
      return {
        ok: false,
        error: data.errors?.[0]?.message ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, vaultName: data.vaults?.[0]?.name };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export interface VeevaDocument {
  id: string;
  name: string;
  documentNumber?: string;
  status?: string;
  type?: string;
  brand?: string;
  versionModifiedDate?: string;
  expirationDate?: string;
  indication?: string;
}

export async function fetchVeevaDocuments(
  creds: VeevaCredentials,
  opts: { limit?: number; offset?: number; filter?: string } = {}
): Promise<VeevaDocument[]> {
  const sessionId = await getVeevaSessionId(creds);

  const params = new URLSearchParams({
    limit: String(opts.limit ?? 200),
    offset: String(opts.offset ?? 0),
  });

  const url = `${baseUrl(creds.vaultDns)}/objects/documents?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: sessionId },
  });

  const data = (await res.json()) as {
    responseStatus?: string;
    documents?: Array<{
      document?: {
        id?: number | string;
        name__v?: string;
        document_number__v?: string;
        status__v?: string;
        type__v?: string;
        brand__v?: string;
        version_modified_date__v?: string;
        expiration_date__v?: string;
        indication__v?: string;
        document_creation_date__v?: string;
      };
    }>;
    errors?: Array<{ message?: string }>;
  };

  if (data.responseStatus !== "SUCCESS") {
    throw new Error(
      data.errors?.[0]?.message ?? `Veeva API error: HTTP ${res.status}`
    );
  }

  return (data.documents ?? []).map((d) => {
    const doc = d.document ?? {};
    return {
      id: String(doc.id ?? ""),
      name: doc.name__v ?? "",
      documentNumber: doc.document_number__v,
      status: doc.status__v,
      type: doc.type__v,
      brand: doc.brand__v,
      versionModifiedDate: doc.version_modified_date__v,
      expirationDate: doc.expiration_date__v,
      indication: doc.indication__v,
    };
  });
}

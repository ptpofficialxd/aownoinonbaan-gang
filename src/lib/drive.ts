import { randomUUID } from "node:crypto";
import { sql } from "./db";

const GOOGLE_OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_DRIVE_PROVIDER = "google_drive";
export const GOOGLE_DRIVE_STATE_COOKIE = "aownoinonbaan_drive_oauth_state";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

type IntegrationTokenRow = {
  refresh_token: string;
  account_email: string | null;
  scope: string | null;
};

let cachedToken: CachedToken | null = null;
const categoryFolderCache = new Map<string, string>();

function getDriveFolderConfig() {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is required.");
  }
  return { rootFolderId };
}

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth env. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

async function getStoredRefreshToken() {
  const rows = (await sql()`
    SELECT refresh_token, account_email, scope
    FROM integration_tokens
    WHERE provider = ${GOOGLE_DRIVE_PROVIDER}
    LIMIT 1
  `) as IntegrationTokenRow[];

  return rows[0] ?? null;
}

export async function isGoogleDriveConnected() {
  const stored = await getStoredRefreshToken();
  return Boolean(stored?.refresh_token);
}

export async function getGoogleDriveConnectionInfo() {
  const stored = await getStoredRefreshToken();
  return {
    connected: Boolean(stored?.refresh_token),
    accountEmail: stored?.account_email ?? null,
    scope: stored?.scope ?? null,
  };
}

export async function getGoogleDriveQuotaInfo() {
  const stored = await getStoredRefreshToken();
  if (!stored?.refresh_token) {
    return {
      limitBytes: null,
      usageBytes: null,
      remainingBytes: null,
    };
  }

  const token = await getAccessToken();
  const url = new URL("https://www.googleapis.com/drive/v3/about");
  url.searchParams.set("fields", "storageQuota(limit,usage)");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive quota lookup failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as {
    storageQuota?: {
      limit?: string;
      usage?: string;
    };
  };

  const limitBytes = data.storageQuota?.limit
    ? Number(data.storageQuota.limit)
    : null;
  const usageBytes = data.storageQuota?.usage
    ? Number(data.storageQuota.usage)
    : null;

  return {
    limitBytes,
    usageBytes,
    remainingBytes:
      limitBytes !== null && usageBytes !== null
        ? Math.max(limitBytes - usageBytes, 0)
        : null,
  };
}

export function createGoogleDriveOAuthState() {
  return randomUUID();
}

export function buildGoogleDriveAuthUrl(state: string) {
  const { clientId, redirectUri } = getOAuthConfig();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForRefreshToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google code exchange failed: ${res.status}`);
  }

  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    token_type: string;
    id_token?: string;
  };
}

async function fetchGoogleAccountEmail(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo?fields=email",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

export async function saveGoogleDriveRefreshToken(input: {
  refreshToken: string;
  accessToken: string;
  scope?: string;
}) {
  const accountEmail = await fetchGoogleAccountEmail(input.accessToken);

  await sql()`
    INSERT INTO integration_tokens (provider, refresh_token, scope, account_email)
    VALUES (
      ${GOOGLE_DRIVE_PROVIDER},
      ${input.refreshToken},
      ${input.scope ?? null},
      ${accountEmail}
    )
    ON CONFLICT (provider)
    DO UPDATE SET
      refresh_token = EXCLUDED.refresh_token,
      scope = EXCLUDED.scope,
      account_email = EXCLUDED.account_email
  `;

  cachedToken = null;
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const stored = await getStoredRefreshToken();
  if (!stored?.refresh_token) {
    throw new Error("Google Drive is not connected yet.");
  }

  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: stored.refresh_token,
    grant_type: "refresh_token",
    redirect_uri: redirectUri,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function uploadFileToDrive(input: {
  fileName: string;
  mimeType: string;
  file: File;
  category?: string | null;
  description?: string | null;
}) {
  const token = await getAccessToken();
  const { rootFolderId } = getDriveFolderConfig();
  const targetFolderId = input.category
    ? await getCategoryFolderId(token, rootFolderId, input.category)
    : rootFolderId;

  const metadata = {
    name: input.fileName,
    description: input.description || undefined,
    parents: [targetFolderId],
  };

  const query = new URL(GOOGLE_DRIVE_UPLOAD_URL);
  query.searchParams.set("uploadType", "resumable");
  query.searchParams.set("supportsAllDrives", "true");
  query.searchParams.set(
    "fields",
    "id,name,mimeType,size,webViewLink,webContentLink",
  );

  const initRes = await fetch(query, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType,
      "X-Upload-Content-Length": String(input.file.size),
    },
    body: JSON.stringify(metadata),
    cache: "no-store",
  });

  if (!initRes.ok) {
    const detail = await initRes.text();
    throw new Error(
      `Drive resumable init failed: ${initRes.status} ${detail}`,
    );
  }

  const sessionUrl = initRes.headers.get("Location");
  if (!sessionUrl) {
    throw new Error("Drive resumable upload session URL was not returned.");
  }

  const uploadRes = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.mimeType,
      "Content-Length": String(input.file.size),
    },
    body: input.file.stream() as BodyInit,
    duplex: "half",
    cache: "no-store",
  } as RequestInit & { duplex: "half" });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    throw new Error(`Drive upload failed: ${uploadRes.status} ${detail}`);
  }

  return (await uploadRes.json()) as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
  };
}

async function getCategoryFolderId(
  token: string,
  rootFolderId: string,
  category: string,
) {
  const normalizedCategory = category.trim();
  const cacheKey = `${rootFolderId}:${normalizedCategory.toLowerCase()}`;
  const cachedFolderId = categoryFolderCache.get(cacheKey);
  if (cachedFolderId) {
    return cachedFolderId;
  }

  const url = new URL(GOOGLE_DRIVE_API_URL);
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  url.searchParams.set("fields", "files(id,name)");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set(
    "q",
    [
      "mimeType = 'application/vnd.google-apps.folder'",
      `name = '${normalizedCategory.replace(/'/g, "\\'")}'`,
      `'${rootFolderId}' in parents`,
      "trashed = false",
    ].join(" and "),
  );

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive folder lookup failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as {
    files?: Array<{ id: string; name: string }>;
  };

  const folderId = data.files?.[0]?.id;
  if (!folderId) {
    throw new Error(
      `Folder "${normalizedCategory}" was not found inside the configured Google Drive root folder.`,
    );
  }

  categoryFolderCache.set(cacheKey, folderId);
  return folderId;
}

export async function streamDriveFile(fileId: string) {
  const token = await getAccessToken();
  const url = new URL(`${GOOGLE_DRIVE_API_URL}/${fileId}`);
  url.searchParams.set("alt", "media");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Drive stream failed: ${res.status}`);
  }

  return res;
}

export async function deleteDriveFile(fileId: string) {
  const token = await getAccessToken();
  const url = new URL(`${GOOGLE_DRIVE_API_URL}/${fileId}`);
  url.searchParams.set("supportsAllDrives", "true");

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok && res.status !== 404) {
    const detail = await res.text();
    throw new Error(`Drive delete failed: ${res.status} ${detail}`);
  }
}

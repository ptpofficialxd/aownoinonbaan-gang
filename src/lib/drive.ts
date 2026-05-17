import { randomUUID } from "node:crypto";
import { sql } from "./db";

const GOOGLE_OAUTH_SCOPE = "https://www.googleapis.com/auth/drive";
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
  bytes: Buffer;
  description?: string | null;
}) {
  const token = await getAccessToken();
  const { rootFolderId } = getDriveFolderConfig();
  const boundary = `aownoinonbaan-${Date.now()}`;

  const metadata = {
    name: input.fileName,
    description: input.description || undefined,
    parents: [rootFolderId],
  };

  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`),
    input.bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const query = new URL(GOOGLE_DRIVE_UPLOAD_URL);
  query.searchParams.set(
    "fields",
    "id,name,mimeType,size,webViewLink,webContentLink",
  );

  const res = await fetch(query, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
  };
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

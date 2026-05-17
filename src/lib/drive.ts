import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/drive";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function getServiceAccountConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!email || !privateKey || !rootFolderId) {
    throw new Error(
      "Missing Google Drive env. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID.",
    );
  }

  return {
    email,
    privateKey,
    rootFolderId,
    sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || null,
  };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const { email, privateKey } = getServiceAccountConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: email,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google token request failed: ${res.status}`);
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
  const { rootFolderId, sharedDriveId } = getServiceAccountConfig();
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
  if (sharedDriveId) {
    query.searchParams.set("driveId", sharedDriveId);
  }

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
  url.searchParams.set("supportsAllDrives", "true");

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

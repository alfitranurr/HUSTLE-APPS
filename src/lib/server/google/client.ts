import 'server-only';
import { google, type drive_v3, type sheets_v4 } from 'googleapis';
import { JWT, OAuth2Client } from 'google-auth-library';
import { getServerEnv } from '@/lib/env';

let authClient: OAuth2Client | JWT | undefined;

/** OAuth (Drive owner's refresh token) when configured, otherwise the service account. */
function getAuthClient(): OAuth2Client | JWT {
  if (authClient) return authClient;
  const env = getServerEnv();

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
    const oauth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
    authClient = oauth;
    return oauth;
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '');
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }
  authClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });
  return authClient;
}

export function sheets(): sheets_v4.Sheets {
  return google.sheets({ version: 'v4', auth: getAuthClient() as OAuth2Client });
}

export function drive(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuthClient() as OAuth2Client });
}

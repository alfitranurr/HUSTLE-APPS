#!/usr/bin/env node
/**
 * Issues a new GOOGLE_REFRESH_TOKEN for the owner's Google account with the
 * scopes the app needs (Sheets, Drive, and read-only Gmail for Job match), and
 * writes it into .env.local. The token is never printed.
 *
 *   node scripts/google-oauth-token.mjs
 *
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local. If Google
 * reports "redirect_uri_mismatch", add http://localhost:53682/oauth2callback
 * to the OAuth client's Authorized redirect URIs in Google Cloud Console.
 */
import { exec } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { OAuth2Client } from 'google-auth-library';

const ENV_FILE = '.env.local';
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  // Full Drive scope (as before): uploads go into an existing folder the owner created.
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.readonly',
];

function readEnv() {
  const text = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !line.startsWith('#')) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { text, env };
}

function writeToken(token) {
  const { text } = readEnv();
  const line = `GOOGLE_REFRESH_TOKEN=${token}`;
  const next = /^GOOGLE_REFRESH_TOKEN=.*$/m.test(text)
    ? text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, line)
    : `${text.replace(/\s*$/, '')}\n${line}\n`;
  fs.writeFileSync(ENV_FILE, next);
}

const { env } = readEnv();
if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
  console.error(`GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in ${ENV_FILE}.`);
  process.exit(1);
}

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, REDIRECT);
const url = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });

const server = http.createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url ?? '/', REDIRECT);
  if (pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }
  const done = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end(message);
    server.close();
  };
  const error = searchParams.get('error');
  if (error) {
    console.error(`Google returned an error: ${error}`);
    return done(400, `Authorisation failed: ${error}. You can close this tab.`);
  }
  try {
    const { tokens } = await client.getToken(searchParams.get('code') ?? '');
    if (!tokens.refresh_token) throw new Error('No refresh token returned (revoke the app at myaccount.google.com/permissions and retry).');
    const granted = tokens.scope ?? '';
    const missing = SCOPES.filter((s) => !granted.includes(s));
    writeToken(tokens.refresh_token);
    console.log(`Saved a new GOOGLE_REFRESH_TOKEN to ${ENV_FILE}.`);
    if (missing.length) console.warn(`Warning: these scopes were not granted: ${missing.join(', ')}`);
    console.log('Next: add it to Vercel (vercel env rm/add GOOGLE_REFRESH_TOKEN for Production and Preview), then redeploy.');
    done(200, 'Done. The new token was saved to .env.local. You can close this tab.');
  } catch (err) {
    console.error(`Could not get a token: ${err instanceof Error ? err.message : String(err)}`);
    done(500, 'Could not get a token. Check the terminal. You can close this tab.');
  }
});

server.listen(PORT, () => {
  console.log('Opening Google sign-in in your browser. If it does not open, visit this URL:');
  console.log(url);
  const opener = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(opener);
});

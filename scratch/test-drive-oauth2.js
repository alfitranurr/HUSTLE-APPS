const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Read and parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  console.error('Failed to read .env.local:', err.message);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
const refreshToken = env.GOOGLE_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error('OAuth2 credentials not found in .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'http://localhost:8080/oauth2callback'
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function testFolder(folderId, label) {
  console.log(`\n--- Testing folder (${label}): ${folderId} ---`);
  if (!folderId) {
    console.log('Folder ID is empty.');
    return;
  }
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, owners, capabilities',
      supportsAllDrives: true,
    });
    console.log('Success! Folder details:');
    console.log('Name:', res.data.name);
    console.log('MimeType:', res.data.mimeType);
    console.log('Owners:', res.data.owners ? res.data.owners.map(o => o.emailAddress).join(', ') : 'N/A');
    console.log('Can Add Children:', res.data.capabilities ? res.data.capabilities.canAddChildren : 'Unknown');
  } catch (err) {
    console.error('Error fetching folder:', err.message);
  }
}

async function run() {
  try {
    // Let's get the user info of this OAuth2 client
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log('OAuth2 Client authorized user email:', userInfo.data.email);
  } catch (err) {
    console.error('Could not fetch user info for OAuth2 client:', err.message);
  }

  // Test current folder from .env.local
  await testFolder(env.GOOGLE_DRIVE_FOLDER_ID, 'Value in .env.local');
  // Test folder from the error message
  await testFolder('1tmWJEOCOFPUn1Rfx2SPjuLy5FxwyBKeD', 'Value from error message');
}

run();

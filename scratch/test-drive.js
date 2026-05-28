const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

// Read and parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
console.log('Reading env file from:', envPath);
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

const serviceAccountKeyStr = env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKeyStr) {
  console.error('GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.local');
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(serviceAccountKeyStr);
} catch (err) {
  console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', err.message);
  process.exit(1);
}

console.log('Service Account email:', credentials.client_email);

const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

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
    if (err.message.includes('File not found')) {
      console.error('Recommendation: The folder does not exist OR the Service Account does not have permission/access to it. Make sure you share the Google Drive folder with the Service Account email!');
    }
  }
}

async function run() {
  // Test current folder from .env.local
  await testFolder(env.GOOGLE_DRIVE_FOLDER_ID, 'Value in .env.local');
  // Test folder from the error message
  await testFolder('1tmWJEOCOFPUn1Rfx2SPjuLy5FxwyBKeD', 'Value from error message');
}

run();

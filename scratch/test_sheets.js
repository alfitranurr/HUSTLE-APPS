/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

function cleanEnvValue(val) {
  if (!val) return undefined;
  return val.trim();
}

function getAuthClient() {
  const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = cleanEnvValue(process.env.GOOGLE_REFRESH_TOKEN);

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:8080/oauth2callback'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Missing Google Auth variables');
  }
  const credentials = JSON.parse(serviceAccountKey);
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

async function run() {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const SHEET_NAME = 'DataLowongan';

    console.log("Reading headers from sheet...");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:Q1`,
    });

    console.log("Current headers in Sheet:", response.data.values ? response.data.values[0] : "Empty");

    const expectedHeaders = ['ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web', 'Kategori', 'Note', 'BuktiURL', 'Platform', 'CareerLevel', 'CurrentStage', 'Province', 'City'];
    
    console.log("Updating headers to match expected 17 columns...");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:Q1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [expectedHeaders],
      },
    });

    console.log("Headers updated successfully!");

    // Fetch the last row to inspect
    const readAll = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:Q`,
    });
    console.log(`Total rows in sheet (including header): ${readAll.data.values ? readAll.data.values.length : 0}`);
    if (readAll.data.values && readAll.data.values.length > 1) {
      console.log("Last row data:", readAll.data.values[readAll.data.values.length - 1]);
    }
  } catch (e) {
    console.error("Execution failed:", e);
  }
}

run();

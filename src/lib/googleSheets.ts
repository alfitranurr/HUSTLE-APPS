import { google } from 'googleapis';
import { JWT, OAuth2Client } from 'google-auth-library';

export interface Job {
  id: string;
  timestamp: string;
  company: string;
  startdate: string;
  enddate: string;
  status: string;
  instagram: string;
  linkedin: string;
  web: string;
  kategori: string;
  note: string;
  buktiurl: string;
  rownum: number;
}

const SHEET_NAME = 'DataLowongan';

function cleanEnvValue(val?: string): string | undefined {
  if (!val) return undefined;
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1);
  } else if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.substring(1, clean.length - 1);
  }
  return clean.trim();
}

// Helper to get Google Auth Client (OAuth2 or JWT Service Account)
function getAuthClient(): OAuth2Client | JWT {
  const clientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const refreshToken = cleanEnvValue(process.env.GOOGLE_REFRESH_TOKEN);

  console.log('googleSheets.ts - loaded env values (cleaned):', {
    clientId: JSON.stringify(clientId),
    clientSecret: JSON.stringify(clientSecret),
    refreshToken: JSON.stringify(refreshToken),
  });

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:8080/oauth2callback'
    );
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    return oauth2Client;
  }

  // Fallback to Service Account
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Missing Google Auth variables (OAuth2 variables or GOOGLE_SERVICE_ACCOUNT_KEY) in environment variables');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON. Ensure it is a valid single-line JSON string.');
  }

  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

// Get Google Sheets Client
export function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth: auth as any });
}

// Get Google Drive Client
export function getDriveClient() {
  const auth = getAuthClient();
  return google.drive({ version: 'v3', auth: auth as any });
}

// Fetch all jobs
export async function fetchJobs(): Promise<Job[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:L`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    // Parse headers exactly as in Apps Script: trimmed, lowercased, spaces removed
    const headers = rows[0].map(h => String(h).trim().replace(/\s+/g, '').toLowerCase());
    const dataRows = rows.slice(1);

    return dataRows
      .map((row, idx) => {
        const obj: any = {};
        headers.forEach((header, colIdx) => {
          let val = row[colIdx];
          // Handle Date or empty columns
          if (val === undefined || val === null) {
            obj[header] = '';
          } else {
            obj[header] = String(val).trim();
          }
        });
        obj.rownum = idx + 2; // Rows are 1-indexed, header is row 1
        return obj as Job;
      })
      // Ensure company name is present
      .filter(item => item.company && item.company.trim() !== '');
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    // If the sheet does not exist, let's auto-setup/create it
    if (error.message && error.message.includes('NOT_FOUND')) {
      await setupDatabase();
      return [];
    }
    throw error;
  }
}

// Setup Sheet headers if empty or non-existent
export async function setupDatabase(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
  }

  const headers = ['ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web', 'Kategori', 'Note', 'BuktiURL'];

  try {
    // Check if the sheet exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(
      s => s.properties?.title === SHEET_NAME
    );

    if (!sheetExists) {
      // Add sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      });
    }

    // Set headers and styling
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:L1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Bold, custom styling for headers and freeze row 1
    const freshSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const numericSheetId = freshSpreadsheet.data.sheets?.find(
      s => s.properties?.title === SHEET_NAME
    )?.properties?.sheetId;

    if (numericSheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              setBasicFilter: {
                filter: {
                  range: {
                    sheetId: numericSheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: headers.length,
                  },
                },
              },
            },
            {
              updateSheetProperties: {
                properties: {
                  sheetId: numericSheetId,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId: numericSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 }, // #1e293b
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

// Save job record (append or update)
export async function saveJob(obj: {
  id?: string;
  rowNum?: number | string;
  company: string;
  startDate?: string;
  endDate?: string;
  status: string;
  linkIg?: string;
  linkLi?: string;
  linkWeb?: string;
  kategori?: string;
  note?: string;
  buktiurl?: string;
}): Promise<string> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
  }

  const id = obj.id || 'ID-' + new Date().getTime();
  const timestamp = new Date().toISOString();
  const rowData = [
    id,
    timestamp,
    obj.company.trim(),
    (obj.startDate || '').trim(),
    (obj.endDate || '').trim(),
    obj.status.trim(),
    (obj.linkIg || '').trim(),
    (obj.linkLi || '').trim(),
    (obj.linkWeb || '').trim(),
    (obj.kategori || '').trim(),
    (obj.note || '').trim(),
    (obj.buktiurl || 'No File').trim(),
  ];

  const parsedRowNum = obj.rowNum ? Number(obj.rowNum) : null;

  if (parsedRowNum && !isNaN(parsedRowNum)) {
    // Update existing row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A${parsedRowNum}:L${parsedRowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    return 'Updated';
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });
    return 'Appended';
  }
}

// Delete job record by row number
export async function deleteJob(rowNum: number): Promise<string> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID in environment variables');
  }

  try {
    // Get the sheetId of 'DataLowongan'
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
    const numericSheetId = sheet?.properties?.sheetId;

    if (numericSheetId === undefined) {
      throw new Error(`Sheet '${SHEET_NAME}' not found in the spreadsheet.`);
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: numericSheetId,
                dimension: 'ROWS',
                startIndex: rowNum - 1, // 0-based
                endIndex: rowNum, // exclusive
              },
            },
          },
        ],
      },
    });
    return 'Deleted';
  } catch (error) {
    console.error(`Error deleting row ${rowNum}:`, error);
    throw error;
  }
}

// Extract Google Drive File ID from Drive URL
export function getDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const fileIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileIdParam && fileIdParam[1]) return fileIdParam[1];
  return null;
}

// Delete/Trash file from Google Drive
export async function deleteFileFromDrive(fileUrl: string): Promise<void> {
  const fileId = getDriveFileId(fileUrl);
  if (!fileId) return;

  const drive = getDriveClient();
  try {
    // Set trashed: true to send it to the trash folder
    await drive.files.update({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        trashed: true,
      },
    });
  } catch (error) {
    console.error(`Failed to trash file ${fileId}:`, error);
  }
}

// Upload file to Google Drive folder
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID in environment variables');
  }

  // Create stream/Buffer readable metadata
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: new (require('stream').Readable)({
      read() {
        this.push(fileBuffer);
        this.push(null);
      },
    }),
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });

    const fileId = file.data.id;
    if (!fileId) {
      throw new Error('Drive file upload response missing ID');
    }

    // Set permission to anyone with link can view (reader)
    await drive.permissions.create({
      fileId: fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Fetch the shareable webViewLink
    const fileData = await drive.files.get({
      fileId,
      fields: 'webViewLink',
      supportsAllDrives: true,
    });

    return fileData.data.webViewLink || '';
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw error;
  }
}

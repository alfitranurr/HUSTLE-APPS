/**
 * HUSTLE.NUNN PRO - BACKEND V8.3 (Updated Status Options)
 * Fitur: Smart File Update & Custom Modal Logic
 */
const SHEET_NAME = 'DataLowongan';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚀 Hustle.Nunn Pro')
    .addItem('Setup Database', 'setupDatabase')
    .addSeparator()
    .addItem('Open Web App', 'showUrl')
    .addToUi();
}

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const headers = ['ID', 'Timestamp', 'Company', 'StartDate', 'EndDate', 'Status', 'Instagram', 'LinkedIn', 'Web', 'Kategori', 'Note', 'BuktiURL'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
       .setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DRIVE_FOLDER_ID')) {
    const folder = DriveApp.createFolder('Hustle_Nunn_Uploads');
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }
  SpreadsheetApp.getUi().alert('✅ Database Sync Berhasil!');
}

function doGet() {
  return HtmlService.createTemplateFromFile('frontend').evaluate()
      .setTitle('Hustle.Nunn Pro')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const vals = sheet.getDataRange().getValues();
  if (vals.length < 2) return [];
  
  const headers = vals[0].map(h => String(h).trim().replace(/\s+/g, '').toLowerCase());
  const rows = vals.slice(1);
  
  return rows.map((row, idx) => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = val.toISOString();
      obj[h] = val;
    });
    obj.rownum = idx + 2;
    return obj;
  }).filter(item => item.company && item.company !== "");
}

function saveRecord(obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const props = PropertiesService.getScriptProperties();
  let fileUrl = obj.existingUrl || "No File";

  if (obj.buktiFile && obj.buktiFile.name && obj.buktiFile.name !== "") {
    try {
      const folderId = props.getProperty('DRIVE_FOLDER_ID');
      const folder = DriveApp.getFolderById(folderId);
      const newFile = folder.createFile(obj.buktiFile);
      fileUrl = newFile.getUrl();

      if (obj.existingUrl && obj.existingUrl.includes("drive.google.com")) {
        const oldFileId = obj.existingUrl.split("/d/")[1].split("/")[0];
        DriveApp.getFileById(oldFileId).setTrashed(true);
      }
    } catch (e) {
      Logger.log("File upload error: " + e.toString());
    }
  }

  const rowData = [
    obj.id || "ID-" + new Date().getTime(),
    new Date(),
    obj.company, 
    obj.startDate, 
    obj.endDate, 
    obj.status,
    obj.linkIg || "", 
    obj.linkLi || "", 
    obj.linkWeb || "", 
    obj.kategori, 
    obj.note, 
    fileUrl
  ];

  if (obj.rowNum && obj.rowNum !== "") {
    sheet.getRange(Number(obj.rowNum), 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return "Success";
}

function deleteRecord(rowNum) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const row = Number(rowNum);
  const fileUrl = sheet.getRange(row, 12).getValue();
  
  if (fileUrl && fileUrl.includes("drive.google.com")) {
    try {
      const fileId = fileUrl.split("/d/")[1].split("/")[0];
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (e) {}
  }
  sheet.deleteRow(row);
  return "Deleted";
}

function getStats() {
  const data = getData();
  const stats = { total: data.length, notstarted: 0, progress: 0, success: 0, failed: 0 };
  data.forEach(item => {
    const s = String(item.status).toLowerCase();
    if (s.includes('not started')) stats.notstarted++;
    else if (s.includes('in progress') || s === 'progress') stats.progress++;
    else if (s.includes('success') || s === 'done') stats.success++;
    else if (s.includes('failed')) stats.failed++;
  });
  return stats;
}

function showUrl() {
  const url = ScriptApp.getService().getUrl();
  const html = `<p style="font-family:sans-serif; background:#020617; color:#fff; padding:20px;">URL: <a href="${url}" target="_blank" style="color:#6366f1">${url}</a></p>`;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(400).setHeight(150), 'App URL');
}
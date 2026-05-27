const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(rawLine => {
    const line = rawLine.trim();
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

console.log('\n--- DEBUG KREDENSIAL YANG DIBACA ---');
console.log('CLIENT ID:     ', JSON.stringify(CLIENT_ID));
console.log('CLIENT SECRET: ', JSON.stringify(CLIENT_SECRET));
console.log('-------------------------------------\n');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET harus diisi di file .env.local terlebih dahulu.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // offline access is required to get a refresh token
  scope: scopes,
  prompt: 'consent' // forces Google to show consent screen to ensure refresh token is returned
});

console.log('\n==================================================================');
console.log('SILAKAN LOGIN & OTORISASI MELALUI LINK BERIKUT:');
console.log('==================================================================');
console.log(authorizeUrl);
console.log('==================================================================\n');

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/oauth2callback')) {
      const qs = new url.URL(req.url, 'http://localhost:8080').searchParams;
      const code = qs.get('code');
      
      if (!code) {
        res.end('Otorisasi gagal: Kode tidak ditemukan.');
        return;
      }
      
      res.end('Otorisasi berhasil! Anda bisa menutup tab browser ini sekarang. Silakan kembali ke terminal Anda.');
      
      console.log('Menukarkan kode otorisasi dengan token...');
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n================================= HASIL TOKEN =================================');
      console.log('Salin token di bawah ini dan tambahkan ke file .env.local Anda:');
      console.log('==============================================================================');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('==============================================================================\n');
      
      server.close(() => {
        console.log('Server dihentikan. Proses selesai.');
        process.exit(0);
      });
    } else {
      res.end('Menunggu respon otorisasi Google...');
    }
  } catch (e) {
    console.error('Terjadi kesalahan saat memproses callback:', e);
    res.end('Terjadi error saat memproses otorisasi.');
  }
});

server.listen(PORT, () => {
  console.log(`Server lokal berjalan di http://localhost:${PORT}...`);
  console.log('Menunggu otorisasi di browser Anda...');
});

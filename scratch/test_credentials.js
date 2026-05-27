const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

console.log('--- TESTING CREDENTIALS ---');
console.log('Client ID:     ', JSON.stringify(clientId));
console.log('Client Secret: ', JSON.stringify(clientSecret));
console.log('Refresh Token: ', JSON.stringify(refreshToken));

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'http://localhost:8080/oauth2callback'
);

oauth2Client.setCredentials({
  refresh_token: refreshToken
});

async function run() {
  try {
    console.log('\nRequesting access token from Google...');
    const tokenResponse = await oauth2Client.getAccessToken();
    console.log('\n✅ SUCCESS! Access Token retrieved successfully:', tokenResponse.token.substring(0, 15) + '...');
  } catch (error) {
    console.log('\n❌ FAILED!');
    if (error.response && error.response.data) {
      console.log('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

run();

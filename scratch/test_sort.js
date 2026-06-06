const { fetchJobs } = require('../src/lib/googleSheets');
require('dotenv').config({ path: '../.env.local' });

async function main() {
  try {
    const jobs = await fetchJobs();
    console.log('Total jobs fetched:', jobs.length);
    if (jobs.length > 0) {
      console.log('Sample job keys:', Object.keys(jobs[0]));
      console.log('Sample job company names:', jobs.slice(0, 10).map(j => ({
        company: j.company,
        rownum: j.rownum,
        startdate: j.startdate
      })));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

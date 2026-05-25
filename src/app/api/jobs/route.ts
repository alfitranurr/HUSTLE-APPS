import { NextRequest, NextResponse } from 'next/server';
import {
  fetchJobs,
  saveJob,
  uploadFileToDrive,
  deleteFileFromDrive,
  Job,
} from '@/lib/googleSheets';

// GET: Fetch all jobs and calculate summary statistics
export async function GET() {
  try {
    const jobs = await fetchJobs();

    const stats = {
      total: jobs.length,
      notstarted: 0,
      progress: 0,
      success: 0,
      failed: 0,
    };

    jobs.forEach((item) => {
      const s = String(item.status || '').toLowerCase();
      if (s.includes('not started')) {
        stats.notstarted++;
      } else if (s.includes('in progress') || s === 'progress') {
        stats.progress++;
      } else if (s.includes('success') || s === 'done') {
        stats.success++;
      } else if (s.includes('failed')) {
        stats.failed++;
      }
    });

    return NextResponse.json({ success: true, data: jobs, stats });
  } catch (error: any) {
    console.error('API GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Save or Update a job (handles files as multipart/form-data)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const rowNum = formData.get('rowNum') as string | null;
    const id = formData.get('id') as string | null;
    const company = formData.get('company') as string;
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;
    const status = formData.get('status') as string;
    const linkIg = formData.get('linkIg') as string | null;
    const linkLi = formData.get('linkLi') as string | null;
    const linkWeb = formData.get('linkWeb') as string | null;
    const kategori = formData.get('kategori') as string | null;
    const note = formData.get('note') as string | null;
    const existingUrl = formData.get('existingUrl') as string | null;
    const buktiFile = formData.get('buktiFile') as File | null;

    if (!company || !status) {
      return NextResponse.json(
        { success: false, error: 'Company and Status are required fields' },
        { status: 400 }
      );
    }

    let fileUrl = existingUrl || 'No File';

    // If a file is uploaded, send it to Google Drive
    if (buktiFile && buktiFile.name && buktiFile.size > 0) {
      try {
        const arrayBuffer = await buktiFile.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Upload file to Google Drive
        fileUrl = await uploadFileToDrive(fileBuffer, buktiFile.name, buktiFile.type);

        // If there was an old file in Drive, send it to the trash
        if (existingUrl && existingUrl.includes('drive.google.com')) {
          await deleteFileFromDrive(existingUrl);
        }
      } catch (uploadError: any) {
        console.error('File upload failed:', uploadError);
        return NextResponse.json(
          { success: false, error: `File upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    // Save record to Google Sheets
    const result = await saveJob({
      id: id || undefined,
      rowNum: rowNum || undefined,
      company,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
      linkIg: linkIg || undefined,
      linkLi: linkLi || undefined,
      linkWeb: linkWeb || undefined,
      kategori: kategori || undefined,
      note: note || undefined,
      buktiurl: fileUrl,
    });

    return NextResponse.json({ success: true, message: result, fileUrl });
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

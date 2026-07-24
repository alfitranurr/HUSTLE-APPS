import { NextRequest, NextResponse } from 'next/server';
import {
  fetchJobs,
  saveJob,
  uploadFileToDrive,
  deleteFileFromDrive,
} from '@/lib/googleSheets';
import { getProofUrls } from '@/lib/utils';

// GET: Fetch all jobs and calculate summary statistics
export async function GET() {
  try {
    const jobs = await fetchJobs();

    const stats = {
      total: jobs.length,
      notstarted: 0,
      progress: 0,
      psikotes: 0,
      interview: 0,
      success: 0,
      failed: 0,
    };

    jobs.forEach((item) => {
      const s = String(item.status || '').toLowerCase();
      if (s.includes('not started')) {
        stats.notstarted++;
      } else if (s.includes('psikotes')) {
        stats.psikotes++;
      } else if (s.includes('interview')) {
        stats.interview++;
      } else if (s.includes('in progress') || s === 'progress') {
        stats.progress++;
      } else if (s.includes('success') || s === 'done') {
        stats.success++;
      } else if (s.includes('failed')) {
        stats.failed++;
      }
    });

    return NextResponse.json({ success: true, data: jobs, stats });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API GET Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
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
    const startDate = formData.get('startDate') as string | null; // Used for Application Date
    const endDate = formData.get('endDate') as string | null; // Interview Date (optional)
    const status = formData.get('status') as string; // App Status
    const linkIg = formData.get('linkIg') as string | null;
    const linkLi = formData.get('linkLi') as string | null;
    const linkWeb = formData.get('linkWeb') as string | null;
    const linkOther = formData.get('linkOther') as string | null;
    const kategori = formData.get('kategori') as string | null; // Position
    const note = formData.get('note') as string | null;
    const existingUrl = formData.get('existingUrl') as string | null;
    
    // New Fields
    const platform = formData.get('platform') as string | null;
    const careerLevel = formData.get('careerLevel') as string | null;
    const currentStage = formData.get('currentStage') as string | null;
    const province = formData.get('province') as string | null;
    const city = formData.get('city') as string | null;

    if (!company || !status || !platform || !currentStage || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Company, App Status, Platform, Current Stage, and Application Date are required fields' },
        { status: 400 }
      );
    }

    // Extract existing preserved URLs
    const preservedUrls = getProofUrls(existingUrl || undefined);

    // Get all uploaded file objects (supporting both 'buktiFiles' and 'buktiFile')
    const rawFiles = [
      ...(formData.getAll('buktiFiles') as File[]),
      ...(formData.getAll('buktiFile') as File[])
    ];
    
    // Deduplicate files by reference/name
    const uploadedFiles: File[] = [];
    const seenFileKeys = new Set<string>();
    for (const f of rawFiles) {
      if (f && f.name && f.size > 0) {
        const key = `${f.name}_${f.size}`;
        if (!seenFileKeys.has(key)) {
          seenFileKeys.add(key);
          uploadedFiles.push(f);
        }
      }
    }

    const newlyUploadedUrls: string[] = [];
    for (const file of uploadedFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const uploadedUrl = await uploadFileToDrive(fileBuffer, file.name, file.type);
        newlyUploadedUrls.push(uploadedUrl);
      } catch (uploadError: unknown) {
        const err = uploadError as Error;
        console.error('File upload failed:', err);
        return NextResponse.json(
          { success: false, error: `File upload failed for ${file.name}: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // Cleanup old files that were removed in edit form
    const parsedRowNum = rowNum ? Number(rowNum) : null;
    if (parsedRowNum) {
      try {
        const jobs = await fetchJobs();
        const currentJob = jobs.find(j => j.rownum === parsedRowNum);
        if (currentJob && currentJob.buktiurl) {
          const oldUrls = getProofUrls(currentJob.buktiurl);
          for (const oldUrl of oldUrls) {
            if (oldUrl.includes('drive.google.com') && !preservedUrls.includes(oldUrl)) {
              await deleteFileFromDrive(oldUrl);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to cleanup old drive files:', err);
      }
    }

    const allUrls = [...preservedUrls, ...newlyUploadedUrls];
    const fileUrl = allUrls.length > 0 ? allUrls.join(', ') : 'No File';

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
      linkOther: linkOther || undefined,
      kategori: kategori || undefined,
      note: note || undefined,
      buktiurl: fileUrl,
      platform: platform || undefined,
      careerLevel: careerLevel || undefined,
      currentStage: currentStage || undefined,
      province: province || undefined,
      city: city || undefined,
    });

    return NextResponse.json({ success: true, message: result, fileUrl });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API POST Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

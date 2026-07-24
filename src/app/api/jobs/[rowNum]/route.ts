import { NextRequest, NextResponse } from 'next/server';
import {
  fetchJobs,
  deleteJob,
  deleteFileFromDrive,
} from '@/lib/googleSheets';
import { getProofUrls } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    rowNum: string;
  }>;
}

// DELETE: Delete a job by row number (also deletes its Drive file if exists)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { rowNum } = await params;
    const parsedRowNum = Number(rowNum);

    if (isNaN(parsedRowNum) || parsedRowNum < 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid row number provided' },
        { status: 400 }
      );
    }

    // 1. Fetch current jobs to see if this row has active file attachments
    const jobs = await fetchJobs();
    const targetJob = jobs.find(job => job.rownum === parsedRowNum);

    if (targetJob && targetJob.buktiurl) {
      const urls = getProofUrls(targetJob.buktiurl);
      // 2. If it has files in Drive, trash them
      for (const url of urls) {
        if (url.includes('drive.google.com')) {
          await deleteFileFromDrive(url);
        }
      }
    }

    // 3. Delete the row from the Google Sheet
    const result = await deleteJob(parsedRowNum);

    return NextResponse.json({ success: true, message: result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API DELETE Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

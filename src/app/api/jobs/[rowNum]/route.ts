import { NextRequest, NextResponse } from 'next/server';
import {
  fetchJobs,
  deleteJob,
  deleteFileFromDrive,
} from '@/lib/googleSheets';

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

    // 1. Fetch current jobs to see if this row has an active file attachment
    const jobs = await fetchJobs();
    const targetJob = jobs.find(job => job.rownum === parsedRowNum);

    if (targetJob) {
      const fileUrl = targetJob.buktiurl;
      // 2. If it has a file in Drive, trash it
      if (fileUrl && fileUrl.includes('drive.google.com')) {
        await deleteFileFromDrive(fileUrl);
      }
    }

    // 3. Delete the row from the Google Sheet
    const result = await deleteJob(parsedRowNum);

    return NextResponse.json({ success: true, message: result });
  } catch (error: any) {
    console.error('API DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

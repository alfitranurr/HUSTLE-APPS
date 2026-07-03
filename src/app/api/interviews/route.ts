/* cspell:disable */
import { NextResponse } from 'next/server';
import {
  fetchInterviewQuestions,
  addInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion,
} from '@/lib/googleSheets';

export async function GET() {
  try {
    const questions = await fetchInterviewQuestions();
    return NextResponse.json({ success: true, data: questions });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/interviews GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch interview questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.question || !body.question.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question text is required' },
        { status: 400 }
      );
    }

    const created = await addInterviewQuestion({
      category: body.category || 'Behavioral',
      question: body.question,
      situation: body.situation || '',
      task: body.task || '',
      action: body.action || '',
      result: body.result || '',
      targetcompany: body.targetcompany || '',
      difficulty: body.difficulty || 'Medium',
      status: body.status || 'Practice Needed',
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/interviews POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to add interview question' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Missing interview question ID' },
        { status: 400 }
      );
    }

    await updateInterviewQuestion(body.id, body);
    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/interviews PUT error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update interview question' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing interview question ID' },
        { status: 400 }
      );
    }

    await deleteInterviewQuestion(id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/interviews DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete interview question' },
      { status: 500 }
    );
  }
}

/* cspell:disable */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, situation, task, action, result } = body;

    if (!question || (!answer && !action)) {
      return NextResponse.json(
        { success: false, error: 'Question and answer details are required for AI Grill analysis' },
        { status: 400 }
      );
    }

    const fullAnswer = answer || `Situation: ${situation || '-'}. Task: ${task || '-'}. Action: ${action || '-'}. Result: ${result || '-'}`;
    const wordCount = fullAnswer.split(/\s+/).filter(Boolean).length;

    // Evaluate answer metrics & STAR coverage
    let score = 70;
    const suggestions: string[] = [];

    const hasSituation = Boolean(situation || fullAnswer.toLowerCase().includes('saat') || fullAnswer.toLowerCase().includes('ketika') || fullAnswer.toLowerCase().includes('project'));
    const hasTask = Boolean(task || fullAnswer.toLowerCase().includes('tanggung jawab') || fullAnswer.toLowerCase().includes('tugas') || fullAnswer.toLowerCase().includes('peran'));
    const hasAction = Boolean(action || fullAnswer.toLowerCase().includes('saya') || fullAnswer.toLowerCase().includes('melakukan') || fullAnswer.toLowerCase().includes('mengembangkan'));
    const hasResult = Boolean(result || fullAnswer.toLowerCase().includes('%') || fullAnswer.toLowerCase().includes('berhasil') || fullAnswer.toLowerCase().includes('dampak'));

    if (hasSituation) score += 7;
    else suggestions.push('Tambahkan latar belakang konteks (Situation) yang spesifik untuk memperjelas skala permasalahan.');

    if (hasTask) score += 7;
    else suggestions.push('Jelaskan secara eksplisit apa target atau tantangan utama (Task) yang menjadi tanggung jawab Anda.');

    if (hasAction) score += 10;
    else suggestions.push('Perjelas tindakan konkret individu Anda (Action) menggunakan kata kerja aktif ("Saya mengembangkan...", "Saya memimpin...").');

    if (hasResult) score += 6;
    else suggestions.push('Sertakan angka metrik kuantitatif atau dampak terukur (Result) dari hasil kerja Anda.');

    if (wordCount < 30) {
      score = Math.max(score - 15, 45);
      suggestions.push('Jawaban Anda terlalu singkat. Uraikan minimal 2-3 kalimat penjelasan detail di bagian Action & Result.');
    } else if (wordCount > 150) {
      score = Math.min(score, 92);
    }

    score = Math.min(Math.max(score, 50), 98);

    const feedback = {
      score,
      overallFeedback: score >= 85 
        ? 'Jawaban wawancara Anda sangat solid, berbobot, dan terstruktur rapi sesuai metode STAR!'
        : score >= 70
        ? 'Jawaban Anda sudah cukup baik, namun dapat ditingkatkan dengan menambahkan angka kuantitatif pada bagian Result.'
        : 'Jawaban Anda perlu diperdalam. Lengkapi setiap poin Situation, Task, Action, dan Result agar pewawancara terkesan.',
      starAnalysis: {
        situationFeedback: hasSituation 
          ? 'Konteks situasi telah tersampaikan dengan baik.'
          : 'Latar belakang proyek/masalah kurang jelas.',
        taskFeedback: hasTask
          ? 'Tanggung jawab & tantangan sudah terdefinisi.'
          : 'Belum memperlihatkan peran spesifik Anda dalam tim.',
        actionFeedback: hasAction
          ? 'Tindakan eksekusi teknis Anda tersampaikan dengan konkret.'
          : 'Tindakan pribadi perlu dijabarkan lebih teknis.',
        resultFeedback: hasResult
          ? 'Dampak & hasil akhir sudah terukur.'
          : 'Belum ada angka keberhasilan / metrik kuantitatif.',
      },
      suggestions: suggestions.length > 0 ? suggestions : ['Pertahankan struktur jawaban ini saat sesi wawancara langsung!'],
    };

    return NextResponse.json({ success: true, data: feedback });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API /api/interviews/grill error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process AI Grill analysis' },
      { status: 500 }
    );
  }
}

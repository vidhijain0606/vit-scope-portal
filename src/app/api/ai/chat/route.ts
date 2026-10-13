import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { azureChat } from '@/lib/azureAi';

const SYSTEM_PROMPT = `You are the assistant for the VIT SCOPE Research Portal, a DAC/synopsis/colloquium/oral-exam/comprehensive-viva scheduling tool for VIT faculty.
Help users understand how to book slots, find their bookings, upload/view documents, and explain meeting-type time rules:
- DC MEETING / COMPREHENSIVE VIVA: 10:00, 11:00, 11:30, 12:00, 15:00, 15:30, 16:00 (1 hour each, 1 hour gap between consecutive DC meetings)
- COLLOQUIUM: 11:00, 11:30, 15:00, 15:30 (30 min each)
- SYNOPSIS MEETING / ORAL EXAM: 10:00, 11:30, 14:30, 16:00 (1.5 hours each)
Keep answers brief and specific to this portal. If asked something unrelated, politely redirect to portal topics.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const reply = await azureChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI chat failed', err);
    return NextResponse.json(
      { error: 'AI assistant is not available right now.' },
      { status: 503 }
    );
  }
}

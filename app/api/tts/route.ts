import { NextResponse } from 'next/server';
import { GOOGLE_TTS_CONFIG } from '@/config/constants';
import { getAccessToken } from '@/lib/google-auth';

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
    }

    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(GOOGLE_TTS_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        input: { text: text.trim() },
        voice: GOOGLE_TTS_CONFIG.VOICE,
        audioConfig: GOOGLE_TTS_CONFIG.AUDIO_CONFIG,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      console.error('Google TTS error:', response.status, errorBody);
      return NextResponse.json({ error: 'TTS failed' }, { status: 502 });
    }

    const data = await response.json();

    // Return base64 audio
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

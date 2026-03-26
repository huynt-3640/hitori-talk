import { NextResponse } from 'next/server';
import { GOOGLE_STT_CONFIG } from '@/config/constants';
import { getAccessToken } from '@/lib/google-auth';

interface RecognitionResult {
  alternatives?: { transcript: string; confidence: number }[];
}

interface RecognizeResponse {
  results?: RecognitionResult[];
}

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return NextResponse.json({ error: 'STT not configured' }, { status: 503 });
    }

    const { audio } = await request.json();
    if (!audio) {
      return NextResponse.json({ error: 'Audio is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(GOOGLE_STT_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        config: {
          encoding: GOOGLE_STT_CONFIG.ENCODING,
          sampleRateHertz: GOOGLE_STT_CONFIG.SAMPLE_RATE,
          languageCode: GOOGLE_STT_CONFIG.LANGUAGE_CODE,
        },
        audio: { content: audio },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      console.error('Google STT error:', response.status, errorBody);
      return NextResponse.json({ error: 'STT failed' }, { status: 502 });
    }

    const data = (await response.json()) as RecognizeResponse;

    const text = data.results
      ?.map((r) => r.alternatives?.[0]?.transcript ?? '')
      .join('')
      ?? '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('STT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

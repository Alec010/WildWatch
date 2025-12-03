import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/config';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Use the same backend URL configuration as the rest of the app
    // This defaults to the deployed backend unless NEXT_PUBLIC_USE_LOCAL_BACKEND=true
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/chatbot`;
    console.log('Calling backend API:', apiUrl);

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!aiRes.ok) {
      console.error('Backend API error:', aiRes.status, aiRes.statusText);
      const errorText = await aiRes.text();
      console.error('Error response:', errorText);
      
      return NextResponse.json(
        { error: 'AI service error', details: errorText },
        { status: aiRes.status }
      );
    }

    const aiData = await aiRes.json();
    if (!aiData.reply) {
      console.error('Invalid response from backend:', aiData);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: aiData.reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
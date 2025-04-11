import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    // Get the token from either the Authorization header or cookie
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader?.split(';')
      .find((c: string) => c.trim().startsWith('token='))
      ?.split('=')[1];

    console.log('Cookie header present:', !!cookieHeader); // Debug log
    console.log('Token extracted from cookie:', !!token); // Debug log

    if (!token) {
      console.log('No token found in cookies'); // Debug log
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const incidentData = JSON.parse(formData.get('incidentData') as string);
    const witnesses = JSON.parse(formData.get('witnesses') as string);
    const files = formData.getAll('files');

    // Debug log
    console.log('Received data:', {
      hasIncidentData: !!incidentData,
      witnessCount: witnesses?.length || 0,
      fileCount: files.length
    });

    // Create a new FormData instance for the backend request
    const backendFormData = new FormData();
    backendFormData.append('incidentData', JSON.stringify({
      ...incidentData,
      witnesses: witnesses
    }));

    // Append each file
    files.forEach((file) => {
      backendFormData.append('files', file);
    });

    try {
      console.log('Sending request to:', `${BACKEND_URL}/api/incidents`); // Debug log
      console.log('Using token:', token.substring(0, 10) + '...'); // Debug log (only show first 10 chars)

      // Forward the request to the backend
      const response = await fetch(`${BACKEND_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000'
        },
        body: backendFormData
      });

      console.log('Backend response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Backend request failed' }));
        console.log('Backend error:', errorData); // Debug log
        return NextResponse.json(
          { error: errorData.message || 'Backend request failed' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error connecting to backend:', fetchError);
      return NextResponse.json(
        { error: 'Could not connect to the server. Please try again later.' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error in incident submission:', error);
    return NextResponse.json(
      { error: 'Failed to process the incident submission' },
      { status: 500 }
    );
  }
} 
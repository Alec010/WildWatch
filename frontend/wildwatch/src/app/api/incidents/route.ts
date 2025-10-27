import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from "@/utils/api";

// Define witness interface to fix TypeScript error
interface Witness {
  userId?: string | number;
  name?: string;
  additionalNotes?: string;
  contactInformation?: string;
}

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
    const files = formData.getAll('files');

    // Debug log
    console.log('Received data:', {
      hasIncidentData: !!incidentData,
      witnessCount: incidentData.witnesses?.length || 0,
      fileCount: files.length
    });

    // Create a new FormData instance for the backend request
    const backendFormData = new FormData();
    backendFormData.append('incidentData', JSON.stringify(incidentData));

    // Append each file
    files.forEach((file) => {
      backendFormData.append('files', file);
    });

    try {
      console.log('Sending request to:', `${API_BASE_URL}/api/incidents`); // Debug log
      console.log('Using token:', token.substring(0, 10) + '...'); // Debug log (only show first 10 chars)
      
      // Log the incident data for debugging
      const incidentData = JSON.parse(formData.get('incidentData') as string);
      console.log('Incident data:', {
        type: incidentData.incidentType,
        witnesses: incidentData.witnesses?.length || 0,
        files: files.length
      });
      
      // Log witness details for verification
      if (incidentData.witnesses && incidentData.witnesses.length > 0) {
        console.log('Witness details in API route:', 
          incidentData.witnesses.map((w: Witness) => ({
            hasUserId: !!w.userId,
            userId: w.userId,
            name: w.name,
            notes: w.additionalNotes?.substring(0, 20)
          }))
        );
      }

      // Forward the request to the backend
      const apiUrl = `${API_BASE_URL}/api/incidents`;
      console.log('Using backend URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
        },
        body: backendFormData
      });

      console.log('Backend response status:', response.status); // Debug log

      if (!response.ok) {
        // Try to get detailed error information
        let errorText;
        try {
          const errorData = await response.json();
          console.log('Backend error response:', errorData);
          errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          try {
            errorText = await response.text();
            console.log('Backend error text:', errorText);
          } catch (e2) {
            errorText = 'Backend request failed';
          }
        }
        
        return NextResponse.json(
          { error: errorText || 'Backend request failed' },
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
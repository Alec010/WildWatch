// Simple API test script for debugging
// Run this with: node debug_api_test.js

const axios = require('axios');

const API_BASE_URL = 'http://192.168.1.2:8080/api'; // Update this to your backend URL

async function testAnalyzeEndpoint() {
  try {
    console.log('Testing AI Analysis endpoint...');
    console.log('API Base URL:', API_BASE_URL);
    
    const testRequest = {
      incidentType: 'Test Incident',
      description: 'This is a test description for AI analysis',
      location: 'Test Location',
      formattedAddress: '123 Test Street',
      buildingName: 'Test Building',
      buildingCode: 'TB001',
      latitude: 10.2955,
      longitude: 123.8800
    };

    console.log('Sending request:', testRequest);

    const response = await axios.post(`${API_BASE_URL}/incidents/analyze`, testRequest, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code
    });
  }
}

testAnalyzeEndpoint();

const axios = require('axios');

async function debugAuth() {
  try {
    console.log('Testing login...');

    const loginResponse = await axios.post(
      'http://localhost:3000/api/v1/auth/login',
      {
        email: 'john.reviewer@test.com',
        password: 'Password123!',
      }
    );

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error(
        'Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

debugAuth();

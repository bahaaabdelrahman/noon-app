const axios = require('axios');

async function testReviewEndpoint() {
  try {
    console.log('Testing review endpoint...');

    const response = await axios.get(
      'http://localhost:3000/api/v1/products/6856900de8d08870077cccce/reviews',
      {
        timeout: 5000,
      }
    );

    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testReviewEndpoint();

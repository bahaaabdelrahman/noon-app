const axios = require('axios');

async function testReviewFlow() {
  try {
    console.log('1. Logging in with existing user...');

    // Login with existing user
    const loginResponse = await axios.post(
      'http://localhost:3000/api/v1/auth/login',
      {
        email: 'john.reviewer@test.com',
        password: 'Password123!',
      }
    );

    console.log('User logged in:', loginResponse.data.success);
    const token = loginResponse.data.data.tokens.accessToken;

    console.log('2. Creating a review...');

    // Create a review
    const reviewResponse = await axios.post(
      'http://localhost:3000/api/v1/products/6856900de8d08870077cccce/reviews',
      {
        rating: 5,
        title: 'Great product!',
        comment:
          'I really love this t-shirt. The quality is excellent and it fits perfectly.',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Review created:', reviewResponse.data);

    console.log('3. Getting reviews for the product...');

    // Get reviews
    const getReviewsResponse = await axios.get(
      'http://localhost:3000/api/v1/products/6856900de8d08870077cccce/reviews'
    );

    console.log(
      'Reviews retrieved:',
      JSON.stringify(getReviewsResponse.data, null, 2)
    );
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testReviewFlow();

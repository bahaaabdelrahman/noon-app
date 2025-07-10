const axios = require('axios');

async function testWishlistFlow() {
  try {
    console.log('1. Logging in...');

    // Login
    const loginResponse = await axios.post(
      'http://localhost:3000/api/v1/auth/login',
      {
        email: 'john.reviewer@test.com',
        password: 'Password123!',
      }
    );

    const token = loginResponse.data.data.tokens.accessToken;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    console.log('2. Getting user wishlists...');

    // Get user's wishlists
    const wishlistsResponse = await axios.get(
      'http://localhost:3000/api/v1/wishlists',
      { headers }
    );

    console.log('Wishlists:', JSON.stringify(wishlistsResponse.data, null, 2));

    console.log('3. Adding product to default wishlist...');

    // Add product to default wishlist
    const addToWishlistResponse = await axios.post(
      'http://localhost:3000/api/v1/wishlists/default/products/6856900de8d08870077cccce',
      {
        notes: 'Want this for summer!',
        priority: 'high',
      },
      { headers }
    );

    console.log(
      'Added to wishlist:',
      JSON.stringify(addToWishlistResponse.data, null, 2)
    );

    console.log('4. Getting updated wishlists...');

    // Get updated wishlists with items
    const updatedWishlistsResponse = await axios.get(
      'http://localhost:3000/api/v1/wishlists?includeItems=true',
      { headers }
    );

    console.log(
      'Updated wishlists:',
      JSON.stringify(updatedWishlistsResponse.data, null, 2)
    );
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error(
        'Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testWishlistFlow();

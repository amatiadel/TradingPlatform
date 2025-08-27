const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function simpleTest() {
  console.log('🧪 Simple Withdrawal Test...\n');

  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Health endpoint working:', healthResponse.data.status);

    // Test login with admin
    console.log('\n2. Testing login with admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { timeout: 5000 });

    console.log('✅ Login successful');
    const token = loginResponse.data.token;

    // Test withdrawal request creation
    console.log('\n3. Testing withdrawal request creation...');
    const withdrawalRequest = {
      amount: 10,
      paymentMethod: 'USDT',
      purse: 'test123',
      network: 'TRC-20'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/user/withdrawal-request`, withdrawalRequest, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ Withdrawal request created:', createResponse.data.id);

    console.log('\n🎉 Simple test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

simpleTest();

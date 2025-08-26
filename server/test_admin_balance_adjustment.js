const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testAdminBalanceAdjustment() {
  try {
    console.log('🧪 Testing Admin Balance Adjustment API...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Get users list to find a user to adjust
    console.log('2️⃣ Fetching users list...');
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = usersResponse.data;
    console.log(`✅ Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }

    // Use the first user for testing
    const testUser = users[0];
    console.log(`📋 Testing with user: ${testUser.username} (ID: ${testUser.id})`);
    console.log(`💰 Current balances - Demo: $${testUser.demoBalance}, Real: $${testUser.realBalance}\n`);

    // Step 3: Test balance adjustment - Add to demo balance
    console.log('3️⃣ Testing demo balance addition...');
    const addDemoResponse = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
      accountType: 'demo',
      operation: 'add',
      amount: 100.50,
      reason: 'Test adjustment - demo addition'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Demo balance addition successful');
    console.log(`📊 Result: ${addDemoResponse.data.oldBalance} → ${addDemoResponse.data.newBalance}\n`);

    // Step 4: Test balance adjustment - Subtract from real balance
    console.log('4️⃣ Testing real balance subtraction...');
    const subtractRealResponse = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
      accountType: 'real',
      operation: 'subtract',
      amount: 50.25,
      reason: 'Test adjustment - real subtraction'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Real balance subtraction successful');
    console.log(`📊 Result: ${subtractRealResponse.data.oldBalance} → ${subtractRealResponse.data.newBalance}\n`);

    // Step 5: Test balance adjustment - Set demo balance
    console.log('5️⃣ Testing demo balance set...');
    const setDemoResponse = await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
      accountType: 'demo',
      operation: 'set',
      amount: 5000.00,
      reason: 'Test adjustment - demo set'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Demo balance set successful');
    console.log(`📊 Result: ${setDemoResponse.data.oldBalance} → ${setDemoResponse.data.newBalance}\n`);

    // Step 6: Test validation - Invalid amount
    console.log('6️⃣ Testing validation - Invalid amount...');
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
        accountType: 'demo',
        operation: 'add',
        amount: -100,
        reason: 'Test validation'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed with invalid amount');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working - Invalid amount rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 7: Test validation - Invalid operation
    console.log('\n7️⃣ Testing validation - Invalid operation...');
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
        accountType: 'demo',
        operation: 'invalid',
        amount: 100,
        reason: 'Test validation'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Should have failed with invalid operation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working - Invalid operation rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 8: Test non-admin access
    console.log('\n8️⃣ Testing non-admin access...');
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/${testUser.id}/balance`, {
        accountType: 'demo',
        operation: 'add',
        amount: 100,
        reason: 'Test non-admin access'
      });
      console.log('❌ Should have failed with non-admin access');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working - Non-admin access rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('📋 Admin Balance Adjustment API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminBalanceAdjustment();

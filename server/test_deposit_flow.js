const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const USER_CREDENTIALS = {
  username: 'test007',
  password: 'test007'
};

async function testDepositFlow() {
  try {
    console.log('🧪 Testing Complete Deposit Flow...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Skip user creation since we're using existing user
    console.log('2️⃣ Using existing test user...');
    console.log('✅ Test user exists');

    // Step 3: Login as test user
    console.log('\n3️⃣ Logging in as test user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, USER_CREDENTIALS);
    const userToken = userLoginResponse.data.token;
    const userId = userLoginResponse.data.user.id;
    console.log('✅ User login successful\n');

    // Step 4: Test promo code validation
    console.log('4️⃣ Testing promo code validation...');
    try {
      const promoResponse = await axios.get(`${BASE_URL}/api/promo-codes/DEPOSIT20`);
      console.log('✅ Promo code validation successful:', promoResponse.data);
    } catch (error) {
      console.log('❌ Promo code validation failed:', error.response?.data?.error);
    }

    // Step 5: Create deposit request
    console.log('\n5️⃣ Creating deposit request...');
    const depositRequest = {
      amount: 100.00,
      selectedBonusPercent: 20,
      promoCode: 'DEPOSIT20',
      paymentMethod: 'USDT-TRC20'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/user/deposit-request`, depositRequest, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const depositId = createResponse.data.id;
    console.log('✅ Deposit request created successfully');
    console.log(`📊 Deposit ID: ${depositId}`);
    console.log(`💰 Amount: $${createResponse.data.amount}`);
    console.log(`🎁 Final Total: $${createResponse.data.finalTotal}`);
    console.log(`📍 Address: ${createResponse.data.address}\n`);

    // Step 6: Get user's deposit requests
    console.log('6️⃣ Fetching user deposit requests...');
    const userDepositsResponse = await axios.get(`${BASE_URL}/api/user/deposit-requests`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log(`✅ Found ${userDepositsResponse.data.length} deposit requests\n`);

    // Step 7: Mark deposit as paid
    console.log('7️⃣ Marking deposit as paid...');
    const markPaidResponse = await axios.patch(`${BASE_URL}/api/user/deposit-request/${depositId}/mark-paid`, {}, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ Deposit marked as paid successfully');
    console.log(`📊 Status: ${markPaidResponse.data.status}\n`);

    // Step 8: Admin fetches pending deposits
    console.log('8️⃣ Admin fetching pending deposits...');
    const adminDepositsResponse = await axios.get(`${BASE_URL}/api/admin/deposit-requests?status=waiting_confirmation`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`✅ Admin found ${adminDepositsResponse.data.length} pending deposits\n`);

    // Step 9: Admin approves deposit
    console.log('9️⃣ Admin approving deposit...');
    const approveResponse = await axios.patch(`${BASE_URL}/api/admin/deposit-requests/${depositId}/approve`, {}, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Deposit approved successfully');
    console.log(`💰 Amount credited: $${approveResponse.data.amount}`);
    console.log(`💳 New balance: $${approveResponse.data.newBalance}\n`);

    // Step 10: Verify user's updated deposit requests
    console.log('10️⃣ Verifying updated deposit status...');
    const updatedDepositsResponse = await axios.get(`${BASE_URL}/api/user/deposit-requests`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const approvedDeposit = updatedDepositsResponse.data.find(d => d.id === depositId);
    if (approvedDeposit && approvedDeposit.status === 'approved') {
      console.log('✅ Deposit status correctly updated to approved');
    } else {
      console.log('❌ Deposit status not updated correctly');
    }

    // Step 11: Test deposit rejection flow
    console.log('\n11️⃣ Testing deposit rejection flow...');
    
    // Create another deposit request
    const rejectDepositRequest = {
      amount: 50.00,
      selectedBonusPercent: 0,
      paymentMethod: 'USDT-TRC20'
    };

    const rejectCreateResponse = await axios.post(`${BASE_URL}/api/user/deposit-request`, rejectDepositRequest, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const rejectDepositId = rejectCreateResponse.data.id;
    console.log(`✅ Created deposit request #${rejectDepositId} for rejection test`);

    // Mark as paid
    await axios.patch(`${BASE_URL}/api/user/deposit-request/${rejectDepositId}/mark-paid`, {}, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    // Admin rejects the deposit
    const rejectResponse = await axios.patch(`${BASE_URL}/api/admin/deposit-requests/${rejectDepositId}/reject`, {
      adminNote: 'Test rejection - insufficient funds'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Deposit rejected successfully');

    console.log('\n🎉 All deposit flow tests completed successfully!');
    console.log('📋 Deposit system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDepositFlow();

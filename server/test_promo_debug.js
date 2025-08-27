const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testPromoCodeDebug() {
  console.log('🔍 Testing Promo Code Debug...\n');

  try {
    // 1. Test promo code validation
    console.log('1️⃣ Testing promo code validation...');
    const promoResponse = await axios.get(`${BASE_URL}/api/promo-codes/DEPOSIT70`);
    console.log('✅ Promo code validation response:', promoResponse.data);

    // 2. Login as test user
    console.log('\n2️⃣ Logging in as test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'testpass'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 3. Create deposit with promo code
    console.log('\n3️⃣ Creating deposit with promo code...');
    const depositData = {
      amount: 100,
      selectedBonusPercent: 0,
      promoCode: 'DEPOSIT70',
      paymentMethod: 'USDT-TRC20'
    };

    const depositResponse = await axios.post(`${BASE_URL}/api/user/deposit-request`, depositData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Deposit created successfully');
    console.log('📊 Deposit response:', depositResponse.data);

    // 4. Check the created deposit in database
    console.log('\n4️⃣ Checking database for created deposit...');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('data.db');
    
    db.get("SELECT * FROM deposit_requests WHERE id = ?", [depositResponse.data.id], (err, row) => {
      if (err) {
        console.error('❌ Database error:', err);
      } else {
        console.log('📊 Database record:', {
          id: row.id,
          amount: row.amount,
          bonusAmount: row.bonusAmount,
          finalTotal: row.finalTotal,
          promoCode: row.promoCode,
          promoBonusPercent: row.promoBonusPercent,
          totalBonusPercent: row.totalBonusPercent
        });
      }
      db.close();
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPromoCodeDebug();

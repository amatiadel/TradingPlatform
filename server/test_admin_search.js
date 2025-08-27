const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testAdminSearch() {
  try {
    console.log('🧪 Testing Admin Users Search API...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Test basic users fetch (no search)
    console.log('2️⃣ Testing basic users fetch...');
    const basicResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const basicData = basicResponse.data;
    console.log('Raw response:', JSON.stringify(basicData, null, 2));
    console.log(`✅ Found ${basicData.users?.length || 0} users (page ${basicData.page}/${Math.ceil(basicData.total / basicData.pageSize)})`);
    console.log(`📊 Total users: ${basicData.total}, Page size: ${basicData.pageSize}\n`);

    // Step 3: Test search by username (partial match)
    console.log('3️⃣ Testing username search...');
    if (basicData.users.length > 0) {
      const testUsername = basicData.users[0].username.substring(0, 3); // First 3 characters
      const usernameResponse = await axios.get(`${BASE_URL}/api/admin/users?search=${testUsername}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usernameData = usernameResponse.data;
      console.log(`✅ Username search for "${testUsername}" found ${usernameData.users.length} users`);
      console.log(`📊 Results: ${usernameData.users.map(u => u.username).join(', ')}\n`);
    }

    // Step 4: Test search by ID (exact match)
    console.log('4️⃣ Testing ID search...');
    if (basicData.users.length > 0) {
      const testId = basicData.users[0].id;
      const idResponse = await axios.get(`${BASE_URL}/api/admin/users?search=${testId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const idData = idResponse.data;
      console.log(`✅ ID search for "${testId}" found ${idData.users.length} users`);
      if (idData.users.length > 0) {
        console.log(`📊 Result: ${idData.users[0].username} (ID: ${idData.users[0].id})\n`);
      }
    }

    // Step 5: Test pagination
    console.log('5️⃣ Testing pagination...');
    const pageResponse = await axios.get(`${BASE_URL}/api/admin/users?page=1&pageSize=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pageData = pageResponse.data;
    console.log(`✅ Pagination test: ${pageData.users.length} users on page ${pageData.page}`);
    console.log(`📊 Page size: ${pageData.pageSize}, Total: ${pageData.total}\n`);

    // Step 6: Test sorting
    console.log('6️⃣ Testing sorting...');
    const sortResponse = await axios.get(`${BASE_URL}/api/admin/users?sort=username&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sortData = sortResponse.data;
    console.log(`✅ Sorting by username: ${sortData.users.length} users`);
    console.log(`📊 First user: ${sortData.users[0]?.username}, Last user: ${sortData.users[sortData.users.length - 1]?.username}\n`);

    // Step 7: Test search with pagination
    console.log('7️⃣ Testing search with pagination...');
    const searchPageResponse = await axios.get(`${BASE_URL}/api/admin/users?search=a&page=1&pageSize=3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchPageData = searchPageResponse.data;
    console.log(`✅ Search with pagination: ${searchPageData.users.length} users found for "a"`);
    console.log(`📊 Page ${searchPageData.page} of ${Math.ceil(searchPageData.total / searchPageData.pageSize)}\n`);

    // Step 8: Test non-existent search
    console.log('8️⃣ Testing non-existent search...');
    const noResultsResponse = await axios.get(`${BASE_URL}/api/admin/users?search=nonexistentuser12345`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const noResultsData = noResultsResponse.data;
    console.log(`✅ Non-existent search: ${noResultsData.users.length} users found`);
    console.log(`📊 Total: ${noResultsData.total}\n`);

    console.log('🎉 All search tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminSearch();

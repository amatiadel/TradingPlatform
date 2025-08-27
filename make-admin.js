const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'trading_platform.db');
const db = new sqlite3.Database(dbPath);

// Function to make a user admin
function makeUserAdmin(username) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET isAdmin = 1 WHERE username = ?",
      [username],
      function(err) {
        if (err) {
          console.error('❌ Error updating user:', err);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(`✅ Successfully made user "${username}" an admin`);
          } else {
            console.log(`❌ User "${username}" not found`);
          }
          resolve();
        }
      }
    );
  });
}

// Function to list all users
function listUsers() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, username, isAdmin FROM users", (err, rows) => {
      if (err) {
        console.error('❌ Error fetching users:', err);
        reject(err);
      } else {
        console.log('\n📋 Current users:');
        rows.forEach(user => {
          console.log(`- ${user.username} (ID: ${user.id}) - Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
        });
        resolve(rows);
      }
    });
  });
}

// Main execution
async function main() {
  const username = process.argv[2];
  
  if (!username) {
    console.log('❌ Please provide a username');
    console.log('Usage: node make-admin.js <username>');
    console.log('\nExample: node make-admin.js yourusername');
    process.exit(1);
  }

  try {
    console.log('🔍 Checking current users...');
    await listUsers();
    
    console.log(`\n🔧 Making user "${username}" an admin...`);
    await makeUserAdmin(username);
    
    console.log('\n🔍 Updated user list:');
    await listUsers();
    
    console.log('\n✅ Done! You can now log in with your username and access the admin panel.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

main();


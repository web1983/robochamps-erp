/**
 * Script to reset admin password
 * 
 * Usage:
 * 1. Set environment variables in .env.local:
 *    MONGODB_URI=your_mongodb_connection_string
 *    ADMIN_RESET_SECRET=robochamps-admin-reset-2024
 * 
 * 2. Run: node scripts/reset-admin-password.js
 * 
 * Or use the API endpoint:
 * POST /api/admin/reset-password
 * Body: {
 *   "email": "web@robowunder.com",
 *   "newPassword": "Robochamps",
 *   "secretKey": "robochamps-admin-reset-2024"
 * }
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Load .env.local without the dotenv package (KEY=value lines, # comments)
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

async function resetAdminPassword() {
  const email = 'web@robowunder.com';
  const newPassword = 'Robochamps';
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('Error: MONGODB_URI not found in environment variables');
    console.error('Please set MONGODB_URI in .env.local');
    process.exit(1);
  }

  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('robochamps_erp');
    const users = db.collection('users');

    // Find user by email
    console.log(`Looking for user with email: ${email}`);
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`Error: User with email ${email} not found`);
      console.error('Please make sure the user exists in the database');
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    // Hash new password
    console.log('Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    console.log('Updating password...');
    const result = await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      console.error('Error: Failed to update password');
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\n⚠️  Please delete this script or change the ADMIN_RESET_SECRET after use!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

resetAdminPassword();

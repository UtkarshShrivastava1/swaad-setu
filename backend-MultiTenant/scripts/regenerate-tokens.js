#!/usr/bin/env node

/**
 * Regenerate JWT tokens with new JWT_SECRET
 * Run this after updating JWT_SECRET in .env
 * Usage: node scripts/regenerate-tokens.js
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET not set in .env");
  process.exit(1);
}

console.log("🔑 Generating new test JWT tokens...\n");

// Example: Generate token for tenant 1
const token1 = jwt.sign(
  {
    rid: "bliss-bay-8665",
    userId: "admin-1",
    role: "admin",
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

// Example: Generate token for tenant 2
const token2 = jwt.sign(
  {
    rid: "dhillon-3097",
    userId: "admin-2",
    role: "admin",
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

console.log("✅ Token for Bliss Bay (bliss-bay-8665):");
console.log(`   ${token1}\n`);

console.log("✅ Token for Dhillon (dhillon-3097):");
console.log(`   ${token2}\n`);

console.log("💡 Usage in curl:");
console.log(
  `   curl -H "Authorization: Bearer ${token1}" http://localhost:5000/api/bliss-bay-8665/calls/active\n`
);

console.log("💡 Usage in browser:");
console.log(`   localStorage.setItem('token', '${token1}');\n`);

console.log("⚠️  Update your frontend .env to use new tokens!");

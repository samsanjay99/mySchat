#!/usr/bin/env node

/**
 * Generate a secure JWT secret for production use
 * 
 * Usage:
 *   node generate-jwt-secret.js
 * 
 * This will generate a cryptographically secure random string
 * suitable for use as JWT_SECRET in production.
 */

import crypto from 'crypto';

function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('\n🔐 JWT Secret Generator\n');
console.log('Generated secure JWT secret:');
console.log('─'.repeat(80));
console.log(generateJWTSecret());
console.log('─'.repeat(80));
console.log('\n📋 Copy this value and set it as JWT_SECRET in Render environment variables');
console.log('⚠️  Keep this secret secure and never commit it to version control!\n');

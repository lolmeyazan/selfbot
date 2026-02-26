#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

const isProduction = process.argv.includes('--production');
const projectName = 'selfbot';

console.log(`🚀 Deploying to Cloudflare Pages (${isProduction ? 'production' : 'preview'})...`);

try {
  // Check if dist/public exists
  if (!fs.existsSync('./dist/public')) {
    console.error('❌ dist/public not found. Run build first.');
    process.exit(1);
  }

  // Try to create project first (ignores error if already exists)
  try {
    console.log('📦 Ensuring project exists...');
    execSync(`npx wrangler pages project create ${projectName} --production-branch main 2>/dev/null || true`, {
      stdio: 'inherit'
    });
  } catch (error) {
    // Project likely exists, continue
  }

  // Deploy
  const deployCommand = `npx wrangler pages deploy dist/public --project-name=${projectName}${isProduction ? ' --branch=main' : ''}`;
  
  console.log('📤 Deploying...');
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('✅ Deployment complete!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

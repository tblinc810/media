#!/usr/bin/env node
/**
 * scripts/prepare-android.mjs
 * Builds the Next.js static export for Capacitor/Android.
 *
 * Usage:
 *   npm run android:prep    (runs this script directly)
 *   npm run android:build   (full pipeline: next build → this → cap sync)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'out');
const envFile = path.join(projectRoot, '.env.android');

// ── 1. Validate Android .env exists ──────────────────────────────────────────
if (!fs.existsSync(envFile)) {
  console.warn(
    `⚠️  No .env.android found. Creating a template at ${envFile}\n` +
    '   Edit it with your server IPs before building.\n'
  );
  fs.writeFileSync(envFile, [
    '# Android build environment — direct connections to media servers',
    '# The app will hit these IPs directly from the Android device (same LAN).',
    'NEXT_PUBLIC_SERVER_7=http://172.16.50.7',
    'NEXT_PUBLIC_SERVER_8=http://172.16.50.8',
    'NEXT_PUBLIC_SERVER_9=http://172.16.50.9',
    'NEXT_PUBLIC_SERVER_12=http://172.16.50.12',
    'NEXT_PUBLIC_SERVER_14=http://172.16.50.14',
    '',
    '# Leave empty so lib/api.js fetches directly (no proxy server on Android)',
    'NEXT_PUBLIC_PROXY_BASE=',
  ].join('\n') + '\n');
}

// ── 2. Next.js static export ─────────────────────────────────────────────────
console.log('📦 Building Next.js static export for Android…');
const env = {
  ...process.env,
  BUILD_TARGET: 'android',
  DOTENV_CONFIG_PATH: envFile,
};

execSync('next build', { stdio: 'inherit', env });

// ── 3. Ensure output directory exists ────────────────────────────────────────
if (!fs.existsSync(outDir)) {
  console.error(`❌ Static export failed — "${outDir}" not found.`);
  process.exit(1);
}

console.log(`✅ Static export complete → ${outDir}`);
console.log('');
console.log('Next step: run  npm run android:sync  then open Android Studio:');
console.log('  npx cap open android');

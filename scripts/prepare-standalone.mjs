import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('Error: .next/standalone does not exist. Run "next build" first.');
  process.exit(1);
}

// 1. Copy .next/static into .next/standalone/.next/static
const srcStatic = path.join(projectRoot, '.next', 'static');
const destStatic = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(srcStatic)) {
  if (fs.existsSync(destStatic)) {
    fs.rmSync(destStatic, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(destStatic), { recursive: true });
  fs.cpSync(srcStatic, destStatic, { recursive: true });
  console.log('Copied .next/static to .next/standalone/.next/static');
}

// 2. Copy public into .next/standalone/public
const srcPublic = path.join(projectRoot, 'public');
const destPublic = path.join(standaloneDir, 'public');
if (fs.existsSync(srcPublic)) {
  if (fs.existsSync(destPublic)) {
    fs.rmSync(destPublic, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(destPublic), { recursive: true });
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log('Copied public to .next/standalone/public');
}

console.log('Standalone preparation complete!');

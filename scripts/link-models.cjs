#!/usr/bin/env node
/**
 * Creates public/models as a symlink to models/ so models are served directly.
 * Works with EC2: mount your volume (EFS/EBS) at models/ and new files
 * appear instantly—no build needed.
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const modelsDir = path.join(__dirname, '..', 'models');
const linkPath = path.join(publicDir, 'models');

// Ensure models exists (empty dir for mount point, or with files)
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}
fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(linkPath)) {
  const stat = fs.lstatSync(linkPath);
  if (stat.isSymbolicLink()) {
    process.exit(0);
  }
  fs.rmSync(linkPath, { recursive: true });
}

fs.symlinkSync(path.relative(publicDir, modelsDir), linkPath, 'dir');
console.log('Linked public/models -> models/');

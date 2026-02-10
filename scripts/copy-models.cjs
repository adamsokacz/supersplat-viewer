#!/usr/bin/env node
/**
 * Copies models/ to public/models for deployment builds.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'models');
const dest = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(src)) {
  process.exit(0);
}

// Remove symlink or existing dir so we copy fresh
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

fs.cpSync(src, dest, { recursive: true });
console.log('Copied models/ to public/models/');

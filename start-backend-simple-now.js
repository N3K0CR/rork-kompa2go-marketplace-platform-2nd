#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const __dirname = process.cwd();

console.log('🚀 Starting Kompa2Go Backend...');
console.log('📍 Port: 8082');
console.log('📍 Host: 0.0.0.0');
console.log('📍 Directory:', __dirname);

const backendProcess = spawn('node', [
  '--loader', 'tsx',
  path.join(__dirname, 'backend', 'server.ts')
], {
  env: {
    ...process.env,
    PORT: '8082',
    HOST: '0.0.0.0',
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  stdio: 'inherit',
  shell: false
});

backendProcess.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down backend...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down backend...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

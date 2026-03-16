
const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const cmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

console.log('Starting frontend in:', frontendDir);

const child = spawn(cmd, ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
});

child.on('error', (err) => {
    console.error('Failed to start:', err);
});

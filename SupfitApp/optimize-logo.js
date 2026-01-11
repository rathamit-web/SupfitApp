const fs = require('fs');
const path = require('path');

console.log('Logo optimization script');
console.log('========================\n');

const logoPath = path.join(__dirname, 'assets', 'images', 'Supfitlogo.png');
const stats = fs.statSync(logoPath);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log(`Current logo size: ${sizeKB} KB`);
console.log('\nTo optimize the logo, you have two options:\n');

console.log('Option 1: Use an online tool (Recommended)');
console.log('  1. Go to https://tinypng.com or https://squoosh.app');
console.log('  2. Upload: assets/images/Supfitlogo.png');
console.log('  3. Download the optimized version');
console.log('  4. Replace the original file\n');

console.log('Option 2: Use sharp (npm package)');
console.log('  Run: npm install --save-dev sharp');
console.log('  Then run: node optimize-logo-sharp.js\n');

console.log('Target: Reduce to ~20-30 KB for optimal performance');

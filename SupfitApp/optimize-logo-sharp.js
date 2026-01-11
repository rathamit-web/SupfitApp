const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'assets', 'images', 'Supfitlogo.png');
const outputPath = path.join(__dirname, 'assets', 'images', 'Supfitlogo-optimized.png');
const backupPath = path.join(__dirname, 'assets', 'images', 'Supfitlogo-original.png');

async function optimizeLogo() {
  try {
    // Backup original
    fs.copyFileSync(inputPath, backupPath);
    console.log('✓ Original logo backed up');

    // Get original size
    const originalStats = fs.statSync(inputPath);
    const originalSize = (originalStats.size / 1024).toFixed(2);

    // Optimize with sharp
    await sharp(inputPath)
      .resize(520, 200, { // 2x resolution for retina displays
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({
        quality: 85,
        compressionLevel: 9,
        palette: true // Use palette-based PNG for smaller size
      })
      .toFile(outputPath);

    // Get optimized size
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
    const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

    console.log(`✓ Logo optimized successfully!`);
    console.log(`  Original: ${originalSize} KB`);
    console.log(`  Optimized: ${optimizedSize} KB`);
    console.log(`  Reduction: ${reduction}%`);
    console.log(`\nOptimized logo saved as: Supfitlogo-optimized.png`);
    console.log('Original backed up as: Supfitlogo-original.png');
    console.log('\nTo use the optimized version:');
    console.log('  1. Review Supfitlogo-optimized.png');
    console.log('  2. If satisfied, replace the original:');
    console.log('     mv assets/images/Supfitlogo-optimized.png assets/images/Supfitlogo.png');

  } catch (error) {
    console.error('Error optimizing logo:', error.message);
    console.log('\nIf sharp is not installed, run:');
    console.log('  npm install --save-dev sharp');
  }
}

optimizeLogo();

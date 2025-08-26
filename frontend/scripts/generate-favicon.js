const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { JSDOM } = require('jsdom');
const svg2png = require('svg2png');
const toIco = require('to-ico');

// Path to the SVG logo
const svgPath = path.resolve(__dirname, '../public/logo.svg');
const faviconPath = path.resolve(__dirname, '../public/favicon.ico');
const png192Path = path.resolve(__dirname, '../public/logo192.png');
const png512Path = path.resolve(__dirname, '../public/logo512.png');

async function generateFavicon() {
  try {
    // Read the SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Convert SVG to PNG buffer at different sizes
    const png16 = await svg2png(Buffer.from(svgContent), { width: 16, height: 16 });
    const png32 = await svg2png(Buffer.from(svgContent), { width: 32, height: 32 });
    const png48 = await svg2png(Buffer.from(svgContent), { width: 48, height: 48 });
    const png192 = await svg2png(Buffer.from(svgContent), { width: 192, height: 192 });
    const png512 = await svg2png(Buffer.from(svgContent), { width: 512, height: 512 });
    
    // Create favicon.ico
    const ico = await toIco([png16, png32, png48]);
    fs.writeFileSync(faviconPath, ico);
    
    // Save the larger PNGs for PWA
    fs.writeFileSync(png192Path, png192);
    fs.writeFileSync(png512Path, png512);
    
    console.log('Favicon and logo images generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon(); 
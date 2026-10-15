const sharp = require('sharp');
const fs = require('fs');

async function generateHorizontalLogo() {
  // Use trimmed icon
  if (fs.existsSync('public/logo-icon-trimmed.png')) {
    fs.copyFileSync('public/logo-icon-trimmed.png', 'public/logo-icon.png');
    fs.unlinkSync('public/logo-icon-trimmed.png');
  }

  const iconBuffer = await sharp('public/logo-icon.png')
    .resize(160, 160, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // Create an SVG with modern eye-catching typography
  // Outfit / Plus Jakarta Sans style
  const svgText = Buffer.from(`
    <svg width="540" height="160" viewBox="0 0 540 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="marketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#16a34a"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#16a34a" flood-opacity="0.15"/>
        </filter>
      </defs>
      <g filter="url(#softGlow)">
        <text x="10" y="98" font-family="'Outfit', 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="70" font-weight="800" fill="#14532d" letter-spacing="-1.5">
          Clean<tspan fill="url(#marketGrad)" font-weight="800" dx="10">Market</tspan>
        </text>
      </g>
      <text x="14" y="132" font-family="'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="700" fill="#52796f" letter-spacing="4.5">
        THỰC PHẨM SẠCH &amp; TỰ NHIÊN
      </text>
    </svg>
  `);

  await sharp({
    create: {
      width: 710,
      height: 160,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: iconBuffer, top: 0, left: 0 },
    { input: svgText, top: 0, left: 165 }
  ])
  .png()
  .toFile('public/logo-horizontal.png');

  // Also replace public/logo.png with the new horizontal version
  fs.copyFileSync('public/logo-horizontal.png', 'public/logo.png');

  console.log('Updated public/logo.png & public/logo-horizontal.png with zero stray pixels and high res!');
}

generateHorizontalLogo().catch(console.error);

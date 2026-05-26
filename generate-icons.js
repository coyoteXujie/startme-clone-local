const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="url(#grad)"/>
  <path d="M40 24h48v80H40V24zm16 16v48l32-24-32-24z" fill="white" opacity="0.95"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00809d"/>
      <stop offset="100%" stop-color="#2932e1"/>
    </linearGradient>
  </defs>
</svg>`;

const sizes = [16, 48, 128, 440];
const outputDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach((size) => {
  const svg = svgTemplate(size);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const filename = `icon${size}.png`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, pngBuffer);
  console.log(`Generated: ${filename} (${pngBuffer.length} bytes, ${size}x${size})`);
});

console.log('\nAll icons generated successfully!');

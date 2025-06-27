// scripts/generate-skill-manifest.js
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'assets', 'skills');
const out = path.join(dir, 'skills-manifest.json');

fs.readdir(dir, (err, files) => {
  if (err) {
    console.error('Could not read skills folder:', err);
    process.exit(1);
  }
  // Keep only images
  const imgs = files.filter(f => /\.(png|jpe?g|svg)$/.test(f));
  fs.writeFileSync(out, JSON.stringify(imgs, null, 2));
  console.log(`Wrote ${imgs.length} entries to skills-manifest.json`);
});

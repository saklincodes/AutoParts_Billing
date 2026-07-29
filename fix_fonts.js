const fs = require('fs');
const path = require('path');

function getAllHtml(dir) {
  let results = [];
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return []; }
  for (const item of items) {
    if (['android', '.git', 'node_modules', 'stitch_autoparts_billing_pro'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllHtml(full));
    } else if (item.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const wwwDir = path.resolve('www');
const files = getAllHtml(wwwDir);
let changed = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  
  if (!content.includes('fonts.googleapis.com')) continue;
  
  const depth = path.relative(wwwDir, path.dirname(f)).split(path.sep).filter(Boolean).length;
  const prefix = depth === 0 ? '.' : Array(depth).fill('..').join('/');
  const offlineFontsPath = prefix + '/offline-fonts.css';
  
  // Remove all Google Fonts links and replace with single offline CSS
  // Pattern: all link tags pointing to fonts.googleapis.com
  const googleFontPattern = /<link[^>]*href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*\/>/g;
  
  let firstFontFound = false;
  content = content.replace(googleFontPattern, (match) => {
    if (!firstFontFound) {
      firstFontFound = true;
      return '<link href="' + offlineFontsPath + '" rel="stylesheet"/>';
    }
    return ''; // Remove subsequent Google Font links
  });
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fonts fixed:', path.relative(wwwDir, f));
  changed++;
}

console.log('\nTotal files updated:', changed);

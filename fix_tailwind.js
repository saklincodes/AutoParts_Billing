const fs = require('fs');
const path = require('path');

function getAllHtml(dir) {
  let results = [];
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return []; }
  for (const item of items) {
    if (['android', '.git', 'node_modules'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllHtml(full));
    } else if (item.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const dirsToProcess = [
  path.resolve('stitch_autoparts_billing_pro/stitch_autoparts_billing_pro'),
  path.resolve('www')
];

let totalFiles = 0;

for (const d of dirsToProcess) {
  const htmlFiles = getAllHtml(d);
  for (const f of htmlFiles) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // Replace any tailwind script tag with CDN + fallback
    content = content.replace(
      /<script[^>]*src="[^"]*tailwind[^"]*"[^>]*><\/script>/gi,
      '<script src="https://cdn.tailwindcss.com"></script><script src="/static/tailwind.min.js" onerror="this.onerror=null;this.src=\'../tailwind.min.js\'"></script>'
    );

    if (content !== original) {
      fs.writeFileSync(f, content, 'utf8');
      totalFiles++;
    }
  }
}

console.log(`Updated Tailwind CDN in ${totalFiles} HTML files!`);

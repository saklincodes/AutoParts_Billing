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
  if (content.includes('cdn.tailwindcss.com')) {
    // All html files are inside www/subfolder/code.html — so tailwind is ../tailwind.min.js
    const depth = path.relative(wwwDir, path.dirname(f)).split(path.sep).filter(Boolean).length;
    const prefix = depth === 0 ? '.' : Array(depth).fill('..').join('/');
    const localPath = prefix + '/tailwind.min.js';
    
    content = content.split('<script src="https://cdn.tailwindcss.com"></script>').join(
      '<script src="' + localPath + '"></script>'
    );
    
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed:', path.relative(wwwDir, f), '-> ' + localPath);
    changed++;
  }
}
console.log('\nTotal files fixed:', changed);

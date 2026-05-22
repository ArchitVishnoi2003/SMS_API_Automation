const fs = require('fs');
const path = require('path');

const viewsPath = path.join(__dirname, 'src', 'views.js');
let content = fs.readFileSync(viewsPath, 'utf8');

const MARKERS = [
  '<!-- GridScan Three.js Background -->',
  '<!-- GridScan WebGL -->',
  '<!-- GridScan WebGL Background -->'
];
let start = -1;
for (const m of MARKERS) {
  start = content.indexOf(m);
  if (start !== -1) break;
}

if (start !== -1) {
  // Find the last </script> after the block start
  // The block has two scripts if it uses importmap. Let's just find the closing script of the module.
  let end = content.indexOf('</script>', start);
  if (content.substring(start, end).includes('type="importmap"')) {
    end = content.indexOf('</script>', end + 1);
  }
  end += '</script>'.length;
  
  const cleanReplacement = `<!-- GridScan WebGL Background (Bundled) -->
<style>
  #gridscan-bg { position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;display:block;pointer-events:none; }
  .glass-panel { position:relative;z-index:10; }
</style>
<script src="/gridscan.bundle.js"></script>`;

  const newContent = content.slice(0, start) + cleanReplacement + content.slice(end);
  fs.writeFileSync(viewsPath, newContent, 'utf8');
  console.log('views.js updated to use bundle');
} else {
  console.log('marker not found');
}

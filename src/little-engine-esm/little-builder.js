import fs from 'fs'; // node

const headerFile = fs.readFileSync('./src/little-engine-esm/little-header.js');
const engineFile = fs.readFileSync('./node_modules/littlejsengine/engine/engine.all.js');
const footerFile = fs.readFileSync('./src/little-engine-esm/little-footer.js');
const file = [headerFile, engineFile, footerFile].join('\n\n');
fs.writeFileSync('./src/little-engine-esm/little-engine-esm-build.all.js', file);

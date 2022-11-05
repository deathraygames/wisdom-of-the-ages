import fs from 'fs'; // node

const header = '// little-engine-esm\n// This file was built - Do not edit directly';
const engineFile = fs.readFileSync('./node_modules/littlejsengine/engine/engine.all.js');
const footerFile = fs.readFileSync('./src/little-engine-esm/little-footer.js');
const file = [header, engineFile, footerFile].join('\n\n');
fs.writeFileSync('./src/little-engine-esm/little-engine-esm-build.all.js', file);

const fs = require('fs');
const path = './app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix common issues:
// 1. Missing closing braces in object literals within JSX props
content = content.replace(/style={{([^}]+?)>\s*$/gm, 'style={{$1}}>\n');

// 2. Fix lines ending with just `, should have }`
content = content.replace(/,\s*\n(\s*)}/gm, '\n$1}');

fs.writeFileSync(path, content);
console.log('Fixed syntax issues');

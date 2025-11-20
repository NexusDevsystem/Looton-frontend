const fs = require('fs');
const path = './app/index.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Fix missing closing braces in object literals - línhas 1871-1879
for (let i = 1870; i < 1880 && i < lines.length; i++) {
  if (lines[i].includes(',') && !lines[i].includes('}')) {
    lines[i] = lines[i].replace(/,\s*$/, ' },');
  }
}

// Fix linha 1854 - remove extra closing brace
if (lines[1853] && lines[1853].includes('</TouchableOpacity>') && lines[1854] && lines[1854].trim() === '</View>') {
  // Fix extra View closing tag
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed all syntax issues');

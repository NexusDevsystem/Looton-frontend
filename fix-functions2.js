const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/index.tsx', 'utf8');

// Fix 1: Line 1216 - missing closing brace for object
content = content.replace(
  /url: `https:\/\/store\.steampowered\.com\/app\/\${appId}\/`\n      \)/,
  'url: `https://store.steampowered.com/app/${appId}/`\n      })'
);

// Fix 2: Lines 1306-1326 - missing closing braces in if-else chain
content = content.replace(
  /return { label: t\('price\.veryLow'\), color: '#10B981', bgColor: 'rgba\(16, 185, 129, 0\.15\)' \n     else if/g,
  "return { label: t('price.veryLow'), color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' };\n    } else if"
);

content = content.replace(
  /return { label: t\('price\.lowest'\), color: '#059669', bgColor: 'rgba\(5, 150, 105, 0\.15\)' \n     else if/g,
  "return { label: t('price.lowest'), color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' };\n    } else if"
);

content = content.replace(
  /return { label: t\('price\.average'\), color: '#F59E0B', bgColor: 'rgba\(245, 158, 11, 0\.15\)' \n     else if/g,
  "return { label: t('price.average'), color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' };\n    } else if"
);

content = content.replace(
  /return { label: t\('price\.high'\), color: '#DC2626', bgColor: 'rgba\(220, 38, 38, 0\.15\)' \n     else if/g,
  "return { label: t('price.high'), color: '#DC2626', bgColor: 'rgba(220, 38, 38, 0.15)' };\n    } else if"
);

content = content.replace(
  /return { label: t\('price\.veryHigh'\), color: '#991B1B', bgColor: 'rgba\(153, 27, 27, 0\.15\)' \n     else if/g,
  "return { label: t('price.veryHigh'), color: '#991B1B', bgColor: 'rgba(153, 27, 27, 0.15)' };\n    } else if"
);

content = content.replace(
  /return { label: t\('price\.good'\), color: '#059669', bgColor: 'rgba\(5, 150, 105, 0\.15\)' \n    \n/,
  "return { label: t('price.good'), color: '#059669', bgColor: 'rgba(5, 150, 105, 0.15)' };\n    }\n"
);

content = content.replace(
  /return { label: t\('price\.normal'\), color: '#6B7280', bgColor: 'rgba\(107, 114, 128, 0\.15\)' \n    \n/,
  "return { label: t('price.normal'), color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.15)' };\n    }\n"
);

content = content.replace(
  /return null\n  \n/,
  'return null;\n  }\n'
);

// Write back
fs.writeFileSync('app/index.tsx', content, 'utf8');
console.log('Fixed syntax errors');

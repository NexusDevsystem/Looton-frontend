const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/index.tsx', 'utf8');

// Split into lines for easier manipulation
let lines = content.split('\n');

// Find and fix handleAddToWishlist
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleAddToWishlist = async')) {
    // Line 1205, add 'try {' at line 1206
    if (lines[i + 1].trim() === '') {
      lines[i + 1] = '    try {';
    }
    // Find the line with console.error and add catch before it
    for (let j = i + 2; j < lines.length && j < i + 20; j++) {
      if (lines[j].includes('console.error') && lines[j].includes('Erro ao adicionar')) {
        // Add catch block before console.error
        lines[j] = '    } catch (error) {\n      ' + lines[j].trim();
        // Find the next empty line and close the catch block
        for (let k = j + 1; k < lines.length && k < j + 5; k++) {
          if (lines[k].trim() === '') {
            lines[k] = '    }\n  }';
            break;
          }
        }
        break;
      }
    }
    break;
  }
}

// Find and fix handleRemoveFromWishlist
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleRemoveFromWishlist = async')) {
    // Add 'try {' at next line
    if (lines[i + 1].trim() === '') {
      lines[i + 1] = '    try {';
    }
    // Find the line with console.error and add catch before it
    for (let j = i + 2; j < lines.length && j < i + 20; j++) {
      if (lines[j].includes('console.error') && lines[j].includes('Erro ao remover')) {
        // Add catch block before console.error
        lines[j] = '    } catch (error) {\n      ' + lines[j].trim();
        // Find the next empty line and close the catch block
        for (let k = j + 1; k < lines.length && k < j + 5; k++) {
          if (lines[k].trim() === '') {
            lines[k] = '    }\n  }';
            break;
          }
        }
        break;
      }
    }
    break;
  }
}

// Find and fix handleUpdateDesiredPrice
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleUpdateDesiredPrice = async')) {
    // Add 'try {' at next line
    if (lines[i + 1].trim() === '') {
      lines[i + 1] = '    try {';
    }
    // Find the line with console.error and add catch before it
    for (let j = i + 2; j < lines.length && j < i + 20; j++) {
      if (lines[j].includes('console.error') && lines[j].includes('Erro ao atualizar')) {
        // Add catch block before console.error
        lines[j] = '    } catch (error) {\n      ' + lines[j].trim();
        // Find the next empty line and close the catch block
        for (let k = j + 1; k < lines.length && k < j + 5; k++) {
          if (lines[k].trim() === '') {
            lines[k] = '    }\n  }';
            break;
          }
        }
        break;
      }
    }
    break;
  }
}

// Write back
content = lines.join('\n');
fs.writeFileSync('app/index.tsx', content, 'utf8');
console.log('Fixed all three functions');

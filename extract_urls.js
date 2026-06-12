const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\gopic\\.gemini\\antigravity-ide\\brain\\90f3e38d-6da2-47ee-9037-eacc553d07ee\\.system_generated\\steps\\133\\content.md', 'utf8');

const matches = content.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"']*)?/g) || [];
const unique = [...new Set(matches)];
console.log(unique.filter(u => !u.includes('w3.org') && !u.includes('reactjs.org') && !u.includes('google')));

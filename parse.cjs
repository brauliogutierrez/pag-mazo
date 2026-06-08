const fs = require('fs');
const html = fs.readFileSync('oferta_raw.html', 'utf16le'); // Out-File uses utf16le by default in some powershell versions, but if it fails, fallback to utf8. Let's just try utf16le or utf8. Wait, Out-File in pwsh 7+ is UTF-8 without BOM, but let's just use utf8 first and if it looks bad we change it.
// Actually, let's just read it as a string
let content;
try {
  content = fs.readFileSync('oferta_raw.html', 'utf8');
  if (content.includes('\u0000')) {
    content = fs.readFileSync('oferta_raw.html', 'utf16le');
  }
} catch(e) {
  content = fs.readFileSync('oferta_raw.html', 'utf8');
}

const articleMatch = content.match(/<div class="entry-content">([\s\S]*?)<\/div>\s*<!-- \.entry-content -->/);
if (articleMatch) {
  let articleContent = articleMatch[1];
  fs.writeFileSync('oferta_article.html', articleContent);
  console.log('Extracted successfully!');
} else {
  console.log('Could not find entry-content');
  // fallback search for something else
  const fallback = content.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/);
  if (fallback) {
    fs.writeFileSync('oferta_article.html', fallback[1]);
    console.log('Extracted article successfully!');
  } else {
    console.log('Could not find article either');
  }
}

const res = await fetch('https://quaternius.com/animviewer.html');
const html = await res.text();
console.log(html.slice(html.indexOf('<script src="index.js">') - 200, html.indexOf('</html>')));

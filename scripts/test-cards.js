const fs = require('fs');
const p = 'D:\\codes\\GitHub\\1nuo-blog\\source\\\u6d4b\u8bd5\\tarot-app\\cards.json';
const c = fs.readFileSync(p, 'utf-8');
eval(c);
const cards = CARDS.cards || CARDS;
console.log('OK:', cards.length, 'cards');
console.log('First:', cards[0].name, cards[0].img);
console.log('Last:', cards[cards.length-1].name, cards[cards.length-1].img);

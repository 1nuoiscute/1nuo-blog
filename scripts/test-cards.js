const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'source', 'explore', 'tarot-app', 'cards.json');
const source = fs.readFileSync(file, 'utf8');
const context = {};
vm.runInNewContext(source, context, { filename: file });
const cards = context.CARDS && (context.CARDS.cards || context.CARDS);

if (!Array.isArray(cards) || cards.length === 0) {
  throw new Error(`No tarot cards found in ${file}`);
}

console.log('OK:', cards.length, 'cards');
console.log('First:', cards[0].name, cards[0].img);
console.log('Last:', cards[cards.length-1].name, cards[cards.length-1].img);

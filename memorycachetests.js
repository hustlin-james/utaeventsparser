var m = require('./memorycache').memorycache(2);

m.add('james', {name:'james'});
m.add('phill', {name:'phill'});
m.add('bill', {name: 'bill'});

m.print();
console.log('\n\n');
console.log(m.get('phill'));
m.print();
console.log('\n\n');
m.add('joe', {name: 'joe'});
m.print();
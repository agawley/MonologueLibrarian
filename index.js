const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const transformDataFrom7BitTo8Bit = require('./utilities').transformDataFrom7BitTo8Bit;
const decodeSysEx = require('./monologue').decodeSysEx;

// data.csv is just the output of console.log-ing the WebMidi output of the SysEx dump from the Minilogue
var file = fs.readFileSync('./data1.csv', 'utf8');
const records = parse(file, [])[0];

const data = transformDataFrom7BitTo8Bit(records);
console.log(decodeSysEx(data).toString());

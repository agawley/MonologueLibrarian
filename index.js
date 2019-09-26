const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const transformDataFrom7BitTo8Bit = require('./utilities').transformDataFrom7BitTo8Bit;
const Monologue = require('./monologue');

var easymidi = require('easymidi');
var input = new easymidi.Input('monologue KBD/KNOB');
input.on('sysex', function (msg) {
  const data = transformDataFrom7BitTo8Bit(msg.bytes);
  console.log(Monologue.createFromSysEx(data).toString());
});

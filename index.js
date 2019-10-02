const transformDataFrom7BitTo8Bit = require('./utilities').transformDataFrom7BitTo8Bit;
const Monologue = require('./monologue');

const easymidi = require('easymidi');
const input = new easymidi.Input('monologue KBD/KNOB');
input.on('sysex', function (msg) {
  const data = transformDataFrom7BitTo8Bit(msg.bytes);
  console.log(Monologue.createFromSysEx(data).toString());
});

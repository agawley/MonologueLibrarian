//TODO: Add Int checking
function bin(dec, padding) {
  return dec.toString(2).padStart(padding || 8,'0');
}

// TODO: Add range out of bounds checking
function getBits(num, start, end) {
  const bits = bin(num);
  return parseInt(bits.slice(-end-1, start ? -start : undefined), 2);
}

function addLowerBits(numForHighBits, numForLowBits, offset) {
  const hiBits = bin(numForHighBits);
  const loBits = bin(numForLowBits).slice(-offset-2, offset ? -offset : undefined);
  const tenBitString = hiBits + loBits;
  return parseInt(tenBitString,2);
}

function addHighBit(numForLowBits, numForHighBit, offset) {
  const loBits = bin(numForLowBits, 7);
  const hiBit = bin(numForHighBit).slice(-offset-1, offset ? -offset : undefined);
  const eightBitString = hiBit + loBits;
  return parseInt(eightBitString,2);
}

function transformDataFrom7BitTo8Bit(records) {

  // remove the the header and footer bytes
  const sBitValues = records.slice(7,records.length - 1);
  const setArray = [];
  let index = 0;
  while (index < sBitValues.length) {
    setArray.push(sBitValues.slice(index, 8+index));
    index += 8;
  }
  const eBitValues = [];
  for (const set of setArray) {
    for (let j = 1; j < 8; j++) {
      eBitValues.push(addHighBit(set[j]*1, set[0]*1, j-1));
    }
  }
  return eBitValues;
}

module.exports = { bin, getBits, addLowerBits, addHighBit, transformDataFrom7BitTo8Bit };

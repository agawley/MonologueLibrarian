const util = require('../utilities');



describe('Utilities tests', () => {
  describe('bin()', () => {
    it('returns 8 bit zero-padded binary representation by default', () => {
      const testValue = 100;
      const expectedResponse = "01100100";
      expect(util.bin(testValue)).toEqual(expectedResponse);
    });
    it('returns 7 bit zero-padded binary representation when passed padding variable', () => {
      const testValue = 20;
      const expectedResponse = "0010100";
      expect(util.bin(testValue, 7)).toEqual(expectedResponse);
    });
  });
  describe('getBits()', () => {
    it('returns the number represented by the binary digits at a mid section slice', () => {
      const testValue = 157; // 0b10011101
      const start = 3;
      const end = 5;
      const expectedResponse = 3; // 0b011
      expect(util.getBits(testValue, start, end)).toEqual(expectedResponse);
    });
    it('returns the number represented by the binary digits at a start slice', () => {
      const testValue = 157; // 0b10011101
      const start = 5;
      const end = 7;
      const expectedResponse = 4; // 0b100
      expect(util.getBits(testValue, start, end)).toEqual(expectedResponse);
    });
    it('returns the number represented by the binary digits at an end slice', () => {
      const testValue = 157; // 0b10011101
      const start = 0;
      const end = 3;
      const expectedResponse = 13; // 0b1101
      expect(util.getBits(testValue, start, end)).toEqual(expectedResponse);
    });
    it('returns the number represented by the binary digits at a one bit', () => {
      const testValue = 157; // 0b10011101
      const start = 1;
      const end = 1;
      const expectedResponse = 0; // 0b0
      expect(util.getBits(testValue, start, end)).toEqual(expectedResponse);
    });
    it('works for zero', () => {
      const testValue = 0; // 0b00000000
      const start = 6;
      const end = 7;
      const expectedResponse = 0; // 0b0
      expect(util.getBits(testValue, start, end)).toEqual(expectedResponse);
    });

  });
  describe('addLowerBits()', () => {
    it('correctly returns 10-bit number from 2 8-bit numbers using last two digits of second as low bits', () => {
      const testValueHighBits = 179; // 0b10110011
      const testValueLowBits = 201; // 0b11001001
      const expectedResponse = 717; // 0b1011001101
      expect(util.addLowerBits(testValueHighBits, testValueLowBits, 0)).toEqual(expectedResponse);
    });
    it('correctly returns 10-bit number from 2 8-bit numbers using arbitrary two digits of second as low bits', () => {
      const testValueHighBits = 179; // 0b10110011
      const testValueLowBits = 201; // 0b11001001
      const expectedResponse = 716; // 0b1011001100
      expect(util.addLowerBits(testValueHighBits, testValueLowBits, 4)).toEqual(expectedResponse);
    });
  });
  describe('addHighBit()', () => {
    it('correctly returns 8-bit number from 2 8-bit numbers using last digit of second to replace high bit of first', () => {
      const testValueLowBits = 111; // 0b1101111
      const testValueHighBit = 83; // 0b1010011
      const expectedResponse = 239; // 0b11101111
      expect(util.addHighBit(testValueLowBits, testValueHighBit, 0)).toEqual(expectedResponse);
    });
    it('correctly returns 8-bit number from 2 8-bit numbers using arbitrary digit of second to replace high bit of first', () => {
      const testValueLowBits = 111; // 0b1101111
      const testValueHighBit = 83; // 0b1010011
      const expectedResponse = 111; // 0b01101111
      expect(util.addHighBit(testValueLowBits, testValueHighBit, 5)).toEqual(expectedResponse);
    });
  });
  describe('transformDataFrom7BitTo8Bit()', () => {
    it('correctly transforms the test data', () => {
      const records = [ /* headers */ 240,66,49,0,1,68,64, /* set 1 */ 0,80,82,79,71,73,110,105, /* set 2 */ 84,97,109,0,127,0,0,127,247];
      const expectedResponse = [/* set 1 unchanged */ 80,82,79,71,73,110,105, /* set 2 updated*/ 97,109,128,127,128,0,255 ];
      /*
      Set 2 updates:
      High Bit Number: 84 0b01010100
      97 0b1100001 => 0b01100001 97
      109 0b1101101 => 0b01101101 109
      0 0b0000000 => 0b10000000 128
      127 0b1111111 => 0b01111111 127
      0 0b0000000 => 0b10000000 128
      0 0b0000000 => 0b00000000 0
      127 0b1111111 => 0b01111111 255
      */
      expect(util.transformDataFrom7BitTo8Bit(records)).toEqual(expectedResponse);
    });
  });
});
